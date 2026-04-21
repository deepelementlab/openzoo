import * as React from "react";
import { X, Plus, Circle } from "lucide-react";
import { useTabStore } from "../stores/tab-store";

function TabBar() {
  const { tabs, activeTabId, switchTab, closeTab, reorderTabs, openTab } = useTabStore();
  const dragIndex = React.useRef<number | null>(null);

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex.current !== null && dragIndex.current !== index) {
      reorderTabs(dragIndex.current, index);
      dragIndex.current = index;
    }
  };

  const handleDragEnd = () => {
    dragIndex.current = null;
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
  };

  const handleNewTab = () => {
    openTab({ path: "/", title: "Dashboard" });
  };

  return (
    <div className="flex items-center border-b border-border bg-muted/30 h-9 overflow-x-auto" style={{ WebkitAppRegion: "drag" } as React.CSSProperties}>
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          onContextMenu={(e) => handleContextMenu(e, tab.id)}
          onClick={() => switchTab(tab.id)}
          className={`group flex items-center gap-1.5 px-3 h-full cursor-pointer border-r border-border text-xs whitespace-nowrap select-none transition-colors ${
            tab.id === activeTabId
              ? "bg-background text-foreground"
              : "text-muted-foreground hover:bg-background/50"
          }`}
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <Circle className="size-2 fill-current opacity-50" />
          <span>{tab.title}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
            className="ml-1 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-secondary transition-opacity"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleNewTab}
        className="flex items-center justify-center size-8 text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

export { TabBar };
