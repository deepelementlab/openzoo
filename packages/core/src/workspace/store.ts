import { create } from "zustand";
import type { Workspace } from "../types";
import { setWorkspaceId as setApiClientWorkspaceId } from "../api/connect-client";

export interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  setCurrentWorkspace: (ws: Workspace | null) => void;
  setWorkspaces: (ws: Workspace[]) => void;
  loadWorkspaces: () => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  currentWorkspace: null,
  workspaces: [],
  isLoading: false,

  setCurrentWorkspace: (ws) => {
    set({ currentWorkspace: ws });
    if (typeof localStorage !== "undefined" && ws) {
      localStorage.setItem("openzoo_workspace_id", ws.id);
    }
    setApiClientWorkspaceId(ws?.id ?? null);
  },

  setWorkspaces: (ws) => set({ workspaces: ws }),

  loadWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const { listWorkspaces } = await import("./queries");
      const workspaces = await listWorkspaces();
      set({ workspaces, isLoading: false });
      // Restore saved workspace or use first
      if (workspaces.length > 0) {
        const savedId = typeof localStorage !== "undefined" ? localStorage.getItem("openzoo_workspace_id") : null;
        const saved = savedId ? workspaces.find(w => w.id === savedId) : null;
        if (saved) {
          set({ currentWorkspace: saved });
        } else if (!get().currentWorkspace) {
          set({ currentWorkspace: workspaces[0] });
        }
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
