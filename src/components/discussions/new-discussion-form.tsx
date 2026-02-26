"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createDiscussion } from "@/actions/discussions";
import { MAX_TITLE_LENGTH, MAX_DISCUSSION_BODY_LENGTH } from "@/lib/validation";

interface NewDiscussionFormProps {
  ideaId: string;
}

export function NewDiscussionForm({ ideaId }: NewDiscussionFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const discussionId = await createDiscussion(ideaId, title, body);
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
        <Textarea
          id="body"
          placeholder="Provide context, share research, or outline your proposal... (Markdown supported)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={MAX_DISCUSSION_BODY_LENGTH}
          rows={10}
          className="min-h-[200px] resize-y"
        />
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
