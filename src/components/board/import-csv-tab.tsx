"use client";

import { useState, useCallback } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImportColumnMapper } from "./import-column-mapper";
import { ImportPreviewTable } from "./import-preview-table";
import {
  parseCsv,
  autoDetectCsvMapping,
  csvToImportTasks,
  autoMapColumns,
  getUniqueColumnNames,
  executeBulkImport,
  type CsvFieldMapping,
  type ColumnMapping,
  type ImportProgress,
  type ImportTask,
} from "@/lib/import";
import type { BoardColumnWithTasks, BoardLabel, User } from "@/types";
import { toast } from "sonner";

const FIELD_OPTIONS: { value: CsvFieldMapping[number]; label: string }[] = [
  { value: "title", label: "Title" },
  { value: "description", label: "Description" },
  { value: "column", label: "Column / Status" },
  { value: "assignee", label: "Assignee" },
  { value: "due_date", label: "Due Date" },
  { value: "labels", label: "Labels" },
  { value: "skip", label: "Skip" },
];

interface ImportCsvTabProps {
  ideaId: string;
  currentUserId: string;
  columns: BoardColumnWithTasks[];
  boardLabels: BoardLabel[];
  teamMembers: User[];
  onComplete: () => void;
  onImportingChange: (importing: boolean) => void;
  onProgress: (progress: ImportProgress) => void;
}

export function ImportCsvTab({
  ideaId,
  currentUserId,
  columns,
  boardLabels,
  teamMembers,
  onComplete,
  onImportingChange,
  onProgress,
}: ImportCsvTabProps) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [fieldMapping, setFieldMapping] = useState<CsvFieldMapping>({});
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [tasks, setTasks] = useState<ImportTask[]>([]);
  const [sourceColumnNames, setSourceColumnNames] = useState<string[]>([]);
  const [step, setStep] = useState<"upload" | "map" | "preview">("upload");
  const [fileName, setFileName] = useState("");

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const parsed = parseCsv(text);
        if (parsed.length < 2) {
          toast.error("CSV must have a header row and at least one data row");
          return;
        }

        const h = parsed[0];
        const r = parsed.slice(1);
        const mapping = autoDetectCsvMapping(h);

        setHeaders(h);
        setRows(r);
        setFieldMapping(mapping);
        setStep("map");
      };
      reader.readAsText(file);
    },
    []
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
      handleFile(file);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleFieldChange(index: number, value: string) {
    setFieldMapping((prev) => ({
      ...prev,
      [index]: value as CsvFieldMapping[number],
    }));
  }

  function handleContinueToPreview() {
    const hasTitle = Object.values(fieldMapping).includes("title");
    if (!hasTitle) {
      toast.error("You must map at least one column to Title");
      return;
    }

    const parsed = csvToImportTasks(rows, headers, fieldMapping);
    setTasks(parsed);

    const colNames = getUniqueColumnNames(parsed);
    setSourceColumnNames(colNames);

    if (colNames.length > 0) {
      setColumnMapping(autoMapColumns(colNames, columns));
    }

    setStep("preview");
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

  if (step === "upload") {
    return (
      <div className="space-y-4">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center transition-colors hover:border-muted-foreground/50"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drop a CSV file here, or click to browse
          </p>
          <label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileInput}
              className="hidden"
            />
            <Button variant="outline" size="sm" asChild>
              <span>Choose file</span>
            </Button>
          </label>
        </div>
      </div>
    );
  }

  if (step === "map") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            Map columns from <span className="text-primary">{fileName}</span>
          </p>
          <Button variant="ghost" size="sm" onClick={() => setStep("upload")}>
            Change file
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {rows.length} row{rows.length !== 1 ? "s" : ""} found. Assign each
          CSV column to a task field.
        </p>

        <div className="space-y-2">
          {headers.map((header, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-36 shrink-0 truncate text-sm font-medium">
                {header || `Column ${i + 1}`}
              </span>
              <span className="text-xs text-muted-foreground">&rarr;</span>
              <Select
                value={fieldMapping[i] ?? "skip"}
                onValueChange={(v) => handleFieldChange(i, v)}
              >
                <SelectTrigger className="h-8 w-48 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <Button onClick={handleContinueToPreview} className="w-full">
          Continue to preview
        </Button>
      </div>
    );
  }

  // step === "preview"
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Review import</p>
        <Button variant="ghost" size="sm" onClick={() => setStep("map")}>
          Back to mapping
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
