import React from "react";
import type { Issue, IssuePriority } from "@openzoo/core";
import { Card } from "@openzoo/ui";

const PRIORITY_ICONS: Record<IssuePriority, string> = {
  urgent: "🔴", high: "🟠", medium: "🟡", low: "🔵", none: "",
};

interface BoardCardProps {
  issue: Issue;
  onClick: () => void;
}

export function BoardCard({ issue, onClick }: BoardCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", issue.id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <Card
      className="p-3 cursor-pointer hover:shadow-md transition-shadow"
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <span className="text-xs">{PRIORITY_ICONS[issue.priority]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{issue.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{issue.identifier}</span>
            {issue.assignee_id && (
              <span className="text-xs text-muted-foreground">👤</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
