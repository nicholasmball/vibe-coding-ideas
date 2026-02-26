"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { POSITION_GAP } from "@/lib/constants";
import {
  validateDiscussionTitle,
  validateDiscussionBody,
  validateDiscussionReply,
  validateTitle,
} from "@/lib/validation";
import type { DiscussionStatus } from "@/types";

export async function createDiscussion(
  ideaId: string,
  title: string,
  body: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  title = validateDiscussionTitle(title);
  body = validateDiscussionBody(body);

  const { data, error } = await supabase
    .from("idea_discussions")
    .insert({
      idea_id: ideaId,
      author_id: user.id,
      title,
      body,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/ideas/${ideaId}/discussions`);
  revalidatePath(`/ideas/${ideaId}`);

  return data.id;
}

export async function updateDiscussion(
  discussionId: string,
  ideaId: string,
  updates: {
    title?: string;
    body?: string;
    status?: DiscussionStatus;
    pinned?: boolean;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Verify user is discussion author, idea owner, or admin
  const { data: discussion } = await supabase
    .from("idea_discussions")
    .select("author_id")
    .eq("id", discussionId)
    .single();

  if (!discussion) throw new Error("Discussion not found");

  const { data: idea } = await supabase
    .from("ideas")
    .select("author_id")
    .eq("id", ideaId)
    .single();

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const isAuthorOrOwner =
    user.id === discussion.author_id || user.id === idea?.author_id;
  const isAdmin = profile?.is_admin ?? false;

  if (!isAuthorOrOwner && !isAdmin) {
    throw new Error("You don't have permission to update this discussion");
  }

  const updateData: Record<string, unknown> = {};

  if (updates.title !== undefined) {
    updateData.title = validateDiscussionTitle(updates.title);
  }
  if (updates.body !== undefined) {
    updateData.body = validateDiscussionBody(updates.body);
  }
  if (updates.status !== undefined) {
    updateData.status = updates.status;
  }
  if (updates.pinned !== undefined) {
    updateData.pinned = updates.pinned;
  }

  if (Object.keys(updateData).length === 0) return;

  const { error } = await supabase
    .from("idea_discussions")
    .update(updateData)
    .eq("id", discussionId);

  if (error) throw new Error(error.message);

  revalidatePath(`/ideas/${ideaId}/discussions`);
  revalidatePath(`/ideas/${ideaId}/discussions/${discussionId}`);
}

export async function deleteDiscussion(discussionId: string, ideaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Verify user is discussion author, idea owner, or admin
  const { data: discussion } = await supabase
    .from("idea_discussions")
    .select("author_id")
    .eq("id", discussionId)
    .single();

  if (!discussion) throw new Error("Discussion not found");

  const { data: idea } = await supabase
    .from("ideas")
    .select("author_id")
    .eq("id", ideaId)
    .single();

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const isAuthorOrOwner =
    user.id === discussion.author_id || user.id === idea?.author_id;
  const isAdmin = profile?.is_admin ?? false;

  if (!isAuthorOrOwner && !isAdmin) {
    throw new Error("You don't have permission to delete this discussion");
  }

  const { error } = await supabase
    .from("idea_discussions")
    .delete()
    .eq("id", discussionId);

  if (error) throw new Error(error.message);

  revalidatePath(`/ideas/${ideaId}/discussions`);
  revalidatePath(`/ideas/${ideaId}`);
}

export async function createDiscussionReply(
  discussionId: string,
  ideaId: string,
  content: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  content = validateDiscussionReply(content);

  const { data, error } = await supabase
    .from("idea_discussion_replies")
    .insert({
      discussion_id: discussionId,
      author_id: user.id,
      content,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/ideas/${ideaId}/discussions/${discussionId}`);

  return data.id;
}

export async function updateDiscussionReply(
  replyId: string,
  ideaId: string,
  discussionId: string,
  content: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Verify user is the reply author
  const { data: reply } = await supabase
    .from("idea_discussion_replies")
    .select("author_id")
    .eq("id", replyId)
    .single();

  if (!reply) throw new Error("Reply not found");

  if (user.id !== reply.author_id) {
    throw new Error("You don't have permission to edit this reply");
  }

  content = validateDiscussionReply(content);

  const { error } = await supabase
    .from("idea_discussion_replies")
    .update({ content })
    .eq("id", replyId);

  if (error) throw new Error(error.message);

  revalidatePath(`/ideas/${ideaId}/discussions/${discussionId}`);
}

export async function deleteDiscussionReply(
  replyId: string,
  ideaId: string,
  discussionId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Verify user is reply author, discussion author, idea owner, or admin
  const { data: reply } = await supabase
    .from("idea_discussion_replies")
    .select("author_id")
    .eq("id", replyId)
    .single();

  if (!reply) throw new Error("Reply not found");

  const { data: discussion } = await supabase
    .from("idea_discussions")
    .select("author_id")
    .eq("id", discussionId)
    .single();

  const { data: idea } = await supabase
    .from("ideas")
    .select("author_id")
    .eq("id", ideaId)
    .single();

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const isReplyAuthor = user.id === reply.author_id;
  const isDiscussionAuthor = user.id === discussion?.author_id;
  const isIdeaOwner = user.id === idea?.author_id;
  const isAdmin = profile?.is_admin ?? false;

  if (!isReplyAuthor && !isDiscussionAuthor && !isIdeaOwner && !isAdmin) {
    throw new Error("You don't have permission to delete this reply");
  }

  const { error } = await supabase
    .from("idea_discussion_replies")
    .delete()
    .eq("id", replyId);

  if (error) throw new Error(error.message);

  revalidatePath(`/ideas/${ideaId}/discussions/${discussionId}`);
}

export async function toggleDiscussionVote(discussionId: string, ideaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: existingVote } = await supabase
    .from("discussion_votes")
    .select("id")
    .eq("discussion_id", discussionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingVote) {
    const { error } = await supabase
      .from("discussion_votes")
      .delete()
      .eq("discussion_id", discussionId)
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("discussion_votes")
      .insert({ discussion_id: discussionId, user_id: user.id });
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/ideas/${ideaId}/discussions`);
  revalidatePath(`/ideas/${ideaId}/discussions/${discussionId}`);
}

export async function convertDiscussionToTask(
  discussionId: string,
  ideaId: string,
  columnId: string,
  taskTitle?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Get the discussion
  const { data: discussion, error: fetchError } = await supabase
    .from("idea_discussions")
    .select("id, title, body, status")
    .eq("id", discussionId)
    .single();

  if (fetchError || !discussion) throw new Error("Discussion not found");
  if (discussion.status === "converted") {
    throw new Error("Discussion has already been converted to a task");
  }

  // Validate task title (use discussion title if not provided)
  const title = validateTitle(taskTitle || discussion.title);

  // Get max position in the target column
  const { data: tasks } = await supabase
    .from("board_tasks")
    .select("position")
    .eq("column_id", columnId)
    .order("position", { ascending: false })
    .limit(1);

  const maxPos = tasks && tasks.length > 0 ? tasks[0].position : -POSITION_GAP;

  // Create the board task with discussion backlink
  const { data: task, error: taskError } = await supabase
    .from("board_tasks")
    .insert({
      idea_id: ideaId,
      column_id: columnId,
      title,
      description: `From discussion: ${discussion.title}\n\n${discussion.body}`,
      discussion_id: discussionId,
      position: maxPos + POSITION_GAP,
    })
    .select("id")
    .single();

  if (taskError) throw new Error(taskError.message);

  // Mark discussion as converted
  const { error: updateError } = await supabase
    .from("idea_discussions")
    .update({ status: "converted" })
    .eq("id", discussionId);

  if (updateError) throw new Error(updateError.message);

  revalidatePath(`/ideas/${ideaId}/discussions`);
  revalidatePath(`/ideas/${ideaId}/discussions/${discussionId}`);
  revalidatePath(`/ideas/${ideaId}/board`);

  return task.id;
}
