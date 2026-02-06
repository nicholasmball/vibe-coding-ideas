"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { IdeaCard } from "./idea-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS } from "@/lib/constants";
import type { IdeaWithAuthor, SortOption } from "@/types";

interface IdeaFeedProps {
  ideas: IdeaWithAuthor[];
  userVotes: string[];
  currentSort: SortOption;
}

export function IdeaFeed({ ideas, userVotes, currentSort }: IdeaFeedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`/feed?${params.toString()}`);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Idea Feed</h1>
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {ideas.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg text-muted-foreground">
            No ideas yet. Be the first to share one!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              hasVoted={userVotes.includes(idea.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
