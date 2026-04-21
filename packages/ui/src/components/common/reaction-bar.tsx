import * as React from "react";
import { cn } from "../../lib/utils";

interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

interface ReactionBarProps {
  reactions: Reaction[];
  onToggle: (emoji: string) => void;
  onAdd?: () => void;
  className?: string;
}

function ReactionBar({ reactions, onToggle, onAdd, className }: ReactionBarProps) {
  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => onToggle(r.emoji)}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors",
            r.reacted ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted hover:bg-accent",
          )}
        >
          <span>{r.emoji}</span>
          {r.count > 1 && <span>{r.count}</span>}
        </button>
      ))}
      {onAdd && (
        <button type="button" onClick={onAdd} className="inline-flex items-center justify-center rounded-full bg-muted hover:bg-accent px-2 py-0.5 text-xs">
          +
        </button>
      )}
    </div>
  );
}

export { ReactionBar };
