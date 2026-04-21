import * as React from "react";
import { useTabStore } from "../stores/tab-store";

function useTabRouterSync() {
  const { tabs, activeTabId } = useTabStore();

  React.useEffect(() => {
    if (tabs.length === 0) return;
    if (!activeTabId) return;

    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab) return;

    const hash = window.location.hash.slice(1) || "/";
    if (hash !== activeTab.path) {
      window.location.hash = activeTab.path;
    }
  }, [tabs, activeTabId]);
}

export { useTabRouterSync };
