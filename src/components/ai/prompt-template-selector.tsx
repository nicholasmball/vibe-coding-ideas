"use client";

import { useState, useEffect, useCallback } from "react";
import { BookmarkPlus, BookMarked, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  listPromptTemplates,
  createPromptTemplate,
  deletePromptTemplate,
} from "@/actions/prompt-templates";
import type { AiPromptTemplate } from "@/types";

interface PromptTemplateSelectorProps {
  type: "enhance" | "generate";
  currentPrompt: string;
  onSelectTemplate: (promptText: string) => void;
  disabled?: boolean;
}

export function PromptTemplateSelector({
  type,
  currentPrompt,
  onSelectTemplate,
  disabled,
}: PromptTemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<AiPromptTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPromptTemplates(type);
      setTemplates(data);
    } catch {
      // Silently fail — templates are non-critical
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    if (open) fetchTemplates();
  }, [open, fetchTemplates]);

  async function handleSave() {
    if (!newName.trim() || !currentPrompt.trim()) return;
    setSaving(true);
    try {
      const created = await createPromptTemplate(newName.trim(), currentPrompt.trim(), type);
      setTemplates((prev) => [created, ...prev]);
      setNewName("");
      setShowSaveForm(false);
      toast.success("Template saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(templateId: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    try {
      await deletePromptTemplate(templateId);
    } catch {
      fetchTemplates(); // Rollback by refetching
      toast.error("Failed to delete template");
    }
  }

  function handleSelect(template: AiPromptTemplate) {
    onSelectTemplate(template.prompt_text);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground"
          disabled={disabled}
        >
          <BookMarked className="h-3.5 w-3.5" />
          Templates
          {templates.length > 0 && (
            <span className="text-[10px]">({templates.length})</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-1">
            {templates.length === 0 && !showSaveForm && (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                No saved templates yet
              </p>
            )}
            {templates.map((template) => (
              <div
                key={template.id}
                className="group flex items-center gap-1 rounded-md hover:bg-muted/50"
              >
                <button
                  className="flex-1 px-2 py-1.5 text-left text-xs truncate"
                  onClick={() => handleSelect(template)}
                  title={template.prompt_text}
                >
                  {template.name}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                  onClick={() => handleDelete(template.id)}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            ))}

            <div className="border-t border-border pt-1">
              {showSaveForm ? (
                <div className="flex gap-1 p-1">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Template name..."
                    className="h-7 text-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                      if (e.key === "Escape") { setShowSaveForm(false); setNewName(""); }
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    disabled={saving || !newName.trim() || !currentPrompt.trim()}
                    onClick={handleSave}
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-1.5 h-7 text-xs text-muted-foreground"
                  onClick={() => setShowSaveForm(true)}
                  disabled={!currentPrompt.trim()}
                >
                  <BookmarkPlus className="h-3.5 w-3.5" />
                  Save current prompt
                </Button>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
