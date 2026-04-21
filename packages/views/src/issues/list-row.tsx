import React from "react";
import type { Issue, IssueStatus, IssuePriority } from "@openzoo/core";
import { Badge, Checkbox } from "@openzoo/ui";

const STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: "Backlog", todo: "Todo", in_progress: "In Progress",
  in_review: "In Review", done: "Done", blocked: "Blocked", cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  backlog: "bg-gray-100 text-gray-700", todo: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700", in_review: "bg-purple-100 text-purple-700",
  done: "bg-green-100 text-green-700", blocked: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const PRIORITY_LABELS: Record<IssuePriority, string> = {
  urgent: "Urgent", high: "High", medium: "Medium", low: "Low", none: "None",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-red-600", high: "text-orange-500", medium: "text-yellow-500", low: "text-blue-500", none: "text-gray-400",
};

interface ListRowProps {
  issue: Issue;
  selected: boolean;
  onClick: () => void;
  onToggleSelect: () => void;
}

export function ListRow({ issue, selected, onClick, onToggleSelect }: ListRowProps) {
  return (
    <div
      className={`grid grid-cols-[auto_1fr_120px_120px_100px_80px] gap-2 px-4 py-2 border-b hover:bg-muted/30 cursor-pointer transition-colors ${selected ? "bg-primary/5" : ""}`}
      onClick={onClick}
    >
      <div className="w-6" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
      </div>
      <div className="min-w-0">
        <span className="text-xs text-muted-foreground mr-2">{issue.identifier}</span>
        <span className="text-sm font-medium truncate">{issue.title}</span>
      </div>
      <div>
        <Badge className={`text-[10px] ${STATUS_COLORS[issue.status] || ""}`}>{STATUS_LABELS[issue.status]}</Badge>
      </div>
      <div className={`text-xs ${PRIORITY_COLORS[issue.priority] || ""}`}>{PRIORITY_LABELS[issue.priority]}</div>
      <div className="text-xs text-muted-foreground truncate">{issue.assignee_id ? "👤 Assigned" : "—"}</div>
      <div className="text-xs text-muted-foreground">{issue.due_date || "—"}</div>
    </div>
  );
}
