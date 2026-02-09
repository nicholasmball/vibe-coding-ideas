"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getLabelColorConfig } from "@/lib/utils";
import type { BoardLabel, User } from "@/types";

interface BoardToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  assigneeFilter: string;
  onAssigneeChange: (value: string) => void;
  labelFilter: string[];
  onLabelFilterChange: (value: string[]) => void;
  dueDateFilter: string;
  onDueDateChange: (value: string) => void;
  teamMembers: User[];
  boardLabels: BoardLabel[];
  showArchived: boolean;
  onShowArchivedChange: (value: boolean) => void;
  archivedCount: number;
}

export function BoardToolbar({
  searchQuery,
  onSearchChange,
  assigneeFilter,
  onAssigneeChange,
  labelFilter,
  onLabelFilterChange,
  dueDateFilter,
  onDueDateChange,
  teamMembers,
  boardLabels,
  showArchived,
  onShowArchivedChange,
  archivedCount,
}: BoardToolbarProps) {
  function handleLabelToggle(labelId: string) {
    if (labelFilter.includes(labelId)) {
      onLabelFilterChange(labelFilter.filter((id) => id !== labelId));
    } else {
      onLabelFilterChange([...labelFilter, labelId]);
    }
  }

  const hasFilters =
    searchQuery || assigneeFilter !== "all" || labelFilter.length > 0 || dueDateFilter !== "all";

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks..."
          className="h-8 w-48 pl-8 text-xs"
        />
      </div>

      {/* Assignee filter */}
      <Select value={assigneeFilter} onValueChange={onAssigneeChange}>
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All members</SelectItem>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          {teamMembers.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.full_name ?? member.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Label filter */}
      {boardLabels.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              Labels
              {labelFilter.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                  {labelFilter.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-2" align="start">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Filter by labels
            </p>
            <div className="space-y-1">
              {boardLabels.map((label) => {
                const config = getLabelColorConfig(label.color);
                return (
                  <div
                    key={label.id}
                    className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={labelFilter.includes(label.id)}
                      onCheckedChange={() => handleLabelToggle(label.id)}
                    />
                    <span
                      className={`h-3 w-3 shrink-0 rounded-sm ${config.swatchColor}`}
                    />
                    <span className="text-xs font-medium">{label.name}</span>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Due date filter */}
      <Select value={dueDateFilter} onValueChange={onDueDateChange}>
        <SelectTrigger className="h-8 w-32 text-xs">
          <SelectValue placeholder="Due date" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All dates</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
          <SelectItem value="due_soon">Due soon</SelectItem>
        </SelectContent>
      </Select>

      {/* Show archived toggle */}
      {archivedCount > 0 && (
        <Button
          variant={showArchived ? "secondary" : "ghost"}
          size="sm"
          className="h-8 text-xs"
          onClick={() => onShowArchivedChange(!showArchived)}
        >
          {showArchived ? "Hide" : "Show"} archived ({archivedCount})
        </Button>
      )}

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-xs text-muted-foreground"
          onClick={() => {
            onSearchChange("");
            onAssigneeChange("all");
            onLabelFilterChange([]);
            onDueDateChange("all");
          }}
        >
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
