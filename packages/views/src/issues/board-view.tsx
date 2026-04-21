import React from "react";
import type { Issue, IssueStatus } from "@openzoo/core";
import { BoardColumn } from "./board-column";

const BOARD_STATUSES: IssueStatus[] = ["backlog", "todo", "in_progress", "in_review", "done"];

const STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: "Backlog", todo: "Todo", in_progress: "In Progress",
  in_review: "In Review", done: "Done", blocked: "Blocked", cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  backlog: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  todo: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  in_review: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  done: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

interface BoardViewProps {
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
  onStatusChange: (issueId: string, status: IssueStatus) => void;
}

export function BoardView({ issues, onIssueClick, onStatusChange }: BoardViewProps) {
  const grouped = React.useMemo(() => {
    const map = new Map<IssueStatus, Issue[]>();
    for (const status of BOARD_STATUSES) {
      map.set(status, []);
    }
    for (const issue of issues) {
      const list = map.get(issue.status);
      if (list) list.push(issue);
    }
    return map;
  }, [issues]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
      {BOARD_STATUSES.map((status) => (
        <BoardColumn
          key={status}
          status={status}
          label={STATUS_LABELS[status]}
          colorClass={STATUS_COLORS[status]}
          issues={grouped.get(status) || []}
          onIssueClick={onIssueClick}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
