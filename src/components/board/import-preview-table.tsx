"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { ImportTask, ColumnMapping } from "@/lib/import";
import type { BoardColumnWithTasks } from "@/types";

interface ImportPreviewTableProps {
  tasks: ImportTask[];
  columns: BoardColumnWithTasks[];
  columnMapping: ColumnMapping;
  defaultColumnId: string;
}

export function ImportPreviewTable({
  tasks,
  columns,
  columnMapping,
  defaultColumnId,
}: ImportPreviewTableProps) {
  function resolveColumnName(task: ImportTask): string {
    if (!task.columnName) {
      const col = columns.find((c) => c.id === defaultColumnId);
      return col?.title ?? "Default";
    }
    const mappedId = columnMapping[task.columnName];
    if (mappedId === "__new__") return `${task.columnName} (new)`;
    const col = columns.find((c) => c.id === mappedId);
    return col?.title ?? task.columnName;
  }

  if (tasks.length === 0) return null;

  const displayed = tasks.slice(0, 100);
  const hasMore = tasks.length > 100;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Preview ({tasks.length} task{tasks.length !== 1 ? "s" : ""})
      </p>
      {tasks.length > 500 && (
        <p className="text-xs text-amber-400">
          Only the first 500 tasks will be imported.
        </p>
      )}
      <ScrollArea className="h-56 rounded-md border">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted">
            <tr className="border-b">
              <th className="px-2 py-1.5 text-left font-medium">#</th>
              <th className="px-2 py-1.5 text-left font-medium">Title</th>
              <th className="px-2 py-1.5 text-left font-medium">Column</th>
              <th className="px-2 py-1.5 text-left font-medium">Labels</th>
              <th className="px-2 py-1.5 text-left font-medium">Due</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((task, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="px-2 py-1 text-muted-foreground">{i + 1}</td>
                <td className="max-w-[200px] truncate px-2 py-1">
                  {task.title}
                  {task.checklistItems && task.checklistItems.length > 0 && (
                    <span className="ml-1 text-muted-foreground">
                      ({task.checklistItems.length} subtasks)
                    </span>
                  )}
                </td>
                <td className="px-2 py-1 text-muted-foreground">
                  {resolveColumnName(task)}
                </td>
                <td className="px-2 py-1">
                  <div className="flex flex-wrap gap-0.5">
                    {task.labels?.slice(0, 3).map((l) => (
                      <Badge
                        key={l}
                        variant="secondary"
                        className="px-1 py-0 text-[10px]"
                      >
                        {l}
                      </Badge>
                    ))}
                    {(task.labels?.length ?? 0) > 3 && (
                      <span className="text-muted-foreground">
                        +{task.labels!.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-1 text-muted-foreground">
                  {task.dueDate ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {hasMore && (
          <p className="px-2 py-1 text-center text-xs text-muted-foreground">
            ... and {tasks.length - 100} more
          </p>
        )}
      </ScrollArea>
    </div>
  );
}
