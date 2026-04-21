import React, { useEffect, useState, useCallback } from "react";
import { useWorkspaceStore, searchIssues, listProjects, listAgents } from "@openzoo/core";
import { useNavigation } from "../navigation";
import { useModal } from "../modals";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem, CommandGroup } from "@openzoo/ui";

const NAV_ITEMS = [
  { id: "nav-issues", label: "Go to Issues", icon: "\u{1F4CB}", path: "/issues" },
  { id: "nav-my-issues", label: "Go to My Issues", icon: "\u{1F464}", path: "/my-issues" },
  { id: "nav-projects", label: "Go to Projects", icon: "\u{1F4BC}", path: "/projects" },
  { id: "nav-agents", label: "Go to Agents", icon: "\u{1F916}", path: "/agents" },
  { id: "nav-inbox", label: "Go to Inbox", icon: "\u{1F4E5}", path: "/inbox" },
  { id: "nav-chat", label: "Go to Chat", icon: "\u{1F4AC}", path: "/chat" },
  { id: "nav-runtimes", label: "Go to Runtimes", icon: "\u{1F5A5}", path: "/runtimes" },
  { id: "nav-settings", label: "Go to Settings", icon: "\u{2699}", path: "/settings" },
];

const QUICK_ACTIONS = [
  { id: "action-create-issue", label: "Create Issue", icon: "\u{2795}" },
  { id: "action-create-workspace", label: "Create Workspace", icon: "\u{1F3E2}" },
];

interface GlobalSearchProps {
  onClose: () => void;
}

export function GlobalSearchModal({ onClose }: GlobalSearchProps) {
  const wsId = useWorkspaceStore((s) => s.currentWorkspace?.id);
  const navigation = useNavigation();
  const { openModal } = useModal();
  const [query, setQuery] = useState("");
  const [issues, setIssues] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchAll = useCallback(async () => {
    if (!wsId || !query.trim()) return;
    setLoading(true);
    try {
      const [issueRes, projectRes, agentRes] = await Promise.allSettled([
        searchIssues(wsId, query, 10).catch(() => ({ results: [] })),
        listProjects({ workspace_id: wsId }).catch(() => ({ projects: [] })),
        listAgents(wsId).catch(() => []),
      ]);

      setIssues(
        issueRes.status === "fulfilled" ? (issueRes.value as any).results ?? [] : []
      );
      setProjects(
        projectRes.status === "fulfilled" ? (projectRes.value as any).projects ?? [] : []
      );
      setAgents(agentRes.status === "fulfilled" ? (agentRes.value as any) ?? [] : []);
    } finally {
      setLoading(false);
    }
  }, [wsId, query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) searchAll();
      else { setIssues([]); setProjects([]); setAgents([]); }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchAll, query]);

  const handleNav = (path: string) => {
    navigation.navigate(path);
    onClose();
  };

  const handleIssueClick = (id: string) => {
    navigation.navigate(`/issues/${id}`);
    onClose();
  };

  const handleProjectClick = (id: string) => {
    navigation.navigate(`/projects`);
    onClose();
  };

  const handleQuickAction = (id: string) => {
    if (id === "action-create-issue") openModal("create-issue");
    if (id === "action-create-workspace") openModal("create-workspace");
    onClose();
  };

  const filterNav = (q: string) =>
    NAV_ITEMS.filter((item) =>
      !q || item.label.toLowerCase().includes(q.toLowerCase())
    );

  const filterActions = (q: string) =>
    QUICK_ACTIONS.filter((item) =>
      !q || item.label.toLowerCase().includes(q.toLowerCase())
    );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-background rounded-lg shadow-2xl border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput
            placeholder="Search issues, projects, agents..."
            value={query}
            onValueChange={setQuery}
            className="border-none"
          />
          <CommandList className="max-h-80 overflow-auto">
            <CommandEmpty>
              {query.length >= 2 && !loading ? "No results found." : "Type to search..."}
            </CommandEmpty>

            <CommandGroup heading="Quick Actions">
              {filterActions(query).map((item) => (
                <CommandItem key={item.id} onSelect={() => handleQuickAction(item.id)}>
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Navigation">
              {filterNav(query).map((item) => (
                <CommandItem key={item.id} onSelect={() => handleNav(item.path)}>
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>

            {issues.length > 0 && (
              <CommandGroup heading="Issues">
                {issues.slice(0, 5).map((issue: any) => (
                  <CommandItem key={issue.id} onSelect={() => handleIssueClick(issue.id)}>
                    <span className="mr-2 text-muted-foreground text-xs font-mono">
                      {issue.identifier ?? issue.id?.slice(0, 6)}
                    </span>
                    <span className="truncate">{issue.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground capitalize">
                      {issue.status}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {projects.length > 0 && (
              <CommandGroup heading="Projects">
                {projects.slice(0, 3).map((p: any) => (
                  <CommandItem key={p.id} onSelect={() => handleProjectClick(p.id)}>
                    <span className="mr-2">{"\u{1F4BC}"}</span>
                    <span className="truncate">{p.name ?? p.id?.slice(0, 8)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {agents.length > 0 && (
              <CommandGroup heading="Agents">
                {agents.slice(0, 3).map((a: any) => (
                  <CommandItem key={a.id} onSelect={() => handleNav("/agents")}>
                    <span className="mr-2">{"\u{1F916}"}</span>
                    <span className="truncate">{a.name ?? a.id?.slice(0, 8)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {loading && (
              <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                Searching...
              </div>
            )}
          </CommandList>
        </Command>

        <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">↵</kbd> Select</span>
          </div>
          <span><kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
