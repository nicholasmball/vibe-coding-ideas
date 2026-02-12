import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <LayoutDashboard className="h-5 w-5" />
          Active Boards
        </CardTitle>
      </CardHeader>
      <CardContent>
        {boards.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No active boards yet.{" "}
            <Link href="/feed" className="text-primary hover:underline">
              Browse the feed
            </Link>{" "}
            to find ideas to work on.
          </p>
        ) : (
          <div className="space-y-2">
            {boards.map((board) => (
              <Link
                key={board.ideaId}
                href={`/ideas/${board.ideaId}/board`}
                className="flex items-center gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {board.ideaTitle}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {board.columnSummary.map((col) => (
                      <Badge
                        key={col.title}
                        variant={col.isDone ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {col.count} {col.title}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-muted-foreground">
                    {board.totalTasks} task{board.totalTasks !== 1 ? "s" : ""}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatRelativeTime(board.lastActivity)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
