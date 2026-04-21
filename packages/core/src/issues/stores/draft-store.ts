import { create } from "zustand";
import type { IssueStatus, IssuePriority, IssueAssigneeType } from "../../types";

interface IssueDraft {
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeType?: IssueAssigneeType;
  assigneeId?: string;
  dueDate: string | null;
}

const EMPTY_DRAFT: IssueDraft = {
  title: "",
  description: "",
  status: "todo",
  priority: "none",
  assigneeType: undefined,
  assigneeId: undefined,
  dueDate: null,
};

interface IssueDraftStore {
  draft: IssueDraft;
  setDraft: (patch: Partial<IssueDraft>) => void;
  clearDraft: () => void;
  hasDraft: () => boolean;
}

export const useIssueDraftStore = create<IssueDraftStore>()((set, get) => ({
  draft: { ...EMPTY_DRAFT },
  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  clearDraft: () => set({ draft: { ...EMPTY_DRAFT } }),
  hasDraft: () => {
    const { draft } = get();
    return !!(draft.title || draft.description);
  },
}));
