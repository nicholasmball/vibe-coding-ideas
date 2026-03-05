import { z } from "zod";
import { POSITION_GAP } from "../constants";
import { logActivity } from "../activity";
import type { McpContext } from "../context";

// --- create_workflow_steps ---

export const createWorkflowStepsSchema = z.object({
  task_id: z.string().uuid().describe("The task ID"),
  idea_id: z.string().uuid().describe("The idea ID"),
  steps: z
    .array(
      z.object({
        title: z.string().min(1).max(200).describe("Step title"),
        description: z.string().max(10000).optional().describe("Step description"),
        bot_id: z.string().uuid().describe("The agent (bot user ID) for this step"),
      })
    )
    .min(1)
    .max(50)
    .describe("Ordered list of workflow steps to create"),
});

export async function createWorkflowSteps(
  ctx: McpContext,
  params: z.infer<typeof createWorkflowStepsSchema>
) {
  // Get max existing position
  const { data: existing } = await ctx.supabase
    .from("task_workflow_steps")
    .select("position")
    .eq("task_id", params.task_id)
    .order("position", { ascending: false })
    .limit(1);

  let nextPos = (existing?.[0]?.position ?? 0) + POSITION_GAP;

  const rows = params.steps.map((step) => {
    const row = {
      task_id: params.task_id,
      idea_id: params.idea_id,
      bot_id: step.bot_id,
      title: step.title,
      description: step.description ?? null,
      position: nextPos,
    };
    nextPos += POSITION_GAP;
    return row;
  });

  const { data, error } = await ctx.supabase
    .from("task_workflow_steps")
    .insert(rows)
    .select("id, title, position, bot_id, status");

  if (error) throw new Error(`Failed to create workflow steps: ${error.message}`);

  for (const step of data ?? []) {
    await logActivity(ctx, params.task_id, params.idea_id, "workflow_step_added", {
      title: step.title,
    });
  }

  return { success: true, steps: data };
}

// --- get_next_step ---

export const getNextStepSchema = z.object({
  task_id: z.string().uuid().describe("The task ID"),
  idea_id: z.string().uuid().describe("The idea ID"),
});

export async function getNextStep(
  ctx: McpContext,
  params: z.infer<typeof getNextStepSchema>
) {
  // Get all steps ordered by position
  const { data: steps, error } = await ctx.supabase
    .from("task_workflow_steps")
    .select("*, agent:users!task_workflow_steps_bot_id_fkey(id, full_name)")
    .eq("task_id", params.task_id)
    .eq("idea_id", params.idea_id)
    .order("position");

  if (error) throw new Error(`Failed to get workflow steps: ${error.message}`);
  if (!steps || steps.length === 0) return { next_step: null, context: [] };

  // Find first pending or failed step
  const nextStep = steps.find((s) => s.status === "pending" || s.status === "failed");
  if (!nextStep) return { next_step: null, all_completed: true, context: [] };

  // Collect output comments from all completed steps before this one as context
  const completedBefore = steps.filter(
    (s) => s.status === "completed" && s.position < nextStep.position
  );
  const completedIds = completedBefore.map((s) => s.id);

  let context: { step_title: string; output: string }[] = [];
  if (completedIds.length > 0) {
    const { data: outputComments } = await ctx.supabase
      .from("workflow_step_comments")
      .select("step_id, content")
      .in("step_id", completedIds)
      .eq("type", "output")
      .eq("idea_id", params.idea_id);

    const outputByStep = new Map(
      (outputComments ?? []).map((c) => [c.step_id, c.content])
    );
    context = completedBefore
      .filter((s) => outputByStep.has(s.id))
      .map((s) => ({ step_title: s.title, output: outputByStep.get(s.id)! }));
  }

  // Fetch all comments on the next step (inter-agent communication + any failure reasons)
  const { data: comments } = await ctx.supabase
    .from("workflow_step_comments")
    .select("id, type, content, created_at, author:users!workflow_step_comments_author_id_fkey(id, full_name)")
    .eq("step_id", nextStep.id)
    .eq("idea_id", params.idea_id)
    .order("created_at", { ascending: true });

  return {
    next_step: nextStep,
    context,
    comments: comments ?? [],
  };
}

// --- start_step ---

export const startStepSchema = z.object({
  step_id: z.string().uuid().describe("The workflow step ID to start"),
  idea_id: z.string().uuid().describe("The idea ID"),
});

export async function startStep(
  ctx: McpContext,
  params: z.infer<typeof startStepSchema>
) {
  // Race-condition guard: only claim if pending or failed
  const { data, error } = await ctx.supabase
    .from("task_workflow_steps")
    .update({
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .eq("id", params.step_id)
    .eq("idea_id", params.idea_id)
    .in("status", ["pending", "failed"])
    .select("id, task_id, bot_id, title")
    .maybeSingle();

  if (error) throw new Error(`Failed to start step: ${error.message}`);
  if (!data) throw new Error("Step was already claimed or does not exist");

  // Update task assignee to this step's bot
  await ctx.supabase
    .from("board_tasks")
    .update({ assignee_id: data.bot_id })
    .eq("id", data.task_id);

  await logActivity(ctx, data.task_id, params.idea_id, "workflow_step_started", {
    title: data.title,
  });

  return { success: true, step: data };
}

// --- complete_step ---

export const completeStepSchema = z.object({
  step_id: z.string().uuid().describe("The workflow step ID to complete"),
  idea_id: z.string().uuid().describe("The idea ID"),
  output: z.string().max(50000).describe("Structured markdown output/deliverable from this step"),
});

export async function completeStep(
  ctx: McpContext,
  params: z.infer<typeof completeStepSchema>
) {
  const { data, error } = await ctx.supabase
    .from("task_workflow_steps")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", params.step_id)
    .eq("idea_id", params.idea_id)
    .eq("status", "in_progress")
    .select("id, task_id, title, idea_id")
    .maybeSingle();

  if (error) throw new Error(`Failed to complete step: ${error.message}`);
  if (!data) throw new Error("Step is not in progress or does not exist");

  // Post output as a comment on the step thread
  const { error: commentError } = await ctx.supabase
    .from("workflow_step_comments")
    .insert({
      step_id: params.step_id,
      idea_id: params.idea_id,
      author_id: ctx.userId,
      type: "output",
      content: params.output,
    });

  if (commentError) throw new Error(`Failed to save step output: ${commentError.message}`);

  await logActivity(ctx, data.task_id, params.idea_id, "workflow_step_completed", {
    title: data.title,
  });

  return { success: true, step: data };
}

// --- fail_step ---

export const failStepSchema = z.object({
  step_id: z.string().uuid().describe("The current step ID (will be reset to pending)"),
  target_step_id: z.string().uuid().describe("The step that failed (will be marked failed)"),
  idea_id: z.string().uuid().describe("The idea ID"),
  reason: z.string().max(5000).describe("Failure reason"),
});

export async function failStep(
  ctx: McpContext,
  params: z.infer<typeof failStepSchema>
) {
  // Mark target step as failed
  const { data: failedStep, error: failError } = await ctx.supabase
    .from("task_workflow_steps")
    .update({ status: "failed" })
    .eq("id", params.target_step_id)
    .eq("idea_id", params.idea_id)
    .select("task_id, title")
    .maybeSingle();

  if (failError) throw new Error(`Failed to mark step as failed: ${failError.message}`);
  if (!failedStep) throw new Error("Target step not found");

  // Post failure reason as a comment on the step thread
  const { error: commentError } = await ctx.supabase
    .from("workflow_step_comments")
    .insert({
      step_id: params.target_step_id,
      idea_id: params.idea_id,
      author_id: ctx.userId,
      type: "failure",
      content: params.reason,
    });

  if (commentError) throw new Error(`Failed to save failure reason: ${commentError.message}`);

  // Reset current step to pending if different from target
  if (params.step_id !== params.target_step_id) {
    const { error: resetError } = await ctx.supabase
      .from("task_workflow_steps")
      .update({
        status: "pending",
        started_at: null,
      })
      .eq("id", params.step_id)
      .eq("idea_id", params.idea_id);

    if (resetError) throw new Error(`Failed to reset step: ${resetError.message}`);

    await logActivity(ctx, failedStep.task_id, params.idea_id, "workflow_step_reset", {
      title: failedStep.title,
    });
  }

  await logActivity(ctx, failedStep.task_id, params.idea_id, "workflow_step_failed", {
    title: failedStep.title,
    reason: params.reason,
  });

  return { success: true };
}

// --- get_step_context ---

export const getStepContextSchema = z.object({
  task_id: z.string().uuid().describe("The task ID"),
  idea_id: z.string().uuid().describe("The idea ID"),
});

export async function getStepContext(
  ctx: McpContext,
  params: z.infer<typeof getStepContextSchema>
) {
  const { data: steps, error } = await ctx.supabase
    .from("task_workflow_steps")
    .select("*, agent:users!task_workflow_steps_bot_id_fkey(id, full_name)")
    .eq("task_id", params.task_id)
    .eq("idea_id", params.idea_id)
    .order("position");

  if (error) throw new Error(`Failed to get step context: ${error.message}`);

  // Fetch all comments for these steps
  const stepIds = (steps ?? []).map((s) => s.id);
  let commentsByStep: Record<string, { id: string; type: string; content: string; created_at: string; author: unknown }[]> = {};

  if (stepIds.length > 0) {
    const { data: comments } = await ctx.supabase
      .from("workflow_step_comments")
      .select("id, step_id, type, content, created_at, author:users!workflow_step_comments_author_id_fkey(id, full_name)")
      .in("step_id", stepIds)
      .eq("idea_id", params.idea_id)
      .order("created_at", { ascending: true });

    for (const c of comments ?? []) {
      const key = (c as unknown as { step_id: string }).step_id;
      if (!commentsByStep[key]) commentsByStep[key] = [];
      commentsByStep[key].push(c);
    }
  }

  const stepsWithComments = (steps ?? []).map((s) => ({
    ...s,
    comments: commentsByStep[s.id] ?? [],
  }));

  return { steps: stepsWithComments };
}

// --- update_workflow_step ---

export const updateWorkflowStepSchema = z.object({
  step_id: z.string().uuid().describe("The workflow step ID"),
  idea_id: z.string().uuid().describe("The idea ID"),
  title: z.string().min(1).max(200).optional().describe("New title"),
  description: z.string().max(10000).optional().nullable().describe("New description"),
  bot_id: z.string().uuid().optional().describe("New agent assignment"),
  position: z.number().int().optional().describe("New position"),
});

export async function updateWorkflowStep(
  ctx: McpContext,
  params: z.infer<typeof updateWorkflowStepSchema>
) {
  const updates: Record<string, unknown> = {};
  if (params.title !== undefined) updates.title = params.title;
  if (params.description !== undefined) updates.description = params.description;
  if (params.bot_id !== undefined) updates.bot_id = params.bot_id;
  if (params.position !== undefined) updates.position = params.position;

  if (Object.keys(updates).length === 0) {
    throw new Error("No updates provided");
  }

  const { data, error } = await ctx.supabase
    .from("task_workflow_steps")
    .update(updates)
    .eq("id", params.step_id)
    .eq("idea_id", params.idea_id)
    .select("id, title, position, bot_id, status")
    .maybeSingle();

  if (error) throw new Error(`Failed to update workflow step: ${error.message}`);
  if (!data) throw new Error("Workflow step not found");

  return { success: true, step: data };
}

// --- add_step_comment ---

export const addStepCommentSchema = z.object({
  step_id: z.string().uuid().describe("The workflow step ID"),
  idea_id: z.string().uuid().describe("The idea ID"),
  content: z.string().min(1).max(5000).describe("Comment content (markdown). Use this to ask questions, provide feedback, or communicate with other agents."),
});

export async function addStepComment(
  ctx: McpContext,
  params: z.infer<typeof addStepCommentSchema>
) {
  const { data, error } = await ctx.supabase
    .from("workflow_step_comments")
    .insert({
      step_id: params.step_id,
      idea_id: params.idea_id,
      author_id: ctx.userId,
      content: params.content,
    })
    .select("id, content, created_at")
    .single();

  if (error) throw new Error(`Failed to add step comment: ${error.message}`);

  return { success: true, comment: data };
}

// --- get_step_comments ---

export const getStepCommentsSchema = z.object({
  step_id: z.string().uuid().describe("The workflow step ID"),
  idea_id: z.string().uuid().describe("The idea ID"),
});

export async function getStepComments(
  ctx: McpContext,
  params: z.infer<typeof getStepCommentsSchema>
) {
  const { data, error } = await ctx.supabase
    .from("workflow_step_comments")
    .select("*, author:users!workflow_step_comments_author_id_fkey(id, full_name, avatar_url, is_bot)")
    .eq("step_id", params.step_id)
    .eq("idea_id", params.idea_id)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to get step comments: ${error.message}`);

  return { comments: data ?? [] };
}

// --- delete_workflow_step ---

export const deleteWorkflowStepSchema = z.object({
  step_id: z.string().uuid().describe("The workflow step ID to delete"),
  idea_id: z.string().uuid().describe("The idea ID"),
});

export async function deleteWorkflowStep(
  ctx: McpContext,
  params: z.infer<typeof deleteWorkflowStepSchema>
) {
  const { error } = await ctx.supabase
    .from("task_workflow_steps")
    .delete()
    .eq("id", params.step_id)
    .eq("idea_id", params.idea_id);

  if (error) throw new Error(`Failed to delete workflow step: ${error.message}`);

  return { success: true };
}
