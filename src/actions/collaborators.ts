"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function requestCollaboration(ideaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Check if a request already exists for this idea/user
  const { data: existing } = await supabase
    .from("collaboration_requests")
    .select("id, status")
    .eq("idea_id", ideaId)
    .eq("requester_id", user.id)
    .maybeSingle();

  let requestId: string;

  if (existing?.status === "pending") {
    // Already pending — nothing to do
    revalidatePath(`/ideas/${ideaId}`);
    revalidatePath(`/ideas/${ideaId}/board`);
    return;
  } else if (existing) {
    // Re-request after decline: update back to pending
    const { error } = await supabase
      .from("collaboration_requests")
      .update({ status: "pending" as const })
      .eq("id", existing.id);
    if (error) {
      throw new Error("Failed to submit collaboration request");
    }
    requestId = existing.id;
  } else {
    // New request
    const { data: request, error } = await supabase
      .from("collaboration_requests")
      .insert({ idea_id: ideaId, requester_id: user.id, status: "pending" as const })
      .select("id")
      .single();
    if (error) {
      throw new Error("Failed to submit collaboration request");
    }
    requestId = request.id;
  }

  // Notify the idea author (respects preferences)
  const { data: idea } = await supabase.from("ideas").select("author_id").eq("id", ideaId).single();

  if (idea && idea.author_id !== user.id) {
    const { data: authorProfile } = await supabase
      .from("users")
      .select("notification_preferences")
      .eq("id", idea.author_id)
      .single();

    const prefs = authorProfile?.notification_preferences;
    if (prefs?.collaboration_requests !== false) {
      await supabase.from("notifications").insert({
        user_id: idea.author_id,
        actor_id: user.id,
        type: "collaboration_request" as const,
        idea_id: ideaId,
        collaboration_request_id: requestId,
      });
    }
  }

  revalidatePath(`/ideas/${ideaId}`);
  revalidatePath(`/ideas/${ideaId}/board`);
}

export async function withdrawRequest(ideaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("collaboration_requests")
    .delete()
    .eq("idea_id", ideaId)
    .eq("requester_id", user.id)
    .eq("status", "pending");

  if (error) {
    throw new Error("Failed to withdraw collaboration request");
  }

  revalidatePath(`/ideas/${ideaId}`);
  revalidatePath(`/ideas/${ideaId}/board`);
}

export async function respondToRequest(requestId: string, ideaId: string, accept: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Verify caller is the idea author
  const { data: idea } = await supabase.from("ideas").select("author_id").eq("id", ideaId).single();

  if (!idea || idea.author_id !== user.id) {
    throw new Error("Only the idea author can respond to requests");
  }

  // Fetch the request to get requester_id (verify it belongs to this idea)
  const { data: request } = await supabase
    .from("collaboration_requests")
    .select("requester_id, status")
    .eq("id", requestId)
    .eq("idea_id", ideaId)
    .maybeSingle();

  if (!request) {
    throw new Error("Request not found");
  }

  // Already handled — mark stale notifications as read, ensure collaborator exists if accepted
  if (request.status !== "pending") {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("collaboration_request_id", requestId)
      .eq("type", "collaboration_request");

    // If the request was accepted but the collaborator insert failed previously, fix it now
    if (request.status === "accepted") {
      await supabase
        .from("collaborators")
        .upsert({ idea_id: ideaId, user_id: request.requester_id }, { onConflict: "idea_id,user_id", ignoreDuplicates: true });
    }

    revalidatePath(`/ideas/${ideaId}`);
    revalidatePath(`/ideas/${ideaId}/board`);
    return;
  }

  const newStatus = accept ? "accepted" : "declined";

  // Update request status (guard against concurrent responses)
  const { error: updateError } = await supabase
    .from("collaboration_requests")
    .update({ status: newStatus })
    .eq("id", requestId)
    .eq("status", "pending");

  if (updateError) {
    throw new Error("Failed to update collaboration request");
  }

  // Mark the collaboration_request notification as read (so it doesn't stay
  // stale in the bell when the author responds from the idea page)
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("collaboration_request_id", requestId)
    .eq("type", "collaboration_request");

  if (accept) {
    // Insert into collaborators (author-only RLS allows this)
    const { error: collabError } = await supabase
      .from("collaborators")
      .insert({ idea_id: ideaId, user_id: request.requester_id });

    // Ignore unique constraint violation (already a collaborator)
    if (collabError && collabError.code !== "23505") {
      throw new Error("Failed to add collaborator");
    }
  }

  // Send collaboration_response notification to the requester
  const { data: requesterPrefs } = await supabase
    .from("users")
    .select("notification_preferences")
    .eq("id", request.requester_id)
    .single();

  const prefs = requesterPrefs?.notification_preferences;
  const shouldNotify = prefs?.collaboration_responses !== false;

  if (shouldNotify) {
    await supabase.from("notifications").insert({
      user_id: request.requester_id,
      actor_id: user.id,
      type: "collaboration_response" as const,
      idea_id: ideaId,
      collaboration_request_id: requestId,
    });
  }

  revalidatePath(`/ideas/${ideaId}`);
  revalidatePath(`/ideas/${ideaId}/board`);
}

export async function leaveCollaboration(ideaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase.from("collaborators").delete().eq("idea_id", ideaId).eq("user_id", user.id);

  if (error) {
    throw new Error("Failed to leave collaboration");
  }

  revalidatePath(`/ideas/${ideaId}`);
  revalidatePath(`/ideas/${ideaId}/board`);
}

export async function addCollaborator(ideaId: string, userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Verify caller is the idea author
  const { data: idea } = await supabase.from("ideas").select("author_id").eq("id", ideaId).single();

  if (!idea || idea.author_id !== user.id) {
    throw new Error("Only the idea author can add collaborators");
  }

  const { error } = await supabase.from("collaborators").insert({
    idea_id: ideaId,
    user_id: userId,
  });

  // Ignore unique constraint violation (already a collaborator)
  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }

  revalidatePath(`/ideas/${ideaId}`);
}

export async function removeCollaborator(ideaId: string, userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Verify caller is the idea author
  const { data: idea } = await supabase.from("ideas").select("author_id").eq("id", ideaId).single();

  if (!idea || idea.author_id !== user.id) {
    throw new Error("Only the idea author can remove collaborators");
  }

  await supabase.from("collaborators").delete().eq("idea_id", ideaId).eq("user_id", userId);

  revalidatePath(`/ideas/${ideaId}`);
}
