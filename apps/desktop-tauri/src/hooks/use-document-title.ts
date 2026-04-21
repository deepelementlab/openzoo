import * as React from "react";
import { useTabStore, getTitleForPath } from "../stores/tab-store";

function useDocumentTitle() {
  const { tabs, activeTabId } = useTabStore();

  React.useEffect(() => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (activeTab) {
      const title = getTitleForPath(activeTab.path);
      document.title = `${title} — OpenZoo`;
    } else {
      document.title = "OpenZoo";
    }
  }, [tabs, activeTabId]);
}

export { useDocumentTitle };
