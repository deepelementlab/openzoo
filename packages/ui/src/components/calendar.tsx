"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CalendarProps = {
  mode?: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function Calendar({
  selected,
  onSelect,
  className,
}: CalendarProps) {
  const today = new Date();
  const [viewDate, setViewDate] = React.useState(selected ?? today);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const monthName = viewDate.toLocaleString("default", { month: "long", year: "numeric" });
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const isSelected = (day: number) => {
    if (!selected) return false;
    return (
      selected.getFullYear() === year &&
      selected.getMonth() === month &&
      selected.getDate() === day
    );
  };

  const isToday = (day: number) => {
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  return (
    <div className={`p-3 ${className ?? ""}`}>
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={prevMonth}
          className="inline-flex items-center justify-center rounded-md p-1 hover:bg-accent"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-medium">{monthName}</span>
        <button
          type="button"
          onClick={nextMonth}
          className="inline-flex items-center justify-center rounded-md p-1 hover:bg-accent"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((d) => (
          <div key={d} className="text-xs font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const selected_ = isSelected(day);
          const today_ = isToday(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect?.(new Date(year, month, day))}
              className={`inline-flex items-center justify-center rounded-md text-sm h-8 w-8 transition-colors ${
                selected_
                  ? "bg-primary text-primary-foreground"
                  : today_
                    ? "bg-accent text-accent-foreground font-bold"
                    : "hover:bg-accent"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
