import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Tab {
  id: string;
  title: string;
  path: string;
  icon?: string;
}

interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
  openTab: (tab: Omit<Tab, "id">) => string;
  closeTab: (id: string) => void;
  switchTab: (id: string) => void;
  updateTabTitle: (id: string, title: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  closeOtherTabs: (keepId: string) => void;
  closeAllTabs: () => void;
}

const MAX_TABS = 20;

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const PATH_TITLE_MAP: Record<string, string> = {
  "/": "Dashboard",
  "/issues": "Issues",
  "/my-issues": "My Issues",
  "/agents": "Agents",
  "/inbox": "Inbox",
  "/projects": "Projects",
  "/runtimes": "Runtimes",
  "/skills": "Skills",
  "/cycles": "Cycles",
  "/labels": "Labels",
  "/views": "Views",
  "/chat": "Chat",
  "/search": "Search",
  "/settings": "Settings",
};

export function getTitleForPath(path: string): string {
  if (PATH_TITLE_MAP[path]) return PATH_TITLE_MAP[path];
  if (path.startsWith("/issues/")) return `Issue ${path.split("/").pop()}`;
  if (path.startsWith("/projects/")) return `Project ${path.split("/").pop()}`;
  const segments = path.split("/").filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : "OpenZoo";
}

export const useTabStore = create<TabState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,

      openTab: (tab) => {
        const state = get();
        const existing = state.tabs.find((t) => t.path === tab.path);
        if (existing) {
          set({ activeTabId: existing.id });
          return existing.id;
        }

        const id = generateId();
        const newTab: Tab = { ...tab, id, title: tab.title || getTitleForPath(tab.path) };

        let newTabs: Tab[];
        if (state.tabs.length >= MAX_TABS) {
          const oldestInactive = state.tabs
            .filter((t) => t.id !== state.activeTabId)
            .slice(0, state.tabs.length - MAX_TABS + 1);
          newTabs = [...state.tabs.filter((t) => !oldestInactive.some((o) => o.id === t.id)), newTab];
        } else {
          newTabs = [...state.tabs, newTab];
        }

        set({ tabs: newTabs, activeTabId: id });
        return id;
      },

      closeTab: (id) => {
        const state = get();
        const newTabs = state.tabs.filter((t) => t.id !== id);
        let newActiveId = state.activeTabId;

        if (state.activeTabId === id) {
          const closedIndex = state.tabs.findIndex((t) => t.id === id);
          if (newTabs.length > 0) {
            newActiveId = newTabs[Math.min(closedIndex, newTabs.length - 1)].id;
          } else {
            newActiveId = null;
          }
        }

        set({ tabs: newTabs, activeTabId: newActiveId });
      },

      switchTab: (id) => {
        set({ activeTabId: id });
      },

      updateTabTitle: (id, title) => {
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === id ? { ...t, title } : t)),
        }));
      },

      reorderTabs: (fromIndex, toIndex) => {
        set((state) => {
          const newTabs = [...state.tabs];
          const [moved] = newTabs.splice(fromIndex, 1);
          newTabs.splice(toIndex, 0, moved);
          return { tabs: newTabs };
        });
      },

      closeOtherTabs: (keepId) => {
        set((state) => ({
          tabs: state.tabs.filter((t) => t.id === keepId),
          activeTabId: keepId,
        }));
      },

      closeAllTabs: () => {
        set({ tabs: [], activeTabId: null });
      },
    }),
    {
      name: "openzoo-tabs",
      partialize: (state) => ({
        tabs: state.tabs.map((t) => ({ path: t.path, title: t.title })),
        activeTabId: state.activeTabId,
      }),
    },
  ),
);
