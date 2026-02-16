import Link from "next/link";
import { Bot, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils";
import { ACTIVITY_ACTIONS } from "@/lib/constants";
import type { DashboardBot } from "@/types";

interface MyBotsProps {
  bots: DashboardBot[];
  userId: string;
}

export function MyBots({ bots, userId }: MyBotsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5" />
            My Bots
          </CardTitle>
          <Link
            href={`/profile/${userId}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Manage
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className={`rounded-md border border-border p-3 ${
                bot.is_active ? "" : "opacity-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  {bot.avatar_url && <AvatarImage src={bot.avatar_url} alt={bot.name} />}
                  <AvatarFallback className="text-xs">
                    {bot.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{bot.name}</span>
                    {bot.role && (
                      <Badge variant="outline" className="text-[10px]">
                        {bot.role}
                      </Badge>
                    )}
                    {bot.isActiveMcpBot && (
                      <Badge className="bg-emerald-500/90 text-white text-[10px]">
                        MCP Active
                      </Badge>
                    )}
                    {!bot.is_active && (
                      <Badge variant="secondary" className="text-[10px]">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  {bot.currentTask ? (
                    <Link
                      href={`/ideas/${bot.currentTask.idea.id}/board?taskId=${bot.currentTask.id}`}
                      className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                    >
                      <span className="truncate">
                        {bot.currentTask.title}
                      </span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {bot.currentTask.column.title}
                      </Badge>
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">No current task</p>
                  )}
                  {bot.lastActivity && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {ACTIVITY_ACTIONS[bot.lastActivity.action]?.label ?? bot.lastActivity.action}{" "}
                      {formatRelativeTime(bot.lastActivity.created_at)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
