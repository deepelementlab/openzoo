import { create } from "zustand";

export type IssuesScope = "all" | "members" | "agents";

interface IssuesScopeState {
  scope: IssuesScope;
  setScope: (scope: IssuesScope) => void;
}

export const useIssuesScopeStore = create<IssuesScopeState>()((set) => ({
  scope: "all",
  setScope: (scope) => set({ scope }),
}));
