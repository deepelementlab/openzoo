import React from "react";
import { useWorkspaceStore, setWorkspaceId, type Workspace } from "@openzoo/core";

export function WorkspacePicker({ onSelect }: { onSelect?: (ws: Workspace) => void }) {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);

  React.useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  if (!workspaces) return <div className="p-4 text-sm text-muted-foreground">Loading workspaces...</div>;
  if (workspaces.length === 0) return <div className="p-4 text-sm text-muted-foreground">No workspaces found.</div>;

  return (
    <div className="space-y-1">
      {workspaces.map((ws) => (
        <button
          key={ws.id}
          className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm transition-colors"
          onClick={() => {
            setWorkspaceId(ws.id);
            onSelect?.(ws);
          }}
        >
          {ws.name}
        </button>
      ))}
    </div>
  );
}
