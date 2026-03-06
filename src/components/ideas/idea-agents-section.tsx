"use client";

import { useState, useTransition } from "react";
import { Bot, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { AgentProfileDialog } from "@/components/agents/agent-profile-dialog";
import { getRoleColor } from "@/lib/agent-colors";
import { allocateAgent, removeIdeaAgent } from "@/actions/idea-agents";
import type { IdeaAgentWithDetails, BotProfile } from "@/types";

interface IdeaAgentsSectionProps {
  ideaId: string;
  ideaAgents: IdeaAgentWithDetails[];
  currentUserId: string;
  isAuthor: boolean;
  isTeamMember: boolean;
  userBots: BotProfile[];
}

export function IdeaAgentsSection({
  ideaId,
  ideaAgents,
  currentUserId,
  isAuthor,
  isTeamMember,
  userBots,
}: IdeaAgentsSectionProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);

  // Bots the current user owns that are NOT already in the pool
  const allocatedBotIds = new Set(ideaAgents.map((a) => a.bot_id));
  const unallocatedBots = userBots.filter((b) => !allocatedBotIds.has(b.id));

  function handleAllocate(botId: string) {
    startTransition(async () => {
      try {
        await allocateAgent(ideaId, botId);
        toast.success("Agent added to pool");
        setAddOpen(false);
      } catch {
        toast.error("Failed to add agent");
      }
    });
  }

  function handleRemove(botId: string) {
    startTransition(async () => {
      try {
        await removeIdeaAgent(ideaId, botId);
        toast.success("Agent removed from pool");
      } catch {
        toast.error("Failed to remove agent");
      }
    });
  }

  // Don't show anything to non-team members if pool is empty
  if (!isTeamMember && ideaAgents.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/60">Agents</span>
      {/* Avatar stack */}
      {ideaAgents.length > 0 && (
        <div className="flex items-center">
          {ideaAgents.map((agent, i) => {
            const colors = getRoleColor(agent.bot.role);
            return (
              <Tooltip key={agent.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setSelectedBotId(agent.bot_id)}
                    className={`cursor-pointer ${i > 0 ? "-ml-1.5" : ""}`}
                  >
                    <Avatar className="h-6 w-6 border-2 border-card">
                      <AvatarImage src={agent.bot.avatar_url ?? undefined} />
                      <AvatarFallback className={`text-[9px] ${colors.avatarBg} ${colors.avatarText}`}>
                        {agent.bot.name?.[0]?.toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {agent.bot.name}{agent.bot.role ? ` · ${agent.bot.role}` : ""}
                  {(isAuthor || agent.added_by === currentUserId) && " (click to manage)"}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      )}
      {/* Add agent popover */}
      {isTeamMember && unallocatedBots.length > 0 && (
        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-5 w-5 rounded-full">
              <Plus className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Add your agent</p>
            <div className="space-y-1">
              {unallocatedBots.map((bot) => {
                const colors = getRoleColor(bot.role);
                return (
                <button
                  key={bot.id}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
                  onClick={() => handleAllocate(bot.id)}
                  disabled={pending}
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={bot.avatar_url ?? undefined} />
                    <AvatarFallback className={`text-[10px] ${colors.avatarBg} ${colors.avatarText}`}>
                      {bot.name?.[0]?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col leading-tight text-left">
                    <span>{bot.name}</span>
                    {bot.role && (
                      <span className="text-[11px] text-muted-foreground">{bot.role}</span>
                    )}
                  </div>
                </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}
      <AgentProfileDialog
        botId={selectedBotId}
        open={selectedBotId !== null}
        onOpenChange={(open) => { if (!open) setSelectedBotId(null); }}
        onRemove={
          selectedBotId && (() => {
            const agent = ideaAgents.find((a) => a.bot_id === selectedBotId);
            return agent && (isAuthor || agent.added_by === currentUserId);
          })()
            ? handleRemove
            : undefined
        }
      />
    </div>
  );
}
