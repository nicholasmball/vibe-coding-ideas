"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateTitle, validateOptionalDescription, validateComment } from "@/lib/validation";

export async function createWorkflowStep(
  taskId: string,
  ideaId: string,
  title: string,
  description: string | null,
  botId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  title = validateTitle(title);
  if (description) description = validateOptionalDescription(description) ?? null;

  // Get max position (gap-based: 1000, 2000, etc.)
  const { data: steps } = await supabase
    .from("task_workflow_steps")
    .select("position")
    .eq("task_id", taskId)
    .order("position", { ascending: false })
    .limit(1);

  const maxPos = steps && steps.length > 0 ? steps[0].position : 0;

  const { error } = await supabase.from("task_workflow_steps").insert({
    task_id: taskId,
    idea_id: ideaId,
    bot_id: botId,
    title,
    description,
    position: maxPos + 1000,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/ideas/${ideaId}/board`);
}

export async function updateWorkflowStep(
  stepId: string,
  ideaId: string,
  updates: {
    title?: string;
    description?: string | null;
    bot_id?: string;
    position?: number;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  if (updates.title !== undefined) {
    updates.title = validateTitle(updates.title);
  }
  if (updates.description !== undefined && updates.description !== null) {
    updates.description = validateOptionalDescription(updates.description);
  }

  const { error } = await supabase
    .from("task_workflow_steps")
    .update(updates)
    .eq("id", stepId)
    .eq("idea_id", ideaId);

  if (error) throw new Error(error.message);

  revalidatePath(`/ideas/${ideaId}/board`);
}

export async function deleteWorkflowStep(stepId: string, ideaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("task_workflow_steps")
    .delete()
    .eq("id", stepId)
    .eq("idea_id", ideaId);

  if (error) throw new Error(error.message);

  revalidatePath(`/ideas/${ideaId}/board`);
}

export async function startWorkflowStep(stepId: string, ideaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Fetch the step to get bot_id for assignee update
  const { data: step } = await supabase
    .from("task_workflow_steps")
    .select("bot_id, task_id, status")
    .eq("id", stepId)
    .eq("idea_id", ideaId)
    .single();

  if (!step) throw new Error("Step not found");
  if (step.status !== "pending" && step.status !== "failed") {
    throw new Error("Step is not pending or failed");
  }

  const { error } = await supabase
    .from("task_workflow_steps")
    .update({
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .eq("id", stepId)
    .eq("idea_id", ideaId);

  if (error) throw new Error(error.message);

  // Update task assignee to this step's bot
  await supabase
    .from("board_tasks")
    .update({ assignee_id: step.bot_id })
    .eq("id", step.task_id);

  revalidatePath(`/ideas/${ideaId}/board`);
}

export async function completeWorkflowStep(
  stepId: string,
  ideaId: string,
  output: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("task_workflow_steps")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", stepId)
    .eq("idea_id", ideaId);

  if (error) throw new Error(error.message);

  // Post output as a comment on the step thread
  await supabase.from("workflow_step_comments").insert({
    step_id: stepId,
    idea_id: ideaId,
    author_id: user.id,
    type: "output",
    content: output,
  });

  revalidatePath(`/ideas/${ideaId}/board`);
}

export async function failWorkflowStep(
  stepId: string,
  targetStepId: string,
  ideaId: string,
  reason: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Set target step to failed
  const { error: failError } = await supabase
    .from("task_workflow_steps")
    .update({ status: "failed" })
    .eq("id", targetStepId)
    .eq("idea_id", ideaId);

  if (failError) throw new Error(failError.message);

  // Post failure reason as a comment on the step thread
  await supabase.from("workflow_step_comments").insert({
    step_id: targetStepId,
    idea_id: ideaId,
    author_id: user.id,
    type: "failure",
    content: reason,
  });

  // Reset current step back to pending
  if (stepId !== targetStepId) {
    const { error: resetError } = await supabase
      .from("task_workflow_steps")
      .update({
        status: "pending",
        started_at: null,
      })
      .eq("id", stepId)
      .eq("idea_id", ideaId);

    if (resetError) throw new Error(resetError.message);
  }

  revalidatePath(`/ideas/${ideaId}/board`);
}

export async function addStepComment(
  stepId: string,
  ideaId: string,
  content: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  content = validateComment(content);

  const { error } = await supabase.from("workflow_step_comments").insert({
    step_id: stepId,
    idea_id: ideaId,
    author_id: user.id,
    content,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/ideas/${ideaId}/board`);
}

export async function deleteStepComment(commentId: string, ideaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("workflow_step_comments")
    .delete()
    .eq("id", commentId)
    .eq("idea_id", ideaId);

  if (error) throw new Error(error.message);

  revalidatePath(`/ideas/${ideaId}/board`);
}
