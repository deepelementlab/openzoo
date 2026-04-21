import type { InboxItem } from "@openzoo/core/types";
import { ActorAvatar } from "@openzoo/ui/components/common/actor-avatar";
import { StatusIcon } from "../issues/components/status-icon";

interface InboxListItemProps {
  item: InboxItem;
  onClick?: () => void;
  onArchive?: () => void;
}

export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function InboxListItem({ item, onClick, onArchive }: InboxListItemProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-md px-3 py-2 hover:bg-accent/50 cursor-pointer group"
      onClick={onClick}
    >
      <ActorAvatar
        actorType={item.actor_type ?? "member"}
        actorId={item.actor_id ?? ""}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">
          <span className="font-medium">{item.title}</span>
        </p>
        <p className="text-xs text-muted-foreground truncate">{item.body}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {item.issue_status && (
          <StatusIcon status={item.issue_status as any} size={14} />
        )}
        {!item.read && (
          <span className="h-2 w-2 rounded-full bg-primary" />
        )}
        <span className="text-xs text-muted-foreground">{timeAgo(item.created_at)}</span>
        {onArchive && (
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
            onClick={(e) => { e.stopPropagation(); onArchive(); }}
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
