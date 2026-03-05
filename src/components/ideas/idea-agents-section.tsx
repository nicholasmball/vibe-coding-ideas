"use client";

import { useState, useTransition } from "react";
import { Bot, Crown, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AgentProfileDialog } from "@/components/agents/agent-profile-dialog";
import { getRoleColor } from "@/lib/agent-colors";
import { allocateAgent, removeIdeaAgent, setOrchestrationAgent } from "@/actions/idea-agents";
import type { IdeaAgentWithDetails, BotProfile } from "@/types";

interface IdeaAgentsSectionProps {
  ideaId: string;
  ideaAgents: IdeaAgentWithDetails[];
  currentUserId: string;
  isAuthor: boolean;
  isTeamMember: boolean;
  userBots: BotProfile[];
  orchestratorBotId: string | null;
}

export function IdeaAgentsSection({
  ideaId,
  ideaAgents,
  currentUserId,
  isAuthor,
  isTeamMember,
  userBots,
  orchestratorBotId,
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

  function handleToggleOrchestrator(botId: string) {
    startTransition(async () => {
      try {
        const newBotId = botId === orchestratorBotId ? null : botId;
        await setOrchestrationAgent(ideaId, newBotId);
        toast.success(
          newBotId ? "Orchestration agent set" : "Orchestration agent cleared"
        );
      } catch {
        toast.error("Failed to update orchestration agent");
      }
    });
  }

  // Don't show anything to non-team members if pool is empty
  if (!isTeamMember && ideaAgents.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Bot className="h-4 w-4" />
        Agent Pool ({ideaAgents.length})
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
      </h3>
      {ideaAgents.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No agents allocated yet. Team members can add their agents to the shared pool.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {ideaAgents.map((agent) => {
            const canRemove = isAuthor || agent.added_by === currentUserId;
            const isOrchestrator = agent.bot_id === orchestratorBotId;
            const colors = getRoleColor(agent.bot.role);
            return (
              <div
                key={agent.id}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors hover:border-primary ${isOrchestrator ? "border-amber-500/40" : "border-border"}`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedBotId(agent.bot_id)}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <div className="relative">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={agent.bot.avatar_url ?? undefined} />
                      <AvatarFallback className={`text-[10px] ${colors.avatarBg} ${colors.avatarText}`}>
                        {agent.bot.name?.[0]?.toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <Bot className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 text-primary" />
                  </div>
                  <div className="flex flex-col leading-tight text-left">
                    <span>{agent.bot.name}</span>
                    {agent.bot.role && (
                      <span className="text-[11px] text-muted-foreground">{agent.bot.role}</span>
                    )}
                  </div>
                </button>
                {isTeamMember && (
                  <button
                    onClick={() => handleToggleOrchestrator(agent.bot_id)}
                    disabled={pending}
                    title={isOrchestrator ? "Remove as orchestrator" : "Set as orchestrator"}
                    className={`ml-0.5 rounded-full p-0.5 transition-colors disabled:opacity-50 ${isOrchestrator ? "text-amber-500" : "text-muted-foreground/40 hover:text-amber-500/70"}`}
                  >
                    <Crown className="h-3 w-3" fill={isOrchestrator ? "currentColor" : "none"} />
                  </button>
                )}
                {canRemove && (
                  <button
                    onClick={() => handleRemove(agent.bot_id)}
                    disabled={pending}
                    className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <AgentProfileDialog
        botId={selectedBotId}
        open={selectedBotId !== null}
        onOpenChange={(open) => { if (!open) setSelectedBotId(null); }}
      />
    </div>
  );
}
