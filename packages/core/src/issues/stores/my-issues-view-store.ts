import { createStore } from "zustand/vanilla";
import type { IssueStatus, IssuePriority } from "../../types";
import type { ViewMode, SortField, SortDirection, CardProperties, ActorFilterValue } from "./view-store";

export type MyIssuesScope = "assigned" | "created" | "agents";

interface MyIssuesViewState {
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
  scope: MyIssuesScope;
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
  setScope: (scope: MyIssuesScope) => void;
  clearFilters: () => void;
}

export const myIssuesViewStore = createStore<MyIssuesViewState>()((set) => ({
  viewMode: "list",
  statusFilter: [],
  priorityFilter: [],
  assigneeFilter: [],
  creatorFilter: [],
  projectFilter: [],
  searchQuery: "",
  sortBy: "created_at",
  sortDirection: "desc",
  cardProperties: { priority: true, description: false, assignee: true, dueDate: true },
  scope: "assigned",
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
    set((s) => ({ cardProperties: { ...s.cardProperties, [key]: !s.cardProperties[key] } })),
  setScope: (scope) => set({ scope }),
  clearFilters: () =>
    set({ statusFilter: [], priorityFilter: [], assigneeFilter: [], creatorFilter: [], projectFilter: [], searchQuery: "" }),
}));
