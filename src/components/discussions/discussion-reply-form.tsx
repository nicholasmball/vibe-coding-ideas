"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MentionAutocomplete } from "@/components/board/mention-autocomplete";
import { createDiscussionReply } from "@/actions/discussions";
import { createClient } from "@/lib/supabase/client";
import { MAX_DISCUSSION_REPLY_LENGTH } from "@/lib/validation";
import type { User } from "@/types";

interface DiscussionReplyFormProps {
  discussionId: string;
  ideaId: string;
  currentUser: User;
  parentReplyId?: string | null;
  onCancel?: () => void;
  compact?: boolean;
  teamMembers?: User[];
}

export function DiscussionReplyForm({
  discussionId,
  ideaId,
  currentUser,
  parentReplyId,
  onCancel,
  compact = false,
  teamMembers = [],
}: DiscussionReplyFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionedUserIds, setMentionedUserIds] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredMembers = useMemo(() => {
    if (mentionQuery === null) return [];
    return teamMembers.filter((m) =>
      m.full_name?.toLowerCase().includes(mentionQuery.toLowerCase())
    );
  }, [teamMembers, mentionQuery]);

  function detectMention(value: string, cursorPos: number) {
    const textBeforeCursor = value.slice(0, cursorPos);
    const match = textBeforeCursor.match(/(?:^|[\s])@(\S*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setContent(value);
    detectMention(value, e.target.selectionStart);
  }

  function handleMentionSelect(user: User) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPos);
    const textAfterCursor = content.slice(cursorPos);

    const atIndex = textBeforeCursor.lastIndexOf("@");
    if (atIndex === -1) return;

    const name = user.full_name ?? user.email;
    const newText = textBeforeCursor.slice(0, atIndex) + `@${name} ` + textAfterCursor;
    setContent(newText);
    setMentionQuery(null);

    setMentionedUserIds((prev) => new Set(prev).add(user.id));

    requestAnimationFrame(() => {
      textarea.focus();
      const newCursorPos = atIndex + name.length + 2;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery === null || filteredMembers.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionIndex((prev) => (prev < filteredMembers.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionIndex((prev) => (prev > 0 ? prev - 1 : filteredMembers.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleMentionSelect(filteredMembers[mentionIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setMentionQuery(null);
    }
  }

  const hasMentions = teamMembers.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    const savedMentionedUserIds = new Set(mentionedUserIds);
    setIsSubmitting(true);
    try {
      await createDiscussionReply(discussionId, ideaId, content, parentReplyId);

      // Send mention notifications (fire-and-forget)
      if (savedMentionedUserIds.size > 0 && currentUser.id) {
        const supabase = createClient();
        for (const userId of savedMentionedUserIds) {
          if (userId === currentUser.id) continue;
          const member = teamMembers.find((m) => m.id === userId);
          if (!member) continue;
          if (member.notification_preferences?.discussion_mentions === false) continue;
          supabase
            .from("notifications")
            .insert({
              user_id: userId,
              actor_id: currentUser.id,
              type: "discussion_mention" as const,
              idea_id: ideaId,
              discussion_id: discussionId,
            })
            .then(({ error }) => {
              if (error) console.error("Failed to send mention notification:", error.message);
            });
        }
      }

      setContent("");
      setMentionedUserIds(new Set());
      setMentionQuery(null);
      toast.success("Reply posted");
      router.refresh();
      onCancel?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post reply");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="mt-2 space-y-2">
        <div className="relative">
          {mentionQuery !== null && hasMentions && (
            <MentionAutocomplete
              filteredMembers={filteredMembers}
              selectedIndex={mentionIndex}
              onSelect={handleMentionSelect}
            />
          )}
          <Textarea
            ref={textareaRef}
            placeholder={hasMentions ? "Write a reply... (@ to mention)" : "Write a reply..."}
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            maxLength={MAX_DISCUSSION_REPLY_LENGTH}
            rows={2}
            className="min-h-[60px] resize-y text-sm"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={isSubmitting || !content.trim()}>
            {isSubmitting ? "Replying..." : "Reply"}
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    );
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
      <div className="relative">
        {mentionQuery !== null && hasMentions && (
          <MentionAutocomplete
            filteredMembers={filteredMembers}
            selectedIndex={mentionIndex}
            onSelect={handleMentionSelect}
          />
        )}
        <Textarea
          ref={textareaRef}
          placeholder={hasMentions ? "Write a reply... Tip: @ mention your agents to get their input!" : "Write a reply..."}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          maxLength={MAX_DISCUSSION_REPLY_LENGTH}
          rows={3}
          className="min-h-[80px] resize-y"
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Markdown supported</span>
        <Button type="submit" size="sm" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? "Replying..." : "Reply"}
        </Button>
      </div>
    </form>
  );
}
