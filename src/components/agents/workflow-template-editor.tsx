"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { WorkflowTemplate, WorkflowTemplateStep } from "@/types";

interface WorkflowTemplateEditorProps {
  value: WorkflowTemplate[];
  onChange: (templates: WorkflowTemplate[]) => void;
}

export function WorkflowTemplateEditor({ value, onChange }: WorkflowTemplateEditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    value.length > 0 ? 0 : null
  );

  function addTemplate() {
    const newTemplate: WorkflowTemplate = {
      name: "",
      steps: [{ title: "" }],
    };
    onChange([...value, newTemplate]);
    setExpandedIndex(value.length);
  }

  function removeTemplate(index: number) {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex !== null && expandedIndex > index) setExpandedIndex(expandedIndex - 1);
  }

  function updateTemplate(index: number, template: WorkflowTemplate) {
    const updated = [...value];
    updated[index] = template;
    onChange(updated);
  }

  function addStep(templateIndex: number) {
    const template = value[templateIndex];
    updateTemplate(templateIndex, {
      ...template,
      steps: [...template.steps, { title: "" }],
    });
  }

  function removeStep(templateIndex: number, stepIndex: number) {
    const template = value[templateIndex];
    if (template.steps.length <= 1) return;
    updateTemplate(templateIndex, {
      ...template,
      steps: template.steps.filter((_, i) => i !== stepIndex),
    });
  }

  function updateStep(templateIndex: number, stepIndex: number, step: WorkflowTemplateStep) {
    const template = value[templateIndex];
    const steps = [...template.steps];
    steps[stepIndex] = step;
    updateTemplate(templateIndex, { ...template, steps });
  }

  function moveStep(templateIndex: number, stepIndex: number, direction: -1 | 1) {
    const template = value[templateIndex];
    const newIndex = stepIndex + direction;
    if (newIndex < 0 || newIndex >= template.steps.length) return;
    const steps = [...template.steps];
    [steps[stepIndex], steps[newIndex]] = [steps[newIndex], steps[stepIndex]];
    updateTemplate(templateIndex, { ...template, steps });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">
          Workflow Templates{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        {value.length < 10 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1"
            onClick={addTemplate}
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
        )}
      </div>

      {value.length === 0 && (
        <p className="text-[10px] text-muted-foreground">
          Define reusable step sequences for this agent to follow when orchestrating tasks.
        </p>
      )}

      <div className="space-y-2">
        {value.map((template, ti) => {
          const isExpanded = expandedIndex === ti;

          return (
            <div
              key={ti}
              className="rounded-md border border-border/50 overflow-hidden"
            >
              {/* Template header */}
              <div
                className="flex items-center gap-2 px-3 py-2 bg-muted/30 cursor-pointer hover:bg-muted/50"
                onClick={() => setExpandedIndex(isExpanded ? null : ti)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
                <Input
                  value={template.name}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateTemplate(ti, { ...template, name: e.target.value });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Template name (e.g. Dev Workflow)"
                  className="h-6 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 shadow-none"
                  maxLength={100}
                />
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {template.steps.length} step{template.steps.length !== 1 ? "s" : ""}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTemplate(ti);
                  }}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>

              {/* Steps */}
              {isExpanded && (
                <div className="px-3 py-2 space-y-1.5">
                  {/* Step flow visualization */}
                  {template.steps.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pb-2 border-b border-border/30 mb-2">
                      {template.steps.map((step, si) => (
                        <span key={si} className="flex items-center gap-1">
                          {si > 0 && (
                            <span className="text-[10px] text-muted-foreground">&gt;</span>
                          )}
                          <span className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                            step.title
                              ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
                              : "border-border/50 text-muted-foreground"
                          )}>
                            {step.title || "..."}
                            {step.human_check_required && (
                              <UserCheck className="inline ml-0.5 h-2.5 w-2.5 text-amber-400" />
                            )}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}

                  {template.steps.map((step, si) => (
                    <div key={si} className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground w-4 shrink-0 text-right">
                        {si + 1}.
                      </span>
                      <div className="flex gap-0.5 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          disabled={si === 0}
                          onClick={() => moveStep(ti, si, -1)}
                        >
                          <GripVertical className="h-3 w-3 text-muted-foreground rotate-180" />
                        </Button>
                      </div>
                      <Input
                        value={step.title}
                        onChange={(e) =>
                          updateStep(ti, si, { ...step, title: e.target.value })
                        }
                        placeholder="e.g. Design, Development, Review"
                        className="h-6 text-xs flex-1"
                        maxLength={200}
                      />
                      <label className="flex items-center shrink-0 cursor-pointer" title="Human check required">
                        <Checkbox
                          checked={step.human_check_required ?? false}
                          onCheckedChange={(checked) =>
                            updateStep(ti, si, { ...step, human_check_required: checked === true })
                          }
                          className="h-3.5 w-3.5"
                        />
                        <UserCheck className="h-3 w-3 text-amber-400 ml-1" />
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 shrink-0"
                        disabled={template.steps.length <= 1}
                        onClick={() => removeStep(ti, si)}
                      >
                        <Trash2 className="h-2.5 w-2.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}

                  {template.steps.length < 20 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs gap-1 w-full"
                      onClick={() => addStep(ti)}
                    >
                      <Plus className="h-3 w-3" />
                      Add step
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
