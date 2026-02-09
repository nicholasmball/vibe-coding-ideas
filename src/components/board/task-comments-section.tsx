"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, Trash2, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/ui/markdown";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";
import { logTaskActivity } from "@/lib/activity";
import type { BoardTaskCommentWithAuthor } from "@/types";

interface TaskCommentsSectionProps {
  taskId: string;
  ideaId: string;
  currentUserId: string;
}

export function TaskCommentsSection({
  taskId,
  ideaId,
  currentUserId,
}: TaskCommentsSectionProps) {
  const [comments, setComments] = useState<BoardTaskCommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("board_task_comments")
      .select("*, author:users!board_task_comments_author_id_fkey(*)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    setComments(
      (data ?? []) as unknown as BoardTaskCommentWithAuthor[]
    );
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`task-comments-${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "board_task_comments",
          filter: `task_id=eq.${taskId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("board_task_comments")
            .select("*, author:users!board_task_comments_author_id_fkey(*)")
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setComments((prev) => {
              // Avoid duplicates
              if (prev.some((c) => c.id === data.id)) return prev;
              return [
                ...prev,
                data as unknown as BoardTaskCommentWithAuthor,
              ];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "board_task_comments",
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          setComments((prev) =>
            prev.filter((c) => c.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [taskId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from("board_task_comments").insert({
      task_id: taskId,
      idea_id: ideaId,
      author_id: currentUserId,
      content: content.trim(),
    });

    if (!error) {
      logTaskActivity(taskId, ideaId, currentUserId, "comment_added");
      setContent("");
    }
    setSubmitting(false);
  }

  async function handleDelete(commentId: string) {
    const supabase = createClient();
    await supabase
      .from("board_task_comments")
      .delete()
      .eq("id", commentId);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        <span className="text-sm font-medium">
          Comments{comments.length > 0 ? ` (${comments.length})` : ""}
        </span>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : comments.length > 0 ? (
        <ScrollArea className="max-h-64">
          <div className="space-y-3 pr-4">
            {comments.map((comment) => {
              const initials =
                comment.author?.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() ?? "?";

              return (
                <div key={comment.id} className="flex gap-2">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage
                      src={comment.author?.avatar_url ?? undefined}
                    />
                    <AvatarFallback className="text-[10px]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">
                        {comment.author?.full_name ?? "Unknown"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(comment.created_at)}
                      </span>
                      {comment.author_id === currentUserId && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(comment.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Delete comment</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs prose-sm">
                      <Markdown>{comment.content}</Markdown>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
        <p className="text-xs text-muted-foreground">No comments yet</p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment... (markdown supported)"
          rows={2}
          className="min-h-[60px] text-xs"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="submit"
              size="icon"
              className="h-[60px] w-10 shrink-0"
              disabled={submitting || !content.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send comment</TooltipContent>
        </Tooltip>
      </form>
    </div>
  );
}
