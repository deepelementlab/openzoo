import { create } from "zustand";
import type { IssueStatus, IssuePriority } from "../../types";

export type ViewMode = "board" | "list";
export type SortField = "position" | "priority" | "due_date" | "created_at" | "title";
export type SortDirection = "asc" | "desc";

export interface CardProperties {
  priority: boolean;
  description: boolean;
  assignee: boolean;
  dueDate: boolean;
}

export interface ActorFilterValue {
  type: "member" | "agent";
  id: string;
}

export const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "position", label: "Manual" },
  { value: "priority", label: "Priority" },
  { value: "due_date", label: "Due date" },
  { value: "created_at", label: "Date created" },
  { value: "title", label: "Title" },
];

export const CARD_PROPERTY_OPTIONS: { key: keyof CardProperties; label: string }[] = [
  { key: "priority", label: "Priority" },
  { key: "description", label: "Description" },
  { key: "assignee", label: "Assignee" },
  { key: "dueDate", label: "Due date" },
];

export interface IssueViewState {
  viewMode: ViewMode;
  statusFilter: IssueStatus[];
  priorityFilter: IssuePriority[];
  assigneeFilter: ActorFilterValue[];
  creatorFilter: ActorFilterValue[];
  projectFilter: string[];
  searchQuery: string;
  sortBy: SortField;
  sortDirection: SortDirection;
  cardProperties: CardProperties;
  listCollapsedStatuses: Set<IssueStatus>;
  setViewMode: (mode: ViewMode) => void;
  setStatusFilter: (statuses: IssueStatus[]) => void;
  setPriorityFilter: (priorities: IssuePriority[]) => void;
  setAssigneeFilter: (assignees: ActorFilterValue[]) => void;
  setCreatorFilter: (creators: ActorFilterValue[]) => void;
  setProjectFilter: (projects: string[]) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (field: SortField) => void;
  setSortDirection: (dir: SortDirection) => void;
  toggleCardProperty: (key: keyof CardProperties) => void;
  toggleListCollapsedStatus: (status: IssueStatus) => void;
  clearFilters: () => void;
}

const DEFAULT_CARD_PROPERTIES: CardProperties = {
  priority: true,
  description: false,
  assignee: true,
  dueDate: true,
};

export const useIssueViewStore = create<IssueViewState>()((set) => ({
  viewMode: "board",
  statusFilter: [],
  priorityFilter: [],
  assigneeFilter: [],
  creatorFilter: [],
  projectFilter: [],
  searchQuery: "",
  sortBy: "position",
  sortDirection: "asc",
  cardProperties: { ...DEFAULT_CARD_PROPERTIES },
  listCollapsedStatuses: new Set<IssueStatus>(),
  setViewMode: (mode) => set({ viewMode: mode }),
  setStatusFilter: (statuses) => set({ statusFilter: statuses }),
  setPriorityFilter: (priorities) => set({ priorityFilter: priorities }),
  setAssigneeFilter: (assignees) => set({ assigneeFilter: assignees }),
  setCreatorFilter: (creators) => set({ creatorFilter: creators }),
  setProjectFilter: (projects) => set({ projectFilter: projects }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (field) => set({ sortBy: field }),
  setSortDirection: (dir) => set({ sortDirection: dir }),
  toggleCardProperty: (key) =>
    set((s) => ({
      cardProperties: { ...s.cardProperties, [key]: !s.cardProperties[key] },
    })),
  toggleListCollapsedStatus: (status) =>
    set((s) => {
      const next = new Set(s.listCollapsedStatuses);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return { listCollapsedStatuses: next };
    }),
  clearFilters: () =>
    set({
      statusFilter: [],
      priorityFilter: [],
      assigneeFilter: [],
      creatorFilter: [],
      projectFilter: [],
      searchQuery: "",
    }),
}));
