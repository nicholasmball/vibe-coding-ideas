"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createComment } from "@/actions/comments";
import { COMMENT_TYPE_CONFIG } from "@/lib/constants";
import type { CommentType } from "@/types";

interface CommentFormProps {
  ideaId: string;
  parentCommentId?: string;
  onCancel?: () => void;
}

export function CommentForm({
  ideaId,
  parentCommentId,
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [type, setType] = useState<CommentType>("comment");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    startTransition(async () => {
      await createComment(ideaId, content.trim(), type, parentCommentId);
      setContent("");
      setType("comment");
      onCancel?.();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentCommentId ? "Write a reply..." : "Add a comment..."}
        rows={3}
      />
      <div className="flex items-center justify-between">
        <Select value={type} onValueChange={(v) => setType(v as CommentType)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(COMMENT_TYPE_CONFIG) as [CommentType, typeof COMMENT_TYPE_CONFIG[CommentType]][]).map(
              ([value, config]) => (
                <SelectItem key={value} value={value}>
                  {config.label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending || !content.trim()}>
            {isPending ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>
    </form>
  );
}
