import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  listIssues, updateIssue, deleteIssue, batchUpdateIssues,
  useIssueViewStore, useWorkspaceStore, attachRealtimeSync,
} from "@openzoo/core";
import type { Issue, IssueStatus, IssuePriority } from "@openzoo/core";
import { Button, Badge, Card, Input, Spinner, EmptyState } from "@openzoo/ui";
import { useNavigation } from "../navigation";
import { useModal } from "../modals";

const BOARD_STATUSES: IssueStatus[] = ["backlog", "todo", "in_progress", "in_review", "done"];

const STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: "Backlog", todo: "Todo", in_progress: "In Progress",
  in_review: "In Review", done: "Done", blocked: "Blocked", cancelled: "Cancelled",
};

const PRIORITY_LABELS: Record<IssuePriority, string> = {
  urgent: "Urgent", high: "High", medium: "Medium", low: "Low", none: "No Priority",
};

const PRIORITY_ORDER: IssuePriority[] = ["urgent", "high", "medium", "low", "none"];

const STATUS_COLORS: Record<string, string> = {
  backlog: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  todo: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  in_review: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  done: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-red-600", high: "text-orange-500", medium: "text-yellow-500", low: "text-blue-500", none: "text-gray-400",
};

function filterIssues(issues: Issue[], filters: { status: IssueStatus | null; priority: IssuePriority | null; search: string }): Issue[] {
  return issues.filter((issue) => {
    if (filters.status && issue.status !== filters.status) return false;
    if (filters.priority && issue.priority !== filters.priority) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!issue.title.toLowerCase().includes(q) && !issue.identifier.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

function sortIssues(issues: Issue[], field: string, dir: "asc" | "desc"): Issue[] {
  const sorted = [...issues].sort((a, b) => {
    switch (field) {
      case "priority": {
        const pa = PRIORITY_ORDER.indexOf(a.priority);
        const pb = PRIORITY_ORDER.indexOf(b.priority);
        return pa - pb;
      }
      case "due_date": {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      case "created_at":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "title":
        return a.title.localeCompare(b.title);
      case "position":
      default:
        return a.position - b.position;
    }
  });
  return dir === "desc" ? sorted.reverse() : sorted;
}

export function IssuesPage() {
  const navigation = useNavigation();
  const wsId = useWorkspaceStore((s) => s.currentWorkspace?.id);
  const viewState = useIssueViewStore();
  const { openModal } = useModal();
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("position");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchStatusOpen, setBatchStatusOpen] = useState(false);
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);

  const loadIssues = useCallback(() => {
    if (!wsId) return;
    setLoading(true);
    listIssues({ workspace_id: wsId })
      .then((res) => setAllIssues(res.issues ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [wsId]);

  useEffect(() => { loadIssues(); }, [loadIssues]);

  useEffect(() => {
    if (!wsId) return;
    return attachRealtimeSync(wsId, { onIssueChanged: loadIssues });
  }, [wsId, loadIssues]);

  const filtered = useMemo(
    () => filterIssues(allIssues, viewState.filters),
    [allIssues, viewState.filters]
  );

  const sorted = useMemo(
    () => sortIssues(filtered, sortBy, sortDir),
    [filtered, sortBy, sortDir]
  );

  const boardGroups = useMemo(() => {
    const groups: Record<IssueStatus, Issue[]> = {} as any;
    for (const s of BOARD_STATUSES) groups[s] = [];
    for (const issue of filtered) {
      if (groups[issue.status]) groups[issue.status].push(issue);
      else groups["backlog"].push(issue);
    }
    return groups;
  }, [filtered]);

  const handleStatusChange = async (issueId: string, status: IssueStatus) => {
    if (!wsId) return;
    try {
      await updateIssue(wsId, issueId, { status });
      loadIssues();
    } catch (e) {
      console.error("Failed to update issue:", e);
    }
  };

  const handleDelete = async (issueId: string) => {
    if (!wsId) return;
    try {
      await deleteIssue(wsId, issueId);
      loadIssues();
    } catch (e) {
      console.error("Failed to delete issue:", e);
    }
  };

  const handleBatchStatusChange = async (status: IssueStatus) => {
    if (!wsId) return;
    const ids = Array.from(selectedIds);
    try {
      await batchUpdateIssues(wsId, ids, { status });
    } catch {
      await Promise.all(ids.map((id) => updateIssue(wsId, id, { status })));
    }
    setSelectedIds(new Set());
    setBatchStatusOpen(false);
    loadIssues();
  };

  const handleBatchDelete = async () => {
    if (!wsId) return;
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => deleteIssue(wsId, id)));
    setSelectedIds(new Set());
    loadIssues();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filtered.map((i) => i.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleDragStart = (issueId: string) => {
    setDraggedIssueId(issueId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (status: IssueStatus) => {
    if (!draggedIssueId) return;
    await handleStatusChange(draggedIssueId, status);
    setDraggedIssueId(null);
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("asc"); }
  };

  if (!wsId) return <div className="p-8 text-center text-muted-foreground">Select a workspace first</div>;
  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <IssuesHeader
        filters={viewState.filters}
        viewMode={viewState.filters.view_mode}
        totalCount={allIssues.length}
        filteredCount={filtered.length}
        selectedCount={selectedIds.size}
        onFilterChange={viewState.setFilters}
        onViewModeChange={(mode) => viewState.setFilters({ view_mode: mode })}
        onSortChange={toggleSort}
        sortBy={sortBy}
        sortDir={sortDir}
        onCreateClick={() => openModal("create-issue")}
        onSelectAll={selectAll}
        onClearSelection={clearSelection}
        onBatchStatusOpen={() => setBatchStatusOpen(true)}
        onBatchDelete={handleBatchDelete}
      />

      {batchStatusOpen && (
        <BatchStatusMenu
          onClose={() => setBatchStatusOpen(false)}
          onStatusChange={handleBatchStatusChange}
        />
      )}

      {viewState.filters.view_mode === "board" ? (
        <BoardView
          groups={boardGroups}
          onStatusChange={handleStatusChange}
          onIssueClick={(id) => navigation.navigate(`/issues/${id}`)}
          onDelete={handleDelete}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      ) : (
        <ListView
          issues={sorted}
          onIssueClick={(id) => navigation.navigate(`/issues/${id}`)}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      )}
    </div>
  );
}

function BatchStatusMenu({ onClose, onStatusChange }: { onClose: () => void; onStatusChange: (s: IssueStatus) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-background rounded-lg shadow-lg p-4 w-64" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold mb-3">Change Status</h3>
        <div className="space-y-1">
          {BOARD_STATUSES.map((status) => (
            <button
              key={status}
              className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-accent transition-colors flex items-center gap-2`}
              onClick={() => onStatusChange(status)}
            >
              <span className={`h-2 w-2 rounded-full ${STATUS_COLORS[status]?.split(" ")[0]}`} />
              {STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function IssuesHeader({ filters, viewMode, totalCount, filteredCount, selectedCount, onFilterChange, onViewModeChange, onSortChange, sortBy, sortDir, onCreateClick, onSelectAll, onClearSelection, onBatchStatusOpen, onBatchDelete }: {
  filters: { status: IssueStatus | null; priority: IssuePriority | null; search: string };
  viewMode: "list" | "board";
  totalCount: number;
  filteredCount: number;
  selectedCount: number;
  onFilterChange: (f: any) => void;
  onViewModeChange: (mode: "list" | "board") => void;
  onSortChange: (field: string) => void;
  sortBy: string;
  sortDir: "asc" | "desc";
  onCreateClick: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBatchStatusOpen: () => void;
  onBatchDelete: () => void;
}) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">
            Issues
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {filteredCount === totalCount ? `${totalCount}` : `${filteredCount} / ${totalCount}`}
            </span>
          </h2>
          {hasSelection && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{selectedCount} selected</span>
              <Button variant="outline" size="sm" onClick={onBatchStatusOpen}>Change Status</Button>
              <Button variant="destructive" size="sm" onClick={onBatchDelete}>Delete</Button>
              <Button variant="ghost" size="sm" onClick={onClearSelection}>Clear</Button>
            </div>
          )}
        </div>
        <Button onClick={onCreateClick}>New Issue</Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="Search issues..."
          value={filters.search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFilterChange({ search: e.target.value })}
          className="max-w-[240px]"
        />
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={filters.status ?? ""}
          onChange={(e) => onFilterChange({ status: e.target.value || null })}
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={filters.priority ?? ""}
          onChange={(e) => onFilterChange({ priority: e.target.value as IssuePriority || null })}
        >
          <option value="">All Priorities</option>
          {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-1 border rounded-md p-0.5">
          <button
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === "list" ? "bg-accent" : "hover:bg-accent/50"}`}
            onClick={() => onViewModeChange("list")}
          >
            List
          </button>
          <button
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === "board" ? "bg-accent" : "hover:bg-accent/50"}`}
            onClick={() => onViewModeChange("board")}
          >
            Board
          </button>
        </div>

        <select
          className="rounded-md border bg-background px-2 py-1.5 text-xs"
          value={`${sortBy}:${sortDir}`}
          onChange={(e) => {
            const [f, d] = e.target.value.split(":");
            onSortChange(f);
          }}
        >
          <option value="position:asc">Sort: Position</option>
          <option value="priority:asc">Sort: Priority</option>
          <option value="created_at:desc">Sort: Newest</option>
          <option value="created_at:asc">Sort: Oldest</option>
          <option value="title:asc">Sort: Title</option>
          <option value="due_date:asc">Sort: Due Date</option>
        </select>
      </div>
    </div>
  );
}

function ListView({ issues, onIssueClick, onStatusChange, onDelete, selectedIds, onToggleSelect }: {
  issues: Issue[];
  onIssueClick: (id: string) => void;
  onStatusChange: (id: string, status: IssueStatus) => void;
  onDelete: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}) {
  if (issues.length === 0) {
    return <EmptyState title="No issues found" description="Try adjusting your filters or create a new issue." />;
  }

  return (
    <div className="rounded-md border">
      <div className="grid grid-cols-[auto_auto_1fr_auto_auto_auto] gap-3 px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
        <span className="w-6"></span>
        <span className="w-8">ID</span>
        <span>Title</span>
        <span className="w-24 text-center">Status</span>
        <span className="w-20 text-center">Priority</span>
        <span className="w-8"></span>
      </div>
      {issues.map((issue) => {
        const isSelected = selectedIds.has(issue.id);
        return (
          <div
            key={issue.id}
            className={`grid grid-cols-[auto_auto_1fr_auto_auto_auto] gap-3 px-4 py-3 border-b last:border-0 cursor-pointer items-center transition-colors ${
              isSelected ? "bg-accent/50" : "hover:bg-muted/30"
            }`}
            onClick={() => onIssueClick(issue.id)}
          >
            <button
              className="w-6 h-6 rounded border flex items-center justify-center shrink-0"
              onClick={(e) => { e.stopPropagation(); onToggleSelect(issue.id); }}
            >
              {isSelected && <span className="text-xs text-primary">✓</span>}
            </button>
            <span className="w-8 text-xs text-muted-foreground font-mono">{issue.identifier}</span>
            <div className="min-w-0">
              <span className="text-sm font-medium truncate block">{issue.title}</span>
              {issue.due_date && (
                <span className="text-xs text-muted-foreground">Due {new Date(issue.due_date).toLocaleDateString()}</span>
              )}
            </div>
            <span className="w-24 text-center">
              <button
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[issue.status] || ""}`}
                onClick={(e) => { e.stopPropagation(); }}
              >
                {STATUS_LABELS[issue.status]}
              </button>
            </span>
            <span className={`w-20 text-center text-xs font-medium ${PRIORITY_COLORS[issue.priority]}`}>
              {PRIORITY_LABELS[issue.priority]}
            </span>
            <button
              className="w-8 text-muted-foreground hover:text-destructive text-sm"
              onClick={(e) => { e.stopPropagation(); onDelete(issue.id); }}
            >
              x
            </button>
          </div>
        );
      })}
    </div>
  );
}

function BoardView({ groups, onStatusChange, onIssueClick, onDelete, selectedIds, onToggleSelect, onDragStart, onDragOver, onDrop }: {
  groups: Record<IssueStatus, Issue[]>;
  onStatusChange: (id: string, status: IssueStatus) => void;
  onIssueClick: (id: string) => void;
  onDelete: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (status: IssueStatus) => void;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {BOARD_STATUSES.map((status) => (
        <div
          key={status}
          className="flex-shrink-0 w-72"
          onDragOver={onDragOver}
          onDrop={(e) => { e.preventDefault(); onDrop(status); }}
        >
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[status]?.split(" ")[0]}`} />
            <h3 className="text-sm font-semibold">{STATUS_LABELS[status]}</h3>
            <Badge variant="secondary" className="text-xs ml-auto">{groups[status].length}</Badge>
          </div>
          <div className="space-y-2 min-h-[200px] rounded-md p-1 transition-colors">
            {groups[status].map((issue) => {
              const isSelected = selectedIds.has(issue.id);
              return (
                <Card
                  key={issue.id}
                  className={`p-3 transition-shadow ${
                    isSelected ? "ring-2 ring-primary" : ""
                  } cursor-pointer hover:shadow-md`}
                  onClick={() => onIssueClick(issue.id)}
                  draggable
                  onDragStart={(e) => {
                    (e as any).dataTransfer.effectAllowed = "move";
                    onDragStart(issue.id);
                  }}
                  onDragEnd={() => onDragStart("")}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggleSelect(issue.id); }}
                        >
                          {isSelected && <span className="text-xs text-primary">✓</span>}
                        </button>
                        <span className="text-sm font-medium leading-tight truncate">{issue.title}</span>
                      </div>
                      <button
                        className="text-muted-foreground hover:text-destructive text-xs shrink-0"
                        onClick={(e) => { e.stopPropagation(); onDelete(issue.id); }}
                      >
                        x
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">{issue.identifier}</span>
                      <span className={`text-xs font-medium ${PRIORITY_COLORS[issue.priority]}`}>
                        {issue.priority !== "none" ? PRIORITY_LABELS[issue.priority] : ""}
                      </span>
                    </div>
                    {issue.due_date && (
                      <span className="text-xs text-muted-foreground">
                        Due {new Date(issue.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
            {groups[status].length === 0 && (
              <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                Drop issues here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
