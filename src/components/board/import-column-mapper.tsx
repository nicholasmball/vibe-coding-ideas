"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ColumnMapping } from "@/lib/import";
import type { BoardColumnWithTasks } from "@/types";

interface ImportColumnMapperProps {
  sourceNames: string[];
  columns: BoardColumnWithTasks[];
  mapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
}

export function ImportColumnMapper({
  sourceNames,
  columns,
  mapping,
  onMappingChange,
}: ImportColumnMapperProps) {
  function handleChange(sourceName: string, value: string) {
    onMappingChange({ ...mapping, [sourceName]: value });
  }

  if (sourceNames.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Map columns</p>
      <p className="text-xs text-muted-foreground">
        Match source column names to your board columns, or create new ones.
      </p>
      <div className="space-y-2">
        {sourceNames.map((name) => (
          <div key={name} className="flex items-center gap-3">
            <span className="w-36 shrink-0 truncate text-sm font-medium">
              {name}
            </span>
            <span className="text-xs text-muted-foreground">&rarr;</span>
            <Select
              value={mapping[name] ?? "__new__"}
              onValueChange={(v) => handleChange(name, v)}
            >
              <SelectTrigger className="h-8 w-48 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.title}
                  </SelectItem>
                ))}
                <SelectItem value="__new__">+ Create new column</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
