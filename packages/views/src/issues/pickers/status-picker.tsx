import React from "react";
import type { IssueStatus } from "@openzoo/core";
import { Button, Popover, PopoverTrigger, PopoverContent } from "@openzoo/ui";

const STATUS_OPTIONS: { value: IssueStatus; label: string; color: string }[] = [
  { value: "backlog", label: "Backlog", color: "bg-gray-400" },
  { value: "todo", label: "Todo", color: "bg-blue-400" },
  { value: "in_progress", label: "In Progress", color: "bg-yellow-400" },
  { value: "in_review", label: "In Review", color: "bg-purple-400" },
  { value: "done", label: "Done", color: "bg-green-400" },
  { value: "blocked", label: "Blocked", color: "bg-red-400" },
  { value: "cancelled", label: "Cancelled", color: "bg-gray-300" },
];

interface StatusPickerProps {
  value: IssueStatus;
  onChange: (status: IssueStatus) => void;
}

export function StatusPicker({ value, onChange }: StatusPickerProps) {
  const current = STATUS_OPTIONS.find((o) => o.value === value);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <span className={`w-2 h-2 rounded-full ${current?.color || "bg-gray-400"}`} />
          {current?.label || value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => { onChange(opt.value); }}
          >
            <span className={`w-2 h-2 rounded-full ${opt.color}`} />
            {opt.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
