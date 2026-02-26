"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createDiscussionReply } from "@/actions/discussions";
import { MAX_DISCUSSION_REPLY_LENGTH } from "@/lib/validation";
import type { User } from "@/types";

interface DiscussionReplyFormProps {
  discussionId: string;
  ideaId: string;
  currentUser: User;
}

export function DiscussionReplyForm({
  discussionId,
  ideaId,
  currentUser,
}: DiscussionReplyFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await createDiscussionReply(discussionId, ideaId, content);
      setContent("");
      toast.success("Reply posted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post reply");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border p-4">
      <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Avatar className="h-5 w-5">
          <AvatarImage src={currentUser.avatar_url ?? undefined} />
          <AvatarFallback className="text-[8px]">
            {(currentUser.full_name ?? "?")[0]}
          </AvatarFallback>
        </Avatar>
        Reply as {currentUser.full_name ?? "Anonymous"}
      </div>
      <Textarea
        placeholder="Write a reply... (Markdown supported)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={MAX_DISCUSSION_REPLY_LENGTH}
        rows={3}
        className="min-h-[80px] resize-y"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Markdown supported</span>
        <Button type="submit" size="sm" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? "Replying..." : "Reply"}
        </Button>
      </div>
    </form>
  );
}
