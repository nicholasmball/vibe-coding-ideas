"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ImportCsvTab } from "./import-csv-tab";
import { ImportJsonTab } from "./import-json-tab";
import { ImportBulkTextTab } from "./import-bulk-text-tab";
import type { ImportProgress } from "@/lib/import";
import type { BoardColumnWithTasks, BoardLabel, User } from "@/types";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ideaId: string;
  currentUserId: string;
  columns: BoardColumnWithTasks[];
  boardLabels: BoardLabel[];
  teamMembers: User[];
}

export function ImportDialog({
  open,
  onOpenChange,
  ideaId,
  currentUserId,
  columns,
  boardLabels,
  teamMembers,
}: ImportDialogProps) {
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [isRefreshing, startTransition] = useTransition();

  const busy = importing || isRefreshing;

  function handleComplete() {
    setProgress({ phase: "Loading board...", current: 1, total: 1 });
    startTransition(() => {
      router.refresh();
    });
  }

  // Close dialog once the transition (refresh) finishes
  // We check !importing because the transition ends after router.refresh settles
  if (!isRefreshing && !importing && progress?.phase === "Loading board...") {
    // Reset and close — schedule via microtask to avoid setState-during-render warning
    queueMicrotask(() => {
      setProgress(null);
      setImporting(false);
      onOpenChange(false);
    });
  }

  function handleImportingChange(isImporting: boolean) {
    setImporting(isImporting);
    if (!isImporting && !isRefreshing) setProgress(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={busy ? undefined : onOpenChange}
    >
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
        onPointerDownOutside={busy ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={busy ? (e) => e.preventDefault() : undefined}
      >
        {busy ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="w-full max-w-xs space-y-2">
              <p className="text-center text-sm font-medium">
                {progress?.phase ?? "Preparing import..."}
              </p>
              <Progress
                value={
                  progress && progress.total > 0
                    ? (progress.current / progress.total) * 100
                    : 0
                }
                className="h-2"
              />
              {progress && progress.total > 0 && !isRefreshing && (
                <p className="text-center text-xs text-muted-foreground">
                  {progress.current} / {progress.total} tasks
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Please don&apos;t close this dialog
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Import Tasks</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="text">
              <TabsList className="w-full">
                <TabsTrigger value="text" className="flex-1">
                  Bulk Text
                </TabsTrigger>
                <TabsTrigger value="csv" className="flex-1">
                  CSV
                </TabsTrigger>
                <TabsTrigger value="json" className="flex-1">
                  JSON
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="mt-4">
                <ImportBulkTextTab
                  ideaId={ideaId}
                  currentUserId={currentUserId}
                  columns={columns}
                  boardLabels={boardLabels}
                  teamMembers={teamMembers}
                  onComplete={handleComplete}
                  onImportingChange={handleImportingChange}
                  onProgress={setProgress}
                />
              </TabsContent>

              <TabsContent value="csv" className="mt-4">
                <ImportCsvTab
                  ideaId={ideaId}
                  currentUserId={currentUserId}
                  columns={columns}
                  boardLabels={boardLabels}
                  teamMembers={teamMembers}
                  onComplete={handleComplete}
                  onImportingChange={handleImportingChange}
                  onProgress={setProgress}
                />
              </TabsContent>

              <TabsContent value="json" className="mt-4">
                <ImportJsonTab
                  ideaId={ideaId}
                  currentUserId={currentUserId}
                  columns={columns}
                  boardLabels={boardLabels}
                  teamMembers={teamMembers}
                  onComplete={handleComplete}
                  onImportingChange={handleImportingChange}
                  onProgress={setProgress}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
