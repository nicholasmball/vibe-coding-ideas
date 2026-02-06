"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TagInput } from "./tag-input";
import { createIdea } from "@/actions/ideas";

export function IdeaForm() {
  const [tags, setTags] = useState<string[]>([]);

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Share Your Idea</CardTitle>
        <CardDescription>
          Describe your vibe coding project idea and find collaborators
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={createIdea} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              name="title"
              placeholder="A catchy title for your idea"
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe your idea in detail. What problem does it solve? What tech stack would you use?"
              required
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <TagInput value={tags} onChange={setTags} />
          </div>

          <div className="space-y-2">
            <label htmlFor="github_url" className="text-sm font-medium">
              GitHub URL (optional)
            </label>
            <Input
              id="github_url"
              name="github_url"
              type="url"
              placeholder="https://github.com/username/repo"
            />
          </div>

          <Button type="submit" className="w-full" size="lg">
            Submit Idea
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
