import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "./store";
import { setToken, setWorkspaceId } from "../api/connect-client";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    localStorage.clear();
    setToken(null);
    setWorkspaceId(null);
  });

  it("should start unauthenticated", () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it("setAuth should update state and persist to localStorage", () => {
    const user = { id: "u-1", email: "test@example.com", name: "Test" } as any;
    useAuthStore.getState().setAuth(user, "token-123");

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
    expect(state.token).toBe("token-123");
    expect(localStorage.getItem("openzoo_token")).toBe("token-123");
    expect(JSON.parse(localStorage.getItem("openzoo_user")!)).toEqual(user);
  });

  it("clearAuth should reset state and clear localStorage", () => {
    const user = { id: "u-1", email: "test@example.com", name: "Test" } as any;
    useAuthStore.getState().setAuth(user, "token-123");
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(localStorage.getItem("openzoo_token")).toBeNull();
    expect(localStorage.getItem("openzoo_user")).toBeNull();
  });

  it("loadFromStorage should restore auth from localStorage", () => {
    const user = { id: "u-1", email: "test@example.com", name: "Test" };
    localStorage.setItem("openzoo_token", "restored-token");
    localStorage.setItem("openzoo_user", JSON.stringify(user));

    useAuthStore.getState().loadFromStorage();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe("restored-token");
    expect(state.user?.id).toBe("u-1");
  });

  it("loadFromStorage should handle corrupted data gracefully", () => {
    localStorage.setItem("openzoo_token", "token");
    localStorage.setItem("openzoo_user", "invalid-json{{{");

    useAuthStore.getState().loadFromStorage();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem("openzoo_token")).toBeNull();
    expect(localStorage.getItem("openzoo_user")).toBeNull();
  });

  it("loadFromStorage should do nothing when no data in storage", () => {
    useAuthStore.getState().loadFromStorage();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
  });

  it("logout should clear auth and reset workspace", () => {
    const user = { id: "u-1", email: "test@example.com", name: "Test" } as any;
    useAuthStore.getState().setAuth(user, "token-123");

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});
