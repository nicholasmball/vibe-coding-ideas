"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  RotateCcw,
  AlertCircle,
  MessageSquare,
  UserCheck,
  Check,
  X,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { logTaskActivity } from "@/lib/activity";
import {
  createWorkflowStep,
  retryWorkflowStep,
  deleteWorkflowStep,
  approveWorkflowStep,
} from "@/actions/workflow";
import { cn, getInitials } from "@/lib/utils";
import { useBotRoles } from "@/components/bot-roles-context";
import { getRoleColor } from "@/lib/agent-colors";
import { StepDetailDialog } from "./step-detail-dialog";
import type { TaskWorkflowStepWithAgent, User } from "@/types";

interface WorkflowSectionProps {
  steps: TaskWorkflowStepWithAgent[];
  taskId: string;
  ideaId: string;
  currentUserId?: string;
  ideaAgents?: User[];
  isReadOnly?: boolean;
}

const STATUS_STYLES: Record<
  string,
  { badge: string; label: string }
> = {
  pending: {
    badge: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    label: "Pending",
  },
  in_progress: {
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse",
    label: "In Progress",
  },
  completed: {
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    label: "Completed",
  },
  awaiting_approval: {
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse",
    label: "Awaiting Approval",
  },
  failed: {
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
    label: "Failed",
  },
};

export function WorkflowSection({
  steps,
  taskId,
  ideaId,
  currentUserId,
  ideaAgents = [],
  isReadOnly = false,
}: WorkflowSectionProps) {
  const botRoles = useBotRoles();
  const [localSteps, setLocalSteps] =
    useState<TaskWorkflowStepWithAgent[]>(steps);
  const [newTitle, setNewTitle] = useState("");
  const [newBotId, setNewBotId] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newHumanCheck, setNewHumanCheck] = useState(false);
  const [selectedStep, setSelectedStep] = useState<TaskWorkflowStepWithAgent | null>(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const pendingOps = useRef(0);

  useEffect(() => {
    if (pendingOps.current === 0) {
      setLocalSteps(steps);
      // Keep selected step in sync with latest data
      if (selectedStep) {
        const updated = steps.find((s) => s.id === selectedStep.id);
        if (updated) setSelectedStep(updated);
      }
    }
  }, [steps]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = localSteps.length;
  const done = localSteps.filter((s) => s.status === "completed").length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || !newBotId) return;

    const agent = ideaAgents.find((a) => a.id === newBotId) ?? null;
    if (!agent) return;

    const tempId = `temp-${Date.now()}`;
    const maxPos = localSteps.reduce((max, s) => Math.max(max, s.position), 0);
    const optimisticStep: TaskWorkflowStepWithAgent = {
      id: tempId,
      task_id: taskId,
      idea_id: ideaId,
      bot_id: newBotId,
      human_check_required: newHumanCheck,
      title,
      description: newDescription || null,
      status: "pending",
      position: maxPos + 1000,
      comment_count: 0,
      started_at: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      agent,
    };
    setLocalSteps((prev) => [...prev, optimisticStep]);
    setNewTitle("");
    setNewDescription("");
    setNewHumanCheck(false);

    pendingOps.current++;
    try {
      await createWorkflowStep(
        taskId,
        ideaId,
        title,
        newDescription || null,
        newBotId,
        newHumanCheck
      );
      if (currentUserId) {
        logTaskActivity(taskId, ideaId, currentUserId, "workflow_step_added", {
          title,
        });
      }
    } catch {
      setLocalSteps((prev) => prev.filter((s) => s.id !== tempId));
      toast.error("Failed to add workflow step");
    } finally {
      pendingOps.current--;
    }
  }

  async function handleRetry(stepId: string) {
    const step = localSteps.find((s) => s.id === stepId);
    if (!step) return;

    setLocalSteps((prev) =>
      prev.map((s) =>
        s.id === stepId ? { ...s, status: "pending" } : s
      )
    );

    pendingOps.current++;
    try {
      await retryWorkflowStep(stepId, ideaId);
    } catch {
      setLocalSteps((prev) =>
        prev.map((s) =>
          s.id === stepId ? { ...s, status: "failed" } : s
        )
      );
      toast.error("Failed to retry step");
    } finally {
      pendingOps.current--;
    }
  }

  async function handleApprove(stepId: string) {
    setLocalSteps((prev) =>
      prev.map((s) =>
        s.id === stepId ? { ...s, status: "completed" } : s
      )
    );

    pendingOps.current++;
    try {
      await approveWorkflowStep(stepId, ideaId);
      toast.success("Step approved");
    } catch {
      setLocalSteps((prev) =>
        prev.map((s) =>
          s.id === stepId ? { ...s, status: "awaiting_approval" } : s
        )
      );
      toast.error("Failed to approve step");
    } finally {
      pendingOps.current--;
    }
  }

  async function handleDelete(stepId: string) {
    const removed = localSteps.find((s) => s.id === stepId);
    setLocalSteps((prev) => prev.filter((s) => s.id !== stepId));

    pendingOps.current++;
    try {
      await deleteWorkflowStep(stepId, ideaId);
    } catch {
      if (removed) {
        setLocalSteps((prev) => [...prev, removed]);
      }
      toast.error("Failed to delete workflow step");
    } finally {
      pendingOps.current--;
    }
  }

  const sortedSteps = [...localSteps].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Workflow</span>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">
            {done}/{total}
          </span>
        )}
      </div>

      {total > 0 && <Progress value={progress} className="h-1.5" />}

      <div className="space-y-1">
        {sortedSteps.map((step, index) => {
            const style = STATUS_STYLES[step.status] ?? STATUS_STYLES.pending;
            const ac = step.agent?.is_bot ? getRoleColor(botRoles?.[step.agent.id]) : null;

            return (
              <div key={step.id} className="rounded-md border border-border/50">
                <div
                  className="group flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedStep(step);
                    setSelectedStepIndex(index + 1);
                  }}
                >
                  <span className="text-xs text-muted-foreground w-4 shrink-0">
                    {index + 1}.
                  </span>
                  <span className="flex-1 text-sm truncate">{step.title}</span>

                  {/* Failure indicator */}
                  {step.status === "failed" && (
                    <AlertCircle className="h-3 w-3 shrink-0 text-red-400" />
                  )}

                  {/* Human check required indicator */}
                  {step.human_check_required && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30">
                          <UserCheck className="h-2.5 w-2.5 text-amber-400" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Human check required</TooltipContent>
                    </Tooltip>
                  )}

                  {/* Comment count badge */}
                  {step.comment_count > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <MessageSquare className="h-2.5 w-2.5" />
                      {step.comment_count}
                    </span>
                  )}

                  {/* Agent avatar */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage
                          src={step.agent?.avatar_url ?? undefined}
                        />
                        <AvatarFallback className={cn("text-[8px]", ac?.avatarBg, ac?.avatarText)}>
                          {getInitials(step.agent?.full_name ?? "?")}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      {step.agent?.full_name ?? "Unknown agent"}
                    </TooltipContent>
                  </Tooltip>

                  {/* Status badge */}
                  <span
                    className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${style.badge}`}
                  >
                    {style.label}
                  </span>

                  {/* Approve/Reject buttons (always visible when awaiting) */}
                  {!isReadOnly && step.status === "awaiting_approval" && (
                    <div
                      className="flex items-center gap-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleApprove(step.id)}
                          >
                            <Check className="h-3 w-3 text-emerald-400" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Approve</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setSelectedStep(step);
                              setSelectedStepIndex(index + 1);
                            }}
                          >
                            <X className="h-3 w-3 text-red-400" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reject (provide feedback)</TooltipContent>
                      </Tooltip>
                    </div>
                  )}

                  {/* Action buttons */}
                  {!isReadOnly && (
                    <div
                      className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {step.status === "failed" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRetry(step.id)}
                            >
                              <RotateCcw className="h-3 w-3 text-amber-400" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Retry step</TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDelete(step.id)}
                          >
                            <Trash2 className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete step</TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {!isReadOnly && (
        <form onSubmit={handleAdd} className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add a workflow step..."
              className="h-8 text-sm"
            />
            <Select value={newBotId} onValueChange={setNewBotId}>
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                {ideaAgents.map((agent) => {
                  const ac = agent.is_bot ? getRoleColor(botRoles?.[agent.id]) : null;
                  return (
                    <SelectItem key={agent.id} value={agent.id}>
                      <span className="flex items-center gap-1.5">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={agent.avatar_url ?? undefined} />
                          <AvatarFallback className={cn("text-[7px]", ac?.avatarBg, ac?.avatarText)}>
                            {getInitials(agent.full_name ?? "?")}
                          </AvatarFallback>
                        </Avatar>
                        {agent.full_name ?? "Agent"}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  className="h-8"
                  disabled={!newTitle.trim() || !newBotId}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add step</TooltipContent>
            </Tooltip>
          </div>
          {newTitle.trim() && (
            <>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Step description (optional)..."
                className="min-h-[60px] text-xs"
              />
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={newHumanCheck}
                  onCheckedChange={(checked) => setNewHumanCheck(checked === true)}
                  className="h-3.5 w-3.5"
                />
                <UserCheck className="h-3 w-3 text-amber-400" />
                Require human approval before completing
              </label>
            </>
          )}
        </form>
      )}

      {/* Step detail dialog */}
      {selectedStep && (
        <StepDetailDialog
          open={!!selectedStep}
          onOpenChange={(open) => {
            if (!open) setSelectedStep(null);
          }}
          step={selectedStep}
          ideaId={ideaId}
          stepIndex={selectedStepIndex}
          currentUserId={currentUserId}
          isReadOnly={isReadOnly}
          allSteps={sortedSteps}
        />
      )}
    </div>
  );
}
