import React from "react";
import type { IssueStatus, IssuePriority } from "@openzoo/core";
import { Button, Input } from "@openzoo/ui";
import { List, Columns } from "lucide-react";

const STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: "Backlog", todo: "Todo", in_progress: "In Progress",
  in_review: "In Review", done: "Done", blocked: "Blocked", cancelled: "Cancelled",
};

const PRIORITY_LABELS: Record<IssuePriority, string> = {
  urgent: "Urgent", high: "High", medium: "Medium", low: "Low", none: "No Priority",
};

type ViewMode = "board" | "list";

interface IssuesHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: IssueStatus | null;
  onStatusFilterChange: (status: IssueStatus | null) => void;
  priorityFilter: IssuePriority | null;
  onPriorityFilterChange: (priority: IssuePriority | null) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onCreateClick: () => void;
  totalCount: number;
}

export function IssuesHeader({
  search, onSearchChange,
  statusFilter, onStatusFilterChange,
  priorityFilter, onPriorityFilterChange,
  viewMode, onViewModeChange,
  onCreateClick, totalCount,
}: IssuesHeaderProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Input
        placeholder="Search issues..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-xs"
      />
      <select
        value={statusFilter || ""}
        onChange={(e) => onStatusFilterChange((e.target.value || null) as IssueStatus | null)}
        className="h-9 rounded-md border bg-background px-3 text-sm"
      >
        <option value="">All Statuses</option>
        {(Object.keys(STATUS_LABELS) as IssueStatus[]).map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>
      <select
        value={priorityFilter || ""}
        onChange={(e) => onPriorityFilterChange((e.target.value || null) as IssuePriority | null)}
        className="h-9 rounded-md border bg-background px-3 text-sm"
      >
        <option value="">All Priorities</option>
        {(Object.keys(PRIORITY_LABELS) as IssuePriority[]).map((p) => (
          <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
        ))}
      </select>
      <div className="flex items-center border rounded-md">
        <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" onClick={() => onViewModeChange("list")}><List className="h-4 w-4" /></Button>
        <Button variant={viewMode === "board" ? "secondary" : "ghost"} size="sm" onClick={() => onViewModeChange("board")}><Columns className="h-4 w-4" /></Button>
      </div>
      <span className="text-xs text-muted-foreground">{totalCount} issues</span>
      <div className="flex-1" />
      <Button onClick={onCreateClick}>New Issue</Button>
    </div>
  );
}
