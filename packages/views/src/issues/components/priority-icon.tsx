import type { IssuePriority } from "@openzoo/core/types";

const PRIORITY_CONFIG: Record<IssuePriority, { bars: number; color: string; label: string }> = {
  urgent: { bars: 4, color: "text-red-500", label: "Urgent" },
  high: { bars: 3, color: "text-orange-500", label: "High" },
  medium: { bars: 2, color: "text-yellow-500", label: "Medium" },
  low: { bars: 1, color: "text-blue-500", label: "Low" },
  none: { bars: 0, color: "text-muted-foreground", label: "No priority" },
};

export function PriorityIcon({ priority, className = "", inheritColor = false }: { priority: IssuePriority; className?: string; inheritColor?: boolean }) {
  const cfg = PRIORITY_CONFIG[priority];

  if (cfg.bars === 0) {
    return (
      <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 ${inheritColor ? "" : "text-muted-foreground"} shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <line x1="3" y1="8" x2="13" y2="8" />
      </svg>
    );
  }

  const isUrgent = priority === "urgent";

  return (
    <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 ${inheritColor ? "" : cfg.color} shrink-0 ${className}`} fill="currentColor" style={isUrgent ? { animation: "priority-pulse 2s ease-in-out infinite" } : undefined}>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={1 + i * 4} width="3" rx="0.5" style={{ y: 12 - (i + 1) * 3, height: (i + 1) * 3, opacity: i < cfg.bars ? 1 : 0.2, transition: "y 0.2s ease, height 0.2s ease, opacity 0.2s ease" }} />
      ))}
      {isUrgent && <style>{`@keyframes priority-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}`}</style>}
    </svg>
  );
}

export { PRIORITY_CONFIG };
