import React from "react";
import type { IssuePriority } from "@openzoo/core";
import { Button, Popover, PopoverTrigger, PopoverContent } from "@openzoo/ui";

const PRIORITY_OPTIONS: { value: IssuePriority; label: string; icon: string }[] = [
  { value: "urgent", label: "Urgent", icon: "🔴" },
  { value: "high", label: "High", icon: "🟠" },
  { value: "medium", label: "Medium", icon: "🟡" },
  { value: "low", label: "Low", icon: "🔵" },
  { value: "none", label: "No Priority", icon: "⚪" },
];

interface PriorityPickerProps {
  value: IssuePriority;
  onChange: (priority: IssuePriority) => void;
}

export function PriorityPicker({ value, onChange }: PriorityPickerProps) {
  const current = PRIORITY_OPTIONS.find((o) => o.value === value);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <span>{current?.icon}</span>
          {current?.label || value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1">
        {PRIORITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => { onChange(opt.value); }}
          >
            <span>{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
