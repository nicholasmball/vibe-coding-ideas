"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SUGGESTED_TAGS } from "@/lib/constants";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ value, onChange }: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = (tag: string) => {
    const normalized = tag.toLowerCase().trim();
    if (normalized && !value.includes(normalized)) {
      onChange([...value, normalized]);
    }
    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const availableSuggestions = SUGGESTED_TAGS.filter(
    (tag) => !value.includes(tag)
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 rounded-md border border-input bg-background p-2">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 rounded-full hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? "Add tags..." : ""}
          className="flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 min-w-[100px]"
        />
      </div>
      {value.length < 5 && (
        <div className="flex flex-wrap gap-1.5">
          {availableSuggestions.slice(0, 8).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              + {tag}
            </button>
          ))}
        </div>
      )}
      {/* Hidden input for form submission */}
      <input type="hidden" name="tags" value={value.join(",")} />
    </div>
  );
}
