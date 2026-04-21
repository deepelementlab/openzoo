"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@openzoo/ui/components/popover";
import { Button } from "@openzoo/ui/components/button";
import { Calendar } from "@openzoo/ui/components/calendar";

interface DueDatePickerProps {
  value?: string;
  onChange?: (date: string | null) => void;
}

export function DueDatePicker({ value, onChange }: DueDatePickerProps) {
  const [open, setOpen] = useState(false);
  const dateValue = value ? new Date(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CalendarIcon className="size-3.5" />
          {value ? new Date(value).toLocaleDateString() : "No due date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          selected={dateValue}
          onSelect={(d) => {
            onChange?.(d ? d.toISOString().split("T")[0] ?? null : null);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
