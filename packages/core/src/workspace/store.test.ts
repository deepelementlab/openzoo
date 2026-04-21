import { describe, it, expect, beforeEach } from "vitest";
import { useWorkspaceStore } from "./store";

describe("useWorkspaceStore", () => {
  beforeEach(() => {
    useWorkspaceStore.getState().setWorkspaces([]);
    useWorkspaceStore.getState().setCurrentWorkspace(null);
    localStorage.clear();
  });

  it("should start with no workspace", () => {
    const state = useWorkspaceStore.getState();
    expect(state.currentWorkspace).toBeNull();
    expect(state.workspaces).toEqual([]);
  });

  it("setCurrentWorkspace should update state and persist to localStorage", () => {
    const ws = { id: "ws-1", name: "Test Workspace" } as any;
    useWorkspaceStore.getState().setCurrentWorkspace(ws);

    const state = useWorkspaceStore.getState();
    expect(state.currentWorkspace).toEqual(ws);
    expect(localStorage.getItem("openzoo_workspace_id")).toBe("ws-1");
  });

  it("setCurrentWorkspace(null) should not persist to localStorage", () => {
    useWorkspaceStore.getState().setCurrentWorkspace(null);
    expect(localStorage.getItem("openzoo_workspace_id")).toBeNull();
  });

  it("setWorkspaces should update workspaces list", () => {
    const workspaces = [
      { id: "ws-1", name: "WS 1" },
      { id: "ws-2", name: "WS 2" },
    ] as any[];

    useWorkspaceStore.getState().setWorkspaces(workspaces);

    const state = useWorkspaceStore.getState();
    expect(state.workspaces).toEqual(workspaces);
    expect(state.workspaces).toHaveLength(2);
  });
});
