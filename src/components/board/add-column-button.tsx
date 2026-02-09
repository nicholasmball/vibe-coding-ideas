"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBoardColumn } from "@/actions/board";

interface AddColumnButtonProps {
  ideaId: string;
}

export function AddColumnButton({ ideaId }: AddColumnButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await createBoardColumn(ideaId, title.trim());
      setTitle("");
      setIsAdding(false);
    } catch {
      // RLS will block unauthorized access
    } finally {
      setLoading(false);
    }
  }

  if (!isAdding) {
    return (
      <Button
        variant="outline"
        className="h-auto min-w-[280px] self-start border-dashed py-6"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Column
      </Button>
    );
  }

  return (
    <div className="min-w-[280px] rounded-lg border border-border bg-muted/50 p-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Column name..."
          autoFocus
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={loading || !title.trim()}>
            {loading ? "Adding..." : "Add"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAdding(false);
              setTitle("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
