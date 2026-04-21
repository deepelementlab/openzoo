import { create } from "zustand";
import type { IssueStatus, IssuePriority } from "../types";

export interface IssueViewFilters {
  status: IssueStatus | null;
  priority: IssuePriority | null;
  assignee_id: string | null;
  project_id: string | null;
  search: string;
  view_mode: "list" | "board";
}

export interface IssueViewState {
  filters: IssueViewFilters;
  selected_issue_id: string | null;
  setFilters: (f: Partial<IssueViewFilters>) => void;
  setSelectedIssueId: (id: string | null) => void;
  resetFilters: () => void;
}

const defaultFilters: IssueViewFilters = {
  status: null,
  priority: null,
  assignee_id: null,
  project_id: null,
  search: "",
  view_mode: "list",
};

export const useIssueViewStore = create<IssueViewState>((set) => ({
  filters: { ...defaultFilters },
  selected_issue_id: null,
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  setSelectedIssueId: (id) => set({ selected_issue_id: id }),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
}));
