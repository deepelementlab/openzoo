import { cn } from "@openzoo/ui/lib/utils";

export function RuntimeModeIcon({ mode }: { mode: "local" | "cloud" }) {
  if (mode === "cloud") {
    return (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

export function StatusBadge({ status }: { status: "online" | "offline" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        status === "online" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-muted text-muted-foreground",
      )}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${status === "online" ? "bg-green-500" : "bg-muted-foreground"}`} />
      {status === "online" ? "Online" : "Offline"}
    </span>
  );
}

export function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-sm", mono && "font-mono")}>{value || "—"}</p>
    </div>
  );
}

export function TokenCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border p-2 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}
