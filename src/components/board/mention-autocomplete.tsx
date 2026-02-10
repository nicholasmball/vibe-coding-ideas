"use client";

import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/types";

interface MentionAutocompleteProps {
  filteredMembers: User[];
  selectedIndex: number;
  onSelect: (user: User) => void;
}

export function MentionAutocomplete({
  filteredMembers,
  selectedIndex,
  onSelect,
}: MentionAutocompleteProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.children[selectedIndex] as HTMLElement | undefined;
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (filteredMembers.length === 0) {
    return (
      <div className="absolute bottom-full left-0 z-50 mb-1 w-64 rounded-lg border bg-popover p-2 shadow-md">
        <p className="text-center text-xs text-muted-foreground">
          No team members found
        </p>
      </div>
    );
  }

  return (
    <div className="absolute bottom-full left-0 z-50 mb-1 w-64 rounded-lg border bg-popover shadow-md">
      <div ref={listRef} className="max-h-40 overflow-y-auto p-1">
        {filteredMembers.map((member, i) => {
          const initials =
            member.full_name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase() ?? "?";

          return (
            <button
              key={member.id}
              type="button"
              className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                i === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
              onMouseDown={(e) => {
                e.preventDefault(); // Keep textarea focus
                onSelect(member);
              }}
            >
              <Avatar className="h-5 w-5">
                <AvatarImage src={member.avatar_url ?? undefined} />
                <AvatarFallback className="text-[9px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span>{member.full_name ?? member.email}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
