"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { updateIdeaFields } from "@/actions/ideas";

interface InlineIdeaHeaderProps {
  ideaId: string;
  title: string;
  isAuthor: boolean;
}

export function InlineIdeaHeader({
  ideaId,
  title: initialTitle,
  isAuthor,
}: InlineIdeaHeaderProps) {
  const [title, setTitle] = useState(initialTitle);
  const previousTitleRef = useRef(initialTitle);
  const escapePressedRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [title, autoResize]);

  async function handleTitleBlur() {
    if (escapePressedRef.current) {
      escapePressedRef.current = false;
      setTitle(previousTitleRef.current);
      return;
    }
    const trimmed = title.trim();
    if (!trimmed || trimmed === previousTitleRef.current) {
      setTitle(previousTitleRef.current);
      return;
    }
    try {
      await updateIdeaFields(ideaId, { title: trimmed });
      previousTitleRef.current = trimmed;
    } catch {
      toast.error("Failed to update title");
      setTitle(previousTitleRef.current);
    }
  }

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLTextAreaElement).blur();
    } else if (e.key === "Escape") {
      escapePressedRef.current = true;
      (e.target as HTMLTextAreaElement).blur();
    }
  }

  if (!isAuthor) {
    return (
      <div className="min-w-0 flex-1">
        <h1 className="text-3xl font-bold tracking-tight break-words leading-snug">{initialTitle}</h1>
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1">
      <textarea
        ref={textareaRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        onKeyDown={handleTitleKeyDown}
        rows={1}
        className="w-full resize-none overflow-hidden border-none bg-transparent px-0 py-0 text-3xl font-bold tracking-tight shadow-none outline-none focus-visible:ring-0 hover:underline hover:decoration-muted-foreground/30 hover:underline-offset-4 leading-snug"
      />
    </div>
  );
}
