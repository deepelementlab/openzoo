import React from "react";
import type { RuntimeDevice } from "@openzoo/core";
import { Badge, Card } from "@openzoo/ui";

const STATUS_COLORS: Record<string, string> = {
  online: "bg-green-100 text-green-700",
  offline: "bg-gray-100 text-gray-500",
  error: "bg-red-100 text-red-700",
  busy: "bg-yellow-100 text-yellow-700",
};

const STATUS_DOT: Record<string, string> = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  error: "bg-red-500",
  busy: "bg-yellow-500",
};

const PROVIDER_ICONS: Record<string, string> = {
  claude: "🟣",
  codex: "🔵",
  opencode: "🟢",
  openclaw: "🟠",
  hermes: "⚪",
};

interface RuntimeDetailProps {
  runtime: RuntimeDevice;
  onDelete: (id: string) => void;
}

export function RuntimeDetail({ runtime, onDelete }: RuntimeDetailProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full ${STATUS_DOT[runtime.status] || "bg-gray-400"}`} />
        <span className="text-lg">{PROVIDER_ICONS[runtime.provider] || "💻"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{runtime.name}</p>
          <p className="text-xs text-muted-foreground">{runtime.provider} · {runtime.status}</p>
        </div>
        <Badge className={STATUS_COLORS[runtime.status] || ""}>{runtime.status}</Badge>
        <button
          type="button"
          className="text-xs text-destructive hover:underline"
          onClick={() => onDelete(runtime.id)}
        >
          Remove
        </button>
      </div>
    </Card>
  );
}
