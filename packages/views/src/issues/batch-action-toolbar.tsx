import React from "react";
import type { IssueStatus } from "@openzoo/core";
import { Button } from "@openzoo/ui";

const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
];

interface BatchActionToolbarProps {
  selectedCount: number;
  onStatusChange: (status: IssueStatus) => void;
  onDelete: () => void;
  onClear: () => void;
}

export function BatchActionToolbar({ selectedCount, onStatusChange, onDelete, onClear }: BatchActionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-primary/5 border rounded-lg">
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <div className="flex items-center gap-1 ml-2">
        {STATUS_OPTIONS.map((opt) => (
          <Button key={opt.value} variant="ghost" size="sm" onClick={() => onStatusChange(opt.value)}>
            {opt.label}
          </Button>
        ))}
      </div>
      <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>Delete</Button>
      <div className="flex-1" />
      <Button variant="ghost" size="sm" onClick={onClear}>Clear</Button>
    </div>
  );
}
