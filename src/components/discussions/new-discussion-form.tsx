"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MentionAutocomplete } from "@/components/board/mention-autocomplete";
import { createDiscussion } from "@/actions/discussions";
import { createClient } from "@/lib/supabase/client";
import { MAX_TITLE_LENGTH, MAX_DISCUSSION_BODY_LENGTH } from "@/lib/validation";
import type { User } from "@/types";

interface NewDiscussionFormProps {
  ideaId: string;
  teamMembers?: User[];
  currentUserId?: string;
}

export function NewDiscussionForm({
  ideaId,
  teamMembers = [],
  currentUserId,
}: NewDiscussionFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionedUserIds, setMentionedUserIds] = useState<Set<string>>(new Set());
  const bodyRef = useRef<HTMLTextAreaElement>(null);

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

  function handleBodyInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setBody(value);
    detectMention(value, e.target.selectionStart);
  }

  function handleMentionSelect(user: User) {
    const textarea = bodyRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = body.slice(0, cursorPos);
    const textAfterCursor = body.slice(cursorPos);

    const atIndex = textBeforeCursor.lastIndexOf("@");
    if (atIndex === -1) return;

    const name = user.full_name ?? user.email;
    const newText = textBeforeCursor.slice(0, atIndex) + `@${name} ` + textAfterCursor;
    setBody(newText);
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

    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required");
      return;
    }

    const savedMentionedUserIds = new Set(mentionedUserIds);
    setIsSubmitting(true);
    try {
      const discussionId = await createDiscussion(ideaId, title, body);

      // Send mention notifications (fire-and-forget)
      if (savedMentionedUserIds.size > 0 && currentUserId) {
        const supabase = createClient();
        for (const userId of savedMentionedUserIds) {
          if (userId === currentUserId) continue;
          const member = teamMembers.find((m) => m.id === userId);
          if (!member) continue;
          if (member.notification_preferences?.discussion_mentions === false) continue;
          supabase
            .from("notifications")
            .insert({
              user_id: userId,
              actor_id: currentUserId,
              type: "discussion_mention" as const,
              idea_id: ideaId,
              discussion_id: discussionId,
            })
            .then(({ error }) => {
              if (error) console.error("Failed to send mention notification:", error.message);
            });
        }
      }

      toast.success("Discussion created");
      router.push(`/ideas/${ideaId}/discussions/${discussionId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create discussion";
      if (message.includes("NEXT_REDIRECT")) throw err;
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="What would you like to discuss?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={MAX_TITLE_LENGTH}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Body</Label>
        <div className="relative">
          {mentionQuery !== null && hasMentions && (
            <MentionAutocomplete
              filteredMembers={filteredMembers}
              selectedIndex={mentionIndex}
              onSelect={handleMentionSelect}
            />
          )}
          <Textarea
            ref={bodyRef}
            id="body"
            placeholder={
              hasMentions
                ? "Provide context, share research, or outline your proposal... Tip: @ mention your agents to get their input!"
                : "Provide context, share research, or outline your proposal..."
            }
            value={body}
            onChange={handleBodyInputChange}
            onKeyDown={handleKeyDown}
            maxLength={MAX_DISCUSSION_BODY_LENGTH}
            rows={10}
            className="min-h-[200px] resize-y"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Markdown supported &middot; {body.length.toLocaleString()}/{MAX_DISCUSSION_BODY_LENGTH.toLocaleString()}
        </p>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting || !title.trim() || !body.trim()}>
          {isSubmitting ? "Creating..." : "Create Discussion"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
