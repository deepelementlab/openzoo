import type { RuntimeDevice } from "@openzoo/core/types";
import { ProviderLogo } from "./provider-logo";
import { ActorAvatar } from "@openzoo/ui/components/common/actor-avatar";
import { Badge } from "@openzoo/ui/components/ui/badge";

interface RuntimeListProps {
  runtimes: RuntimeDevice[];
  onSelect: (runtime: RuntimeDevice) => void;
  selectedId?: string;
}

export function RuntimeList({ runtimes, onSelect, selectedId }: RuntimeListProps) {
  return (
    <div className="space-y-1">
      {runtimes.map((rt) => (
        <div
          key={rt.id}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
            selectedId === rt.id ? "bg-accent" : "hover:bg-accent/50"
          }`}
          onClick={() => onSelect(rt)}
        >
          <ProviderLogo provider={rt.provider} size={20} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{rt.name}</p>
            <p className="text-xs text-muted-foreground">{rt.provider}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${rt.status === "online" ? "bg-green-500" : "bg-muted-foreground"}`}
            />
          </div>
        </div>
      ))}
      {runtimes.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No runtimes found. Start a daemon with <code className="text-xs bg-muted px-1 py-0.5 rounded">openzoo daemon start</code>
        </p>
      )}
    </div>
  );
}
