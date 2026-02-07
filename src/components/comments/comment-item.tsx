"use client";

import { useState, useTransition } from "react";
import { Reply, Check, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommentTypeBadge } from "./comment-type-badge";
import { CommentForm } from "./comment-form";
import { incorporateComment, deleteComment } from "@/actions/comments";
import { formatRelativeTime } from "@/lib/utils";
import { Markdown } from "@/components/ui/markdown";
import type { CommentWithAuthor } from "@/types";

interface CommentItemProps {
  comment: CommentWithAuthor;
  ideaId: string;
  ideaAuthorId: string;
  currentUserId?: string;
  depth?: number;
}

export function CommentItem({
  comment,
  ideaId,
  ideaAuthorId,
  currentUserId,
  depth = 0,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isIdeaAuthor = currentUserId === ideaAuthorId;
  const isCommentAuthor = currentUserId === comment.author_id;

  const initials =
    comment.author.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "?";

  const handleIncorporate = () => {
    startTransition(async () => {
      await incorporateComment(comment.id, ideaId);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteComment(comment.id, ideaId);
    });
  };

  return (
    <div className={depth > 0 ? "ml-6 border-l border-border pl-4" : ""}>
      <div className="py-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-7 w-7">
            <AvatarImage src={comment.author.avatar_url ?? undefined} />
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">
                {comment.author.full_name ?? "Anonymous"}
              </span>
              <CommentTypeBadge type={comment.type} />
              {comment.is_incorporated && (
                <Badge
                  variant="outline"
                  className="bg-emerald-400/10 border-emerald-400/20 text-emerald-400 text-[10px]"
                >
                  <Check className="mr-1 h-3 w-3" />
                  Incorporated
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(comment.created_at)}
              </span>
            </div>
            <div className="mt-1 text-sm text-foreground/90">
              <Markdown>{comment.content}</Markdown>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {currentUserId && depth < 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-muted-foreground"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                >
                  <Reply className="h-3 w-3" />
                  Reply
                </Button>
              )}
              {isIdeaAuthor &&
                comment.type === "suggestion" &&
                !comment.is_incorporated && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs text-emerald-400"
                    onClick={handleIncorporate}
                    disabled={isPending}
                  >
                    <Check className="h-3 w-3" />
                    Mark as incorporated
                  </Button>
                )}
              {isCommentAuthor && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-destructive"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
        {showReplyForm && (
          <div className="mt-3 ml-10">
            <CommentForm
              ideaId={ideaId}
              parentCommentId={comment.id}
              onCancel={() => setShowReplyForm(false)}
            />
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              ideaId={ideaId}
              ideaAuthorId={ideaAuthorId}
              currentUserId={currentUserId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
