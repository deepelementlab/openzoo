import React from "react";
import type { Issue, IssueStatus } from "@openzoo/core";
import { Badge } from "@openzoo/ui";
import { BoardCard } from "./board-card";

interface BoardColumnProps {
  status: IssueStatus;
  label: string;
  colorClass: string;
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
  onStatusChange: (issueId: string, status: IssueStatus) => void;
}

export function BoardColumn({ status, label, colorClass, issues, onIssueClick, onStatusChange }: BoardColumnProps) {
  const [dragOver, setDragOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const issueId = e.dataTransfer.getData("text/plain");
    if (issueId) {
      onStatusChange(issueId, status);
    }
  };

  return (
    <div
      className={`flex-shrink-0 w-72 flex flex-col rounded-lg border ${dragOver ? "border-primary bg-primary/5" : "bg-muted/30"}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-2 p-3 border-b">
        <Badge className={colorClass}>{label}</Badge>
        <span className="text-xs text-muted-foreground">{issues.length}</span>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        {issues.map((issue) => (
          <BoardCard key={issue.id} issue={issue} onClick={() => onIssueClick(issue)} />
        ))}
        {issues.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No issues</p>
        )}
      </div>
    </div>
  );
}
