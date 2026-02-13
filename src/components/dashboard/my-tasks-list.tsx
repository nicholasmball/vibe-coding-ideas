"use client";

import Link from "next/link";
import { CheckSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DueDateBadge } from "@/components/board/due-date-badge";
import { TaskLabelBadges } from "@/components/board/task-label-badges";
import type { DashboardTask } from "@/types";

interface MyTasksListProps {
  tasks: DashboardTask[];
}

export function MyTasksList({ tasks }: MyTasksListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckSquare className="h-5 w-5" />
          My Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No tasks assigned to you.
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/ideas/${task.idea.id}/board?taskId=${task.id}`}
                className="flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {task.idea.title}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <TaskLabelBadges labels={task.labels} maxVisible={2} />
                  <Badge variant="outline" className="text-[10px]">
                    {task.column.title}
                  </Badge>
                  {task.due_date && <DueDateBadge dueDate={task.due_date} />}
                  {task.checklist_total > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {task.checklist_done}/{task.checklist_total}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
