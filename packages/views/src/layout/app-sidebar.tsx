import React from "react";
import { useNavigation } from "../navigation";
import { getWorkspaceId, useWorkspaceStore } from "@openzoo/core";
import { useModal } from "../modals";

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const MAIN_NAV: NavItem[] = [
  { label: "Dashboard", path: "/", icon: "\u{1F4CA}" },
  { label: "My Issues", path: "/my-issues", icon: "\u{1F464}" },
  { label: "Issues", path: "/issues", icon: "\u{1F4CB}" },
  { label: "Projects", path: "/projects", icon: "\u{1F4C1}" },
  { label: "Agents", path: "/agents", icon: "\u{1F916}" },
  { label: "Inbox", path: "/inbox", icon: "\u{1F4EC}" },
];

const TOOLS_NAV: NavItem[] = [
  { label: "Chat", path: "/chat", icon: "\u{1F4AC}" },
  { label: "Search", path: "/search", icon: "\u{1F50D}" },
  { label: "Runtimes", path: "/runtimes", icon: "\u{2699}\uFE0F" },
  { label: "Ext. Sessions", path: "/external-sessions", icon: "\u{1F50C}" },
];

const BOTTOM_NAV: NavItem[] = [
  { label: "Settings", path: "/settings", icon: "\u2699\uFE0F" },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const nav = useNavigation();
  return (
    <button
      onClick={() => nav.navigate(item.path)}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left ${
        active ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50"
      }`}
    >
      <span className="text-base">{item.icon}</span>
      <span className="truncate">{item.label}</span>
    </button>
  );
}

export function AppSidebar() {
  const nav = useNavigation();
  const pathname = nav.usePathname();
  const wsId = getWorkspaceId();
  const workspaceName = useWorkspaceStore((s) => s.currentWorkspace?.name);
  const { openModal } = useModal();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/" || pathname === "";
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <aside className="w-56 border-r bg-card h-full flex flex-col">
      <div className="p-4 border-b">
        <h1 className="font-bold text-lg">OpenZoo</h1>
        {workspaceName ? (
          <p className="text-xs text-muted-foreground truncate mt-0.5" title={workspaceName}>
            {workspaceName}
          </p>
        ) : (
          <button
            onClick={() => openModal("create-workspace")}
            className="text-xs text-primary hover:underline mt-0.5"
          >
            + Create Workspace
          </button>
        )}
      </div>

      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="space-y-0.5">
          {MAIN_NAV.map((item) => (
            <NavLink key={item.path} item={item} active={isActive(item.path)} />
          ))}
        </div>

        <div className="mt-4 pt-3 border-t">
          <p className="px-3 pb-2 text-xs font-medium text-muted-foreground">Tools</p>
          <div className="space-y-0.5">
            {TOOLS_NAV.map((item) => (
              <NavLink key={item.path} item={item} active={isActive(item.path)} />
            ))}
          </div>
        </div>
      </nav>

      <div className="p-2 border-t">
        {BOTTOM_NAV.map((item) => (
          <NavLink key={item.path} item={item} active={isActive(item.path)} />
        ))}
      </div>
    </aside>
  );
}
