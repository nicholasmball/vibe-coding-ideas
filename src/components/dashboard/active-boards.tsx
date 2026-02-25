import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";

export interface ActiveBoard {
  ideaId: string;
  ideaTitle: string;
  totalTasks: number;
  columnSummary: { title: string; count: number; isDone: boolean }[];
  lastActivity: string;
}

interface ActiveBoardsProps {
  boards: ActiveBoard[];
}

export function ActiveBoards({ boards }: ActiveBoardsProps) {
  if (boards.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No active boards yet.{" "}
        <Link href="/ideas" className="text-primary hover:underline">
          Browse the feed
        </Link>{" "}
        to find ideas to work on.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {boards.map((board) => (
        <Link
          key={board.ideaId}
          href={`/ideas/${board.ideaId}/board`}
          className="block rounded-md border border-border p-3 transition-colors hover:bg-muted"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium truncate">
              {board.ideaTitle}
            </p>
            <p className="shrink-0 text-xs text-muted-foreground">
              {board.totalTasks} task{board.totalTasks !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {board.columnSummary.map((col) => (
              <Badge
                key={col.title}
                variant={col.isDone ? "default" : "outline"}
                className="text-[10px] max-w-[150px] sm:max-w-none truncate"
              >
                {col.count} {col.title}
              </Badge>
            ))}
            <span className="text-[10px] text-muted-foreground ml-auto">
              {formatRelativeTime(board.lastActivity)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
