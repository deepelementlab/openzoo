import { describe, it, expect, beforeEach } from "vitest";
import { useTabStore } from "../stores/tab-store";

describe("TabStore", () => {
  beforeEach(() => {
    const store = useTabStore.getState();
    store.closeAllTabs();
  });

  it("should open a new tab", () => {
    const store = useTabStore.getState();
    const id = store.openTab({ path: "/issues", title: "Issues" });
    expect(id).toBeDefined();
    expect(useTabStore.getState().tabs).toHaveLength(1);
    expect(useTabStore.getState().activeTabId).toBe(id);
  });

  it("should reuse existing tab for same path", () => {
    const store = useTabStore.getState();
    const id1 = store.openTab({ path: "/issues", title: "Issues" });
    const id2 = store.openTab({ path: "/issues", title: "Issues" });
    expect(id1).toBe(id2);
    expect(useTabStore.getState().tabs).toHaveLength(1);
  });

  it("should close a tab and activate adjacent", () => {
    const store = useTabStore.getState();
    const id1 = store.openTab({ path: "/", title: "Dashboard" });
    const id2 = store.openTab({ path: "/issues", title: "Issues" });
    const id3 = store.openTab({ path: "/agents", title: "Agents" });

    useTabStore.getState().closeTab(id3);
    expect(useTabStore.getState().tabs).toHaveLength(2);
    expect(useTabStore.getState().activeTabId).toBe(id2);
  });

  it("should switch tabs", () => {
    const store = useTabStore.getState();
    const id1 = store.openTab({ path: "/", title: "Dashboard" });
    const id2 = store.openTab({ path: "/issues", title: "Issues" });

    useTabStore.getState().switchTab(id1);
    expect(useTabStore.getState().activeTabId).toBe(id1);
  });

  it("should update tab title", () => {
    const store = useTabStore.getState();
    const id = store.openTab({ path: "/issues", title: "Issues" });

    useTabStore.getState().updateTabTitle(id, "Issue #42");
    const tab = useTabStore.getState().tabs.find((t) => t.id === id);
    expect(tab?.title).toBe("Issue #42");
  });

  it("should reorder tabs", () => {
    const store = useTabStore.getState();
    store.openTab({ path: "/", title: "Dashboard" });
    store.openTab({ path: "/issues", title: "Issues" });
    store.openTab({ path: "/agents", title: "Agents" });

    useTabStore.getState().reorderTabs(0, 2);
    const tabs = useTabStore.getState().tabs;
    expect(tabs[0].path).toBe("/issues");
    expect(tabs[1].path).toBe("/agents");
    expect(tabs[2].path).toBe("/");
  });

  it("should close other tabs", () => {
    const store = useTabStore.getState();
    const id1 = store.openTab({ path: "/", title: "Dashboard" });
    const id2 = store.openTab({ path: "/issues", title: "Issues" });
    const id3 = store.openTab({ path: "/agents", title: "Agents" });

    useTabStore.getState().closeOtherTabs(id2);
    expect(useTabStore.getState().tabs).toHaveLength(1);
    expect(useTabStore.getState().tabs[0].id).toBe(id2);
    expect(useTabStore.getState().activeTabId).toBe(id2);
  });

  it("should close all tabs", () => {
    const store = useTabStore.getState();
    store.openTab({ path: "/", title: "Dashboard" });
    store.openTab({ path: "/issues", title: "Issues" });

    useTabStore.getState().closeAllTabs();
    expect(useTabStore.getState().tabs).toHaveLength(0);
    expect(useTabStore.getState().activeTabId).toBeNull();
  });
});
