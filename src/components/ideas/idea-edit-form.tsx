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
import { updateIdea } from "@/actions/ideas";
import type { Idea } from "@/types";

interface IdeaEditFormProps {
  idea: Idea;
}

export function IdeaEditForm({ idea }: IdeaEditFormProps) {
  const [tags, setTags] = useState<string[]>(idea.tags);
  const updateIdeaWithId = updateIdea.bind(null, idea.id);

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Edit Idea</CardTitle>
        <CardDescription>Update your idea details</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={updateIdeaWithId} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              name="title"
              defaultValue={idea.title}
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
              defaultValue={idea.description}
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
              defaultValue={idea.github_url ?? ""}
              placeholder="https://github.com/username/repo"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" size="lg">
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => history.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
