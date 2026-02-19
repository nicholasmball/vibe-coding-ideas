"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TableRow, TableCell } from "@/components/ui/table";
import { toggleAiEnabled, setUserAiDailyLimit } from "@/actions/admin";
import { formatRelativeTime } from "@/lib/utils";
import type { AdminUser } from "@/app/(main)/admin/page";

interface AiUserManagementRowProps {
  user: AdminUser;
  stats: {
    calls: number;
    inputTokens: number;
    outputTokens: number;
    keyType: "platform" | "byok" | "mixed";
    lastUsed: string | null;
  } | null;
}

function estimateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * 3) / 1_000_000 + (outputTokens * 15) / 1_000_000;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function AiUserManagementRow({ user, stats }: AiUserManagementRowProps) {
  const [aiEnabled, setAiEnabled] = useState(user.ai_enabled);
  const [dailyLimit, setDailyLimit] = useState(user.ai_daily_limit.toString());
  const [toggling, setToggling] = useState(false);

  const initials =
    user.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "?";

  const isByok = !!user.encrypted_anthropic_key;

  async function handleToggleAi(enabled: boolean) {
    setToggling(true);
    setAiEnabled(enabled);
    try {
      await toggleAiEnabled(user.id, enabled);
    } catch (err) {
      setAiEnabled(!enabled);
      toast.error(err instanceof Error ? err.message : "Failed to toggle AI");
    } finally {
      setToggling(false);
    }
  }

  async function handleLimitBlur() {
    const numLimit = parseInt(dailyLimit, 10);
    if (isNaN(numLimit) || numLimit < 0) {
      setDailyLimit(user.ai_daily_limit.toString());
      return;
    }
    if (numLimit === user.ai_daily_limit) return;
    try {
      await setUserAiDailyLimit(user.id, numLimit);
      toast.success(`Daily limit set to ${numLimit}`);
    } catch (err) {
      setDailyLimit(user.ai_daily_limit.toString());
      toast.error(err instanceof Error ? err.message : "Failed to set limit");
    }
  }

  function handleLimitKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.avatar_url ?? undefined} />
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {user.full_name ?? "Unknown"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right text-sm">
        {stats?.calls ?? 0}
      </TableCell>
      <TableCell className="text-right text-sm text-muted-foreground">
        {stats ? formatNumber(stats.inputTokens + stats.outputTokens) : "0"}
      </TableCell>
      <TableCell className="text-right text-sm text-muted-foreground">
        ${stats ? estimateCost(stats.inputTokens, stats.outputTokens).toFixed(2) : "0.00"}
      </TableCell>
      <TableCell>
        {isByok ? (
          <Badge variant="secondary" className="text-[10px]">BYOK</Badge>
        ) : (
          <Badge variant="outline" className="text-[10px]">Platform</Badge>
        )}
      </TableCell>
      <TableCell className="text-center">
        <Switch
          checked={aiEnabled}
          onCheckedChange={handleToggleAi}
          disabled={toggling}
        />
      </TableCell>
      <TableCell className="text-center">
        <Input
          type="number"
          min={0}
          value={dailyLimit}
          onChange={(e) => setDailyLimit(e.target.value)}
          onBlur={handleLimitBlur}
          onKeyDown={handleLimitKeyDown}
          className="mx-auto h-7 w-16 text-center text-xs"
        />
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground">
          {stats?.lastUsed ? formatRelativeTime(stats.lastUsed) : "Never"}
        </span>
      </TableCell>
    </TableRow>
  );
}
