"use client";

import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBotRoles } from "@/components/bot-roles-context";
import { getRoleColor } from "@/lib/agent-colors";
import { getInitials } from "@/lib/utils";
import type { User } from "@/types";

interface AssigneeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  teamMembers: User[];
  ideaAgents?: User[];
  triggerClassName?: string;
  /** Current assignee (from task data) — included in dropdown even if not a collaborator/agent */
  currentAssignee?: Pick<User, "id" | "full_name" | "email" | "avatar_url" | "is_bot"> | null;
}

export function AssigneeSelect({
  value,
  onValueChange,
  teamMembers,
  ideaAgents = [],
  triggerClassName,
  currentAssignee,
}: AssigneeSelectProps) {
  const botRoles = useBotRoles();
  const humanMembers = useMemo(() => {
    const humans = teamMembers.filter((m) => !m.is_bot);
    // Include current assignee if they're a human not in the team
    if (
      currentAssignee &&
      !currentAssignee.is_bot &&
      !humans.some((m) => m.id === currentAssignee.id)
    ) {
      humans.push(currentAssignee as User);
    }
    return humans;
  }, [teamMembers, currentAssignee]);

  const allAgents = useMemo(() => {
    const agents = [...ideaAgents];
    for (const m of teamMembers) {
      if (m.is_bot && !ideaAgents.some((a) => a.id === m.id)) {
        agents.push(m);
      }
    }
    // Include current assignee if they're a bot not in the list
    if (
      currentAssignee &&
      currentAssignee.is_bot &&
      !agents.some((a) => a.id === currentAssignee.id)
    ) {
      agents.push(currentAssignee as User);
    }
    return agents;
  }, [teamMembers, ideaAgents, currentAssignee]);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder="Unassigned" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {humanMembers.length > 0 && (
          <SelectGroup>
            <SelectLabel>Collaborators</SelectLabel>
            {humanMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                <span className="inline-flex items-center gap-1.5">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={member.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[8px]">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  {member.full_name ?? member.email}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {allAgents.length > 0 && (
          <SelectGroup>
            <SelectLabel>Agents</SelectLabel>
            {allAgents.map((bot) => {
              const bc = getRoleColor(botRoles?.[bot.id]);
              return (
                <SelectItem key={bot.id} value={bot.id}>
                  <span className="inline-flex items-center gap-1.5">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={bot.avatar_url ?? undefined} />
                      <AvatarFallback
                        className={`text-[8px] ${bc.avatarBg} ${bc.avatarText}`}
                      >
                        {getInitials(bot.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    {bot.full_name ?? bot.email}
                  </span>
                </SelectItem>
              );
            })}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
