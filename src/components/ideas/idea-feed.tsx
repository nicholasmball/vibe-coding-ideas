"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { IdeaCard } from "./idea-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  currentSearch: string;
  currentTag: string;
  currentPage: number;
  totalPages: number;
  allTags: string[];
}

export function IdeaFeed({
  ideas,
  userVotes,
  currentSort,
  currentSearch,
  currentTag,
  currentPage,
  totalPages,
  allTags,
}: IdeaFeedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(currentSearch);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    // Reset to page 1 when filters change (unless we're changing page)
    if (!("page" in updates)) {
      params.delete("page");
    }
    router.push(`/feed?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: searchInput });
  };

  const clearSearch = () => {
    setSearchInput("");
    updateParams({ q: "" });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Idea Feed</h1>
        <Select
          value={currentSort}
          onValueChange={(v) => updateParams({ sort: v })}
        >
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

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search ideas..."
            className="pl-9"
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          <Badge
            variant={currentTag === "" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => updateParams({ tag: "" })}
          >
            All
          </Badge>
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={currentTag === tag ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => updateParams({ tag: currentTag === tag ? "" : tag })}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Active filters */}
      {(currentSearch || currentTag) && (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span>Showing results for:</span>
          {currentSearch && (
            <Badge variant="secondary" className="gap-1">
              &quot;{currentSearch}&quot;
              <button onClick={clearSearch}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {currentTag && (
            <Badge variant="secondary" className="gap-1">
              #{currentTag}
              <button onClick={() => updateParams({ tag: "" })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Ideas list */}
      {ideas.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg text-muted-foreground">
            {currentSearch || currentTag
              ? "No ideas match your filters."
              : "No ideas yet. Be the first to share one!"}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => updateParams({ page: String(currentPage - 1) })}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => updateParams({ page: String(currentPage + 1) })}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
