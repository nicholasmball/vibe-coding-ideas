import { notFound } from "next/navigation";
import Link from "next/link";
import { Users, Pencil, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IdeaStatusBadge } from "@/components/ideas/idea-status-badge";
import { VoteButton } from "@/components/ideas/vote-button";
import { CollaboratorButton } from "@/components/ideas/collaborator-button";
import { StatusSelect } from "@/components/ideas/status-select";
import { CommentThread } from "@/components/comments/comment-thread";
import { IdeaDetailRealtime } from "@/components/ideas/idea-detail-realtime";
import { DeleteIdeaButton } from "@/components/ideas/delete-idea-button";
import { EnhanceIdeaButton } from "@/components/ideas/enhance-idea-button";
import { IdeaMobileActions } from "@/components/ideas/idea-mobile-actions";
import { AddCollaboratorPopover } from "@/components/ideas/add-collaborator-popover";
import { RemoveCollaboratorButton } from "@/components/ideas/remove-collaborator-button";
import { InlineIdeaHeader } from "@/components/ideas/inline-idea-header";
import { InlineIdeaBody } from "@/components/ideas/inline-idea-body";
import { InlineIdeaTags } from "@/components/ideas/inline-idea-tags";
import { formatRelativeTime } from "@/lib/utils";
import { PendingRequests } from "@/components/ideas/pending-requests";
import type {
  CommentWithAuthor,
  CollaboratorWithUser,
  CollaborationRequestWithRequester,
  BotProfile,
  AiCredits,
} from "@/types";
import type { Metadata } from "next";

export const maxDuration = 120;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: idea } = await supabase.from("ideas").select("title, description").eq("id", id).single();

  if (!idea) return { title: "Idea Not Found" };

  return {
    title: `${idea.title} - VibeCodes`,
    description: idea.description.substring(0, 160),
  };
}

export default async function IdeaDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch idea with author
  const { data: idea } = await supabase
    .from("ideas")
    .select("*, author:users!ideas_author_id_fkey(*)")
    .eq("id", id)
    .single();

  if (!idea) notFound();

  // Fetch comments with authors (including replies)
  const { data: rawComments } = await supabase
    .from("comments")
    .select("*, author:users!comments_author_id_fkey(*)")
    .eq("idea_id", id)
    .order("created_at", { ascending: true });

  // Build threaded comments
  const commentMap = new Map<string, CommentWithAuthor>();
  const topLevelComments: CommentWithAuthor[] = [];

  (rawComments ?? []).forEach((c) => {
    const comment = { ...c, replies: [] } as unknown as CommentWithAuthor;
    commentMap.set(comment.id, comment);
  });

  commentMap.forEach((comment) => {
    if (comment.parent_comment_id) {
      const parent = commentMap.get(comment.parent_comment_id);
      if (parent) {
        parent.replies = parent.replies ?? [];
        parent.replies.push(comment);
      } else {
        topLevelComments.push(comment);
      }
    } else {
      topLevelComments.push(comment);
    }
  });

  // Fetch collaborators
  const { data: collaborators } = await supabase
    .from("collaborators")
    .select("*, user:users!collaborators_user_id_fkey(*)")
    .eq("idea_id", id);

  // Check user vote
  let hasVoted = false;
  let isCollaborator = false;
  if (user) {
    const { data: vote } = await supabase
      .from("votes")
      .select("id")
      .eq("idea_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    hasVoted = !!vote;

    const { data: collab } = await supabase
      .from("collaborators")
      .select("id")
      .eq("idea_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    isCollaborator = !!collab;
  }

  // Fetch pending collaboration request for non-author, non-collaborator users
  let pendingRequestId: string | null = null;
  let pendingRequests: CollaborationRequestWithRequester[] = [];

  if (user && !isCollaborator && user.id !== idea.author_id) {
    // Fetch own pending request
    const { data: ownRequest } = await supabase
      .from("collaboration_requests")
      .select("id")
      .eq("idea_id", id)
      .eq("requester_id", user.id)
      .eq("status", "pending")
      .maybeSingle();
    pendingRequestId = ownRequest?.id ?? null;
  }

  if (user && user.id === idea.author_id) {
    // Author: fetch all pending requests
    const { data: requests } = await supabase
      .from("collaboration_requests")
      .select("*, requester:users!collaboration_requests_requester_id_fkey(*)")
      .eq("idea_id", id)
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    pendingRequests = (requests ?? []) as unknown as CollaborationRequestWithRequester[];
  }

  // Check if user is admin and has AI access
  let isAdmin = false;
  let aiEnabled = false;
  let aiCredits: AiCredits | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("is_admin, ai_enabled, ai_daily_limit, encrypted_anthropic_key")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.is_admin ?? false;
    aiEnabled = profile?.ai_enabled ?? false;

    if (aiEnabled && profile) {
      const isByok = !!profile.encrypted_anthropic_key;
      if (isByok) {
        aiCredits = { used: 0, limit: null, remaining: null, isByok: true };
      } else {
        const todayUTC = new Date();
        todayUTC.setUTCHours(0, 0, 0, 0);
        const { count } = await supabase
          .from("ai_usage_log")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("key_type", "platform")
          .gte("created_at", todayUTC.toISOString());
        const used = count ?? 0;
        const limit = profile.ai_daily_limit;
        aiCredits = { used, limit, remaining: Math.max(0, limit - used), isByok: false };
      }
    }
  }

  const isAuthor = user?.id === idea.author_id;
  const canDelete = isAuthor || isAdmin;

  // Fetch user's bot profiles for AI persona selector
  let userBots: BotProfile[] = [];
  if (user && aiEnabled) {
    const { data: bots } = await supabase
      .from("bot_profiles")
      .select("*")
      .eq("owner_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: true });
    userBots = (bots ?? []) as BotProfile[];
  }
  const author = idea.author as unknown as { full_name: string | null; avatar_url: string | null; id: string };
  const authorInitials =
    author.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() ?? "?";

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 pb-4">
      <IdeaDetailRealtime ideaId={idea.id} />
      {/* Header */}
      <div className="flex items-start gap-4">
        <VoteButton ideaId={idea.id} upvotes={idea.upvotes} hasVoted={hasVoted} />
        <div className="flex-1">
          <InlineIdeaHeader ideaId={idea.id} title={idea.title} visibility={idea.visibility} isAuthor={isAuthor} />
          <div className="mt-3 flex items-center gap-3">
            <Link
              href={`/profile/${idea.author_id}`}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Avatar className="h-5 w-5">
                <AvatarImage src={author.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px]">{authorInitials}</AvatarFallback>
              </Avatar>
              {author.full_name ?? "Anonymous"}
            </Link>
            <span className="text-sm text-muted-foreground">{formatRelativeTime(idea.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Status and Actions */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        {isAuthor ? (
          <StatusSelect ideaId={idea.id} currentStatus={idea.status} />
        ) : (
          <IdeaStatusBadge status={idea.status} />
        )}
        {user && (
          <CollaboratorButton
            ideaId={idea.id}
            isCollaborator={isCollaborator}
            isAuthor={isAuthor}
            pendingRequestId={pendingRequestId}
          />
        )}
        {(isAuthor || isCollaborator || idea.visibility === "public") && (
          <Link href={`/ideas/${idea.id}/board`}>
            <Button variant="outline" size="sm" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Board
            </Button>
          </Link>
        )}
        {/* Desktop: show Edit, Enhance, Delete inline */}
        {isAuthor && (
          <Link href={`/ideas/${idea.id}/edit`} className="hidden sm:inline-flex">
            <Button variant="outline" size="sm" className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        )}
        {isAuthor && aiEnabled && (
          <span className="hidden sm:inline-flex">
            <EnhanceIdeaButton
              ideaId={idea.id}
              ideaTitle={idea.title}
              currentDescription={idea.description}
              bots={userBots}
              aiCredits={aiCredits}
            />
          </span>
        )}
        {canDelete && (
          <span className="hidden sm:inline-flex">
            <DeleteIdeaButton ideaId={idea.id} />
          </span>
        )}
        {/* Mobile: "More" dropdown for Edit, Enhance, Delete */}
        {(isAuthor || canDelete) && (
          <IdeaMobileActions
            ideaId={idea.id}
            ideaTitle={idea.title}
            ideaDescription={idea.description}
            isAuthor={isAuthor}
            canDelete={canDelete}
            aiEnabled={aiEnabled}
            userBots={userBots}
            aiCredits={aiCredits}
          />
        )}
      </div>

      {/* Tags */}
      <InlineIdeaTags ideaId={idea.id} tags={idea.tags} isAuthor={isAuthor} />

      {/* Collaborators */}
      {(isAuthor || (collaborators as unknown as CollaboratorWithUser[])?.length > 0) && (
        <div className="mt-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4" />
            Collaborators ({(collaborators as unknown as CollaboratorWithUser[])?.length ?? 0})
            {isAuthor && (
              <AddCollaboratorPopover
                ideaId={idea.id}
                authorId={idea.author_id}
                existingCollaboratorIds={
                  (collaborators as unknown as CollaboratorWithUser[])?.map((c) => c.user_id) ?? []
                }
              />
            )}
          </h3>
          <div className="flex flex-wrap gap-2">
            {(collaborators as unknown as CollaboratorWithUser[])?.map((collab) => {
              const collabInitials =
                collab.user.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() ?? "?";
              return (
                <div
                  key={collab.id}
                  className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm transition-colors hover:border-primary"
                >
                  <Link href={`/profile/${collab.user_id}`} className="flex items-center gap-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={collab.user.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px]">{collabInitials}</AvatarFallback>
                    </Avatar>
                    {collab.user.full_name ?? "Anonymous"}
                  </Link>
                  {isAuthor && (
                    <RemoveCollaboratorButton
                      ideaId={idea.id}
                      userId={collab.user_id}
                      userName={collab.user.full_name ?? undefined}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {isAuthor && <PendingRequests ideaId={idea.id} requests={pendingRequests} />}
        </div>
      )}

      {/* Description + GitHub URL */}
      <Separator className="mt-8 mb-6" />
      <InlineIdeaBody ideaId={idea.id} description={idea.description} githubUrl={idea.github_url} isAuthor={isAuthor} />

      {/* Comments */}
      <Separator className="my-6" />
      <CommentThread
        comments={topLevelComments}
        ideaId={idea.id}
        ideaAuthorId={idea.author_id}
        currentUserId={user?.id}
      />
    </div>
  );
}
