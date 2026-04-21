import { create } from "zustand";
import type { User } from "../types";
import { getApiClient, setToken as setApiClientToken } from "../api/connect-client";
import { useWorkspaceStore } from "../workspace/store";
import { listWorkspaces } from "../workspace/queries";

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  loadFromStorage: () => void;
  sendCode: (email: string) => Promise<boolean>;
  verifyCode: (email: string, code: string) => Promise<void>;
  logout: () => void;
}

const TOKEN_KEY = "openzoo_token";
const USER_KEY = "openzoo_user";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setAuth: (user, token) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ user, token, isAuthenticated: true, error: null });
  },

  clearAuth: () => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    setApiClientToken(null);
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    if (typeof localStorage === "undefined") return;
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        setApiClientToken(token);
        set({ user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
  },

  sendCode: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      await getApiClient().call("/rpc/auth/send-code", { email });
      set({ isLoading: false });
      return true;
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
      return false;
    }
  },

  verifyCode: async (email: string, code: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await getApiClient().call<{ token: string; user: User }>("/rpc/auth/verify-code", { email, code });
      get().setAuth(res.user, res.token);
      setApiClientToken(res.token);
      const workspaces = await listWorkspaces();
      useWorkspaceStore.getState().setWorkspaces(workspaces);
      if (workspaces.length > 0) {
        useWorkspaceStore.getState().setCurrentWorkspace(workspaces[0]);
      }
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    get().clearAuth();
    useWorkspaceStore.getState().setCurrentWorkspace(null);
    useWorkspaceStore.getState().setWorkspaces([]);
  },
}));
