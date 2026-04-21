import React from "react";
import type { Issue } from "@openzoo/core";
import { ListRow } from "./list-row";

interface ListViewProps {
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}

export function ListView({ issues, onIssueClick, selectedIds, onToggleSelect }: ListViewProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-[auto_1fr_120px_120px_100px_80px] gap-2 px-4 py-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground">
        <div className="w-6" />
        <div>ID / Title</div>
        <div>Status</div>
        <div>Priority</div>
        <div>Assignee</div>
        <div>Due</div>
      </div>
      {issues.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No issues found</p>
      ) : (
        issues.map((issue) => (
          <ListRow
            key={issue.id}
            issue={issue}
            selected={selectedIds.has(issue.id)}
            onClick={() => onIssueClick(issue)}
            onToggleSelect={() => onToggleSelect(issue.id)}
          />
        ))
      )}
    </div>
  );
}
