import React, { useEffect, useState, useMemo, useCallback } from "react";
import { listIssues, useWorkspaceStore, attachRealtimeSync } from "@openzoo/core";
import type { Issue, IssueStatus, IssuePriority } from "@openzoo/core";
import { Button, Badge, Card, Spinner, EmptyState } from "@openzoo/ui";
import { useNavigation } from "../navigation";
import { useAuthStore } from "@openzoo/core";

const STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: "Backlog", todo: "Todo", in_progress: "In Progress",
  in_review: "In Review", done: "Done", blocked: "Blocked", cancelled: "Cancelled",
};

const PRIORITY_LABELS: Record<IssuePriority, string> = {
  urgent: "Urgent", high: "High", medium: "Medium", low: "Low", none: "No Priority",
};

const STATUS_COLORS: Record<string, string> = {
  backlog: "bg-gray-100 text-gray-700", todo: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700", in_review: "bg-purple-100 text-purple-700",
  done: "bg-green-100 text-green-700", blocked: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-red-600", high: "text-orange-500", medium: "text-yellow-500", low: "text-blue-500", none: "text-gray-400",
};

type ViewMode = "list" | "board";
type FilterStatus = "all" | "open" | "done";

const BOARD_STATUSES: IssueStatus[] = ["backlog", "todo", "in_progress", "in_review", "done"];

export function MyIssuesPage() {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const wsId = useWorkspaceStore((s) => s.currentWorkspace?.id);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("open");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortBy, setSortBy] = useState<"priority" | "created_at" | "title">("priority");

  const PRIORITY_ORDER: IssuePriority[] = ["urgent", "high", "medium", "low", "none"];

  const loadIssues = useCallback(() => {
    if (!wsId) return;
    setLoading(true);
    listIssues({ workspace_id: wsId })
      .then((res) => {
        const myIssues = (res.issues ?? []).filter(
          (issue) => issue.assignee_id === user?.id || issue.creator_id === user?.id
        );
        setIssues(myIssues);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [wsId, user?.id]);

  useEffect(() => { loadIssues(); }, [loadIssues]);
  useEffect(() => {
    if (!wsId) return;
    return attachRealtimeSync(wsId, { onIssueChanged: loadIssues });
  }, [wsId, loadIssues]);

  const filtered = useMemo(() => {
    return issues.filter((issue) => {
      if (filterStatus === "open") return !["done", "cancelled"].includes(issue.status);
      if (filterStatus === "done") return ["done"].includes(issue.status);
      return true;
    });
  }, [issues, filterStatus]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "priority": return PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
        case "created_at": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "title": return a.title.localeCompare(b.title);
        default: return 0;
      }
    });
  }, [filtered, sortBy, PRIORITY_ORDER]);

  const boardGroups = useMemo(() => {
    const groups: Record<IssueStatus, Issue[]> = {} as any;
    for (const s of BOARD_STATUSES) groups[s] = [];
    for (const issue of filtered) {
      if (groups[issue.status]) groups[issue.status].push(issue);
      else groups["backlog"].push(issue);
    }
    return groups;
  }, [filtered]);

  const openCount = issues.filter((i) => !["done", "cancelled"].includes(i.status)).length;
  const doneCount = issues.filter((i) => i.status === "done").length;

  if (!wsId) return <div className="p-8 text-center text-muted-foreground">Select a workspace first</div>;
  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">My Issues</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {openCount} open &middot; {doneCount} done
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="done">Done</option>
          </select>
          <select
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="priority">Sort: Priority</option>
            <option value="created_at">Sort: Newest</option>
            <option value="title">Sort: Title</option>
          </select>
          <div className="ml-auto flex items-center gap-1 border rounded-md p-0.5">
            <button
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === "list" ? "bg-accent" : "hover:bg-accent/50"}`}
              onClick={() => setViewMode("list")}
            >
              List
            </button>
            <button
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === "board" ? "bg-accent" : "hover:bg-accent/50"}`}
              onClick={() => setViewMode("board")}
            >
              Board
            </button>
          </div>
        </div>
      </div>

      {viewMode === "list" ? (
        <ListView issues={sorted} onIssueClick={(id) => navigation.navigate(`/issues/${id}`)} />
      ) : (
        <BoardView groups={boardGroups} onIssueClick={(id) => navigation.navigate(`/issues/${id}`)} />
      )}
    </div>
  );
}

function ListView({ issues, onIssueClick }: { issues: Issue[]; onIssueClick: (id: string) => void }) {
  if (issues.length === 0) {
    return <EmptyState title="No issues assigned to you" description="Issues assigned to you or created by you will appear here." />;
  }

  return (
    <div className="rounded-md border">
      <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
        <span className="w-8">ID</span>
        <span>Title</span>
        <span className="w-24 text-center">Status</span>
        <span className="w-20 text-center">Priority</span>
      </div>
      {issues.map((issue) => (
        <div
          key={issue.id}
          className="grid grid-cols-[auto_1fr_auto_auto] gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/30 cursor-pointer items-center"
          onClick={() => onIssueClick(issue.id)}
        >
          <span className="w-8 text-xs text-muted-foreground font-mono">{issue.identifier}</span>
          <div className="min-w-0">
            <span className="text-sm font-medium truncate block">{issue.title}</span>
            {issue.due_date && (
              <span className="text-xs text-muted-foreground">Due {new Date(issue.due_date).toLocaleDateString()}</span>
            )}
          </div>
          <span className={`w-24 text-center inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[issue.status] || ""}`}>
            {STATUS_LABELS[issue.status]}
          </span>
          <span className={`w-20 text-center text-xs font-medium ${PRIORITY_COLORS[issue.priority]}`}>
            {PRIORITY_LABELS[issue.priority]}
          </span>
        </div>
      ))}
    </div>
  );
}

function BoardView({ groups, onIssueClick }: {
  groups: Record<IssueStatus, Issue[]>;
  onIssueClick: (id: string) => void;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {BOARD_STATUSES.map((status) => (
        <div key={status} className="flex-shrink-0 w-72">
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[status]?.split(" ")[0]}`} />
            <h3 className="text-sm font-semibold">{STATUS_LABELS[status]}</h3>
            <Badge variant="secondary" className="text-xs ml-auto">{groups[status].length}</Badge>
          </div>
          <div className="space-y-2 min-h-[200px]">
            {groups[status].map((issue) => (
              <Card
                key={issue.id}
                className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onIssueClick(issue.id)}
              >
                <div className="space-y-2">
                  <span className="text-sm font-medium leading-tight">{issue.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">{issue.identifier}</span>
                    <span className={`text-xs font-medium ${PRIORITY_COLORS[issue.priority]}`}>
                      {issue.priority !== "none" ? PRIORITY_LABELS[issue.priority] : ""}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
            {groups[status].length === 0 && (
              <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                No issues
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
