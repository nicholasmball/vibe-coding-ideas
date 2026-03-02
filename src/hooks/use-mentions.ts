"use client";

import { useState, useRef, useMemo } from "react";
import type { User } from "@/types";

/**
 * Shared hook for @mention autocomplete in textareas.
 *
 * Returns mention state, filtered members, and handlers that accept
 * external content/setter so the hook stays decoupled from any
 * particular form's state management.
 */
export function useMentionState(teamMembers: User[]) {
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

  function handleMentionSelect(
    content: string,
    setContent: (value: string) => void,
    user: User
  ) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPos);
    const textAfterCursor = content.slice(cursorPos);

    const atIndex = textBeforeCursor.lastIndexOf("@");
    if (atIndex === -1) return;

    const name = user.full_name ?? user.email;
    const newText =
      textBeforeCursor.slice(0, atIndex) + `@${name} ` + textAfterCursor;
    setContent(newText);
    setMentionQuery(null);

    setMentionedUserIds((prev) => new Set(prev).add(user.id));

    requestAnimationFrame(() => {
      textarea.focus();
      const newCursorPos = atIndex + name.length + 2;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    content: string,
    setContent: (value: string) => void
  ) {
    if (mentionQuery === null || filteredMembers.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionIndex((prev) =>
        prev < filteredMembers.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionIndex((prev) =>
        prev > 0 ? prev - 1 : filteredMembers.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleMentionSelect(content, setContent, filteredMembers[mentionIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setMentionQuery(null);
    }
  }

  return {
    mentionQuery,
    mentionIndex,
    mentionedUserIds,
    setMentionedUserIds,
    textareaRef,
    filteredMembers,
    detectMention,
    handleMentionSelect,
    handleKeyDown,
    setMentionQuery,
    hasMentions: teamMembers.length > 0,
  };
}
