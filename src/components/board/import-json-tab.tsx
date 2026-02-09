"use client";

import { useState, useCallback } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImportColumnMapper } from "./import-column-mapper";
import { ImportPreviewTable } from "./import-preview-table";
import {
  detectJsonFormat,
  parseTrelloJson,
  parseCustomJson,
  autoMapColumns,
  getUniqueColumnNames,
  executeBulkImport,
  type ColumnMapping,
  type ImportProgress,
  type ImportTask,
} from "@/lib/import";
import type { BoardColumnWithTasks, BoardLabel, User } from "@/types";
import { toast } from "sonner";

interface ImportJsonTabProps {
  ideaId: string;
  currentUserId: string;
  columns: BoardColumnWithTasks[];
  boardLabels: BoardLabel[];
  teamMembers: User[];
  onComplete: () => void;
  onImportingChange: (importing: boolean) => void;
  onProgress: (progress: ImportProgress) => void;
}

export function ImportJsonTab({
  ideaId,
  currentUserId,
  columns,
  boardLabels,
  teamMembers,
  onComplete,
  onImportingChange,
  onProgress,
}: ImportJsonTabProps) {
  const [jsonText, setJsonText] = useState("");
  const [tasks, setTasks] = useState<ImportTask[]>([]);
  const [sourceColumnNames, setSourceColumnNames] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [format, setFormat] = useState<"trello" | "custom" | null>(null);
  const [step, setStep] = useState<"input" | "preview">("input");

  const processJson = useCallback(
    (text: string) => {
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        toast.error("Invalid JSON");
        return;
      }

      const fmt = detectJsonFormat(data);
      if (fmt === "unknown") {
        toast.error(
          "Unrecognized format. Expected Trello export (lists + cards) or custom format (tasks array)."
        );
        return;
      }

      setFormat(fmt);

      let parsed: ImportTask[];
      if (fmt === "trello") {
        parsed = parseTrelloJson(data as Parameters<typeof parseTrelloJson>[0]);
        toast.info(`Detected Trello export (${parsed.length} cards)`);
      } else {
        parsed = parseCustomJson(
          data as Parameters<typeof parseCustomJson>[0]
        );
      }

      if (parsed.length === 0) {
        toast.error("No tasks found in the JSON data");
        return;
      }

      setTasks(parsed);

      const colNames = getUniqueColumnNames(parsed);
      setSourceColumnNames(colNames);
      if (colNames.length > 0) {
        setColumnMapping(autoMapColumns(colNames, columns));
      }

      setStep("preview");
    },
    [columns]
  );

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setJsonText(text);
      processJson(text);
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleParsePasted() {
    if (!jsonText.trim()) return;
    processJson(jsonText);
  }

  async function handleImport() {
    if (tasks.length === 0) return;

    onImportingChange(true);
    try {
      const defaultColId = columns[0]?.id ?? "";
      const result = await executeBulkImport(
        tasks,
        ideaId,
        currentUserId,
        columns,
        columnMapping,
        defaultColId,
        boardLabels,
        teamMembers,
        onProgress
      );

      if (result.errors.length > 0) {
        toast.error(`Imported ${result.created} tasks with errors`, {
          description: result.errors[0],
        });
      } else {
        toast.success(`Imported ${result.created} task${result.created !== 1 ? "s" : ""}`);
      }
      onImportingChange(false);
      onComplete();
    } catch (err) {
      toast.error("Import failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
      onImportingChange(false);
    }
  }

  if (step === "input") {
    return (
      <div className="space-y-4">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center transition-colors hover:border-muted-foreground/50"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drop a JSON file here, or click to browse
          </p>
          <label>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileInput}
              className="hidden"
            />
            <Button variant="outline" size="sm" asChild>
              <span>Choose file</span>
            </Button>
          </label>
        </div>

        <div className="relative flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or paste JSON</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='{"tasks": [{"title": "My task", "column": "To Do"}]}'
          rows={6}
        />

        <p className="text-xs text-muted-foreground">
          Supports Trello board exports and custom JSON with a{" "}
          <code className="rounded bg-muted px-1">tasks</code> array.
        </p>

        <Button
          onClick={handleParsePasted}
          disabled={!jsonText.trim()}
          className="w-full"
        >
          Parse JSON
        </Button>
      </div>
    );
  }

  // step === "preview"
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {format === "trello" ? "Trello import" : "JSON import"} &mdash;{" "}
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setStep("input");
            setTasks([]);
          }}
        >
          Back
        </Button>
      </div>

      {sourceColumnNames.length > 0 && (
        <ImportColumnMapper
          sourceNames={sourceColumnNames}
          columns={columns}
          mapping={columnMapping}
          onMappingChange={setColumnMapping}
        />
      )}

      <ImportPreviewTable
        tasks={tasks}
        columns={columns}
        columnMapping={columnMapping}
        defaultColumnId={columns[0]?.id ?? ""}
      />

      <Button
        onClick={handleImport}
        disabled={tasks.length === 0}
        className="w-full"
      >
        Import {Math.min(tasks.length, 500)} task{tasks.length !== 1 ? "s" : ""}
      </Button>
    </div>
  );
}
