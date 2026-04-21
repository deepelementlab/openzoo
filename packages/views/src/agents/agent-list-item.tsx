import React from "react";
import type { Agent, AgentStatus } from "@openzoo/core";
import { Card } from "@openzoo/ui";

const STATUS_CONFIG: Record<AgentStatus, { label: string; dot: string }> = {
  idle: { label: "Idle", dot: "bg-green-500" },
  working: { label: "Working", dot: "bg-blue-500" },
  blocked: { label: "Blocked", dot: "bg-yellow-500" },
  error: { label: "Error", dot: "bg-red-500" },
  offline: { label: "Offline", dot: "bg-gray-400" },
};

interface AgentListItemProps {
  agent: Agent;
  selected: boolean;
  onClick: () => void;
}

export function AgentListItem({ agent, selected, onClick }: AgentListItemProps) {
  const status = STATUS_CONFIG[agent.status] || STATUS_CONFIG.offline;
  return (
    <Card
      className={`p-3 cursor-pointer transition-colors hover:bg-muted/30 ${selected ? "ring-2 ring-primary" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full ${status.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{agent.name}</p>
          <p className="text-xs text-muted-foreground">{status.label}{agent.model ? ` · ${agent.model}` : ""}</p>
        </div>
      </div>
    </Card>
  );
}
