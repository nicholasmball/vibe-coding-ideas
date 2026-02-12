import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Github, Users, Pencil, LayoutDashboard, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IdeaStatusBadge } from "@/components/ideas/idea-status-badge";
import { VoteButton } from "@/components/ideas/vote-button";
import { CollaboratorButton } from "@/components/ideas/collaborator-button";
import { StatusSelect } from "@/components/ideas/status-select";
import { CommentThread } from "@/components/comments/comment-thread";
import { IdeaDetailRealtime } from "@/components/ideas/idea-detail-realtime";
import { DeleteIdeaButton } from "@/components/ideas/delete-idea-button";
import { AddCollaboratorPopover } from "@/components/ideas/add-collaborator-popover";
import { RemoveCollaboratorButton } from "@/components/ideas/remove-collaborator-button";
import { Markdown } from "@/components/ui/markdown";
import { formatRelativeTime } from "@/lib/utils";
import type { CommentWithAuthor, CollaboratorWithUser } from "@/types";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: idea } = await supabase
    .from("ideas")
    .select("title, description")
    .eq("id", id)
    .single();

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

  // Check if user is admin
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.is_admin ?? false;
  }

  const isAuthor = user?.id === idea.author_id;
  const canDelete = isAuthor || isAdmin;
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
        <VoteButton
          ideaId={idea.id}
          upvotes={idea.upvotes}
          hasVoted={hasVoted}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{idea.title}</h1>
            {idea.visibility === "private" && (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" />
                Private
              </Badge>
            )}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Link
              href={`/profile/${idea.author_id}`}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Avatar className="h-5 w-5">
                <AvatarImage src={author.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {authorInitials}
                </AvatarFallback>
              </Avatar>
              {author.full_name ?? "Anonymous"}
            </Link>
            <span className="text-sm text-muted-foreground">
              {formatRelativeTime(idea.created_at)}
            </span>
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
          />
        )}
        {(isAuthor || isCollaborator) && (
          <Link href={`/ideas/${idea.id}/board`}>
            <Button variant="outline" size="sm" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Board
            </Button>
          </Link>
        )}
        {isAuthor && (
          <Link href={`/ideas/${idea.id}/edit`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        )}
        {canDelete && (
          <DeleteIdeaButton ideaId={idea.id} />
        )}
      </div>

      {/* Tags */}
      {idea.tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {idea.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* GitHub Link */}
      {idea.github_url && (
        <a
          href={idea.github_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        >
          <Github className="h-4 w-4" />
          View Repository
          <ExternalLink className="h-3 w-3" />
        </a>
      )}

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
                existingCollaboratorIds={(collaborators as unknown as CollaboratorWithUser[])?.map((c) => c.user_id) ?? []}
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
                  <Link
                    href={`/profile/${collab.user_id}`}
                    className="flex items-center gap-1.5"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={collab.user.avatar_url ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {collabInitials}
                      </AvatarFallback>
                    </Avatar>
                    {collab.user.full_name ?? "Anonymous"}
                  </Link>
                  {isAuthor && (
                    <RemoveCollaboratorButton
                      ideaId={idea.id}
                      userId={collab.user_id}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Description */}
      <Separator className="mt-8 mb-6" />
      <div className="text-foreground/90 leading-relaxed">
        <Markdown>{idea.description}</Markdown>
      </div>

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
