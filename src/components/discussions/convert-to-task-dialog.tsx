"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRightLeft, LayoutDashboard, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { convertDiscussionToTask } from "@/actions/discussions";
import type { IdeaDiscussion, BoardColumn } from "@/types";

interface ConvertToTaskDialogProps {
  discussion: IdeaDiscussion;
  ideaId: string;
  columns: BoardColumn[];
}

export function ConvertToTaskDialog({
  discussion,
  ideaId,
  columns,
}: ConvertToTaskDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState(discussion.title);
  const [columnId, setColumnId] = useState(columns[0]?.id ?? "");
  const [isConverting, setIsConverting] = useState(false);

  const selectedColumn = columns.find((c) => c.id === columnId);

  async function handleConvert() {
    if (!columnId) {
      toast.error("Please select a column");
      return;
    }

    setIsConverting(true);
    try {
      await convertDiscussionToTask(
        discussion.id,
        ideaId,
        columnId,
        taskTitle
      );
      toast.success("Discussion converted to task");
      setOpen(false);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to convert";
      if (message.includes("NEXT_REDIRECT")) throw err;
      toast.error(message);
    } finally {
      setIsConverting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          Convert to Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:!max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Convert Discussion to Task</DialogTitle>
          <DialogDescription>
            Create a board task from this discussion. The discussion will be
            marked as converted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="taskTitle">Task Title</Label>
            <Input
              id="taskTitle"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Task title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="column">Target Column</Label>
            <Select value={columnId} onValueChange={setColumnId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Preview
            </span>
            <div className="rounded-md border bg-background p-3">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {taskTitle || discussion.title}
                </span>
                {selectedColumn && (
                  <span className="ml-auto rounded bg-accent px-2 py-0.5 text-[10px] text-muted-foreground">
                    {selectedColumn.title}
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2 rounded bg-blue-500/[0.06] px-3 py-2 text-xs text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                <span>
                  Linked from:{" "}
                  <span className="text-blue-400">{discussion.title}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isConverting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConvert}
            disabled={isConverting || !taskTitle.trim() || !columnId}
            className="gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            {isConverting ? "Creating..." : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
