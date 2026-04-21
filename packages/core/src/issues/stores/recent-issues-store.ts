import { create } from "zustand";
import type { IssueStatus } from "../../types";

const MAX_RECENT_ISSUES = 20;

export interface RecentIssueEntry {
  id: string;
  identifier: string;
  title: string;
  status: IssueStatus;
  visitedAt: number;
}

interface RecentIssuesState {
  items: RecentIssueEntry[];
  recordVisit: (entry: Omit<RecentIssueEntry, "visitedAt">) => void;
}

export const useRecentIssuesStore = create<RecentIssuesState>()((set) => ({
  items: [],
  recordVisit: (entry) =>
    set((state) => {
      const filtered = state.items.filter((i) => i.id !== entry.id);
      const updated: RecentIssueEntry = { ...entry, visitedAt: Date.now() };
      return { items: [updated, ...filtered].slice(0, MAX_RECENT_ISSUES) };
    }),
}));
