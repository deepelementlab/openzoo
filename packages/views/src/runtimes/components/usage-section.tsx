"use client";

import { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import { Skeleton } from "@openzoo/ui/components/skeleton";
import { DailyTokenChart, DailyCostChart, ModelDistributionChart, ActivityHeatmap } from "../charts/usage-charts";
import { HourlyActivityChart } from "../charts/hourly-activity-chart";

interface UsageRow {
  date: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
}

const TIME_RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function UsageSection({ runtimeId }: { runtimeId: string }) {
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/runtimes/${runtimeId}/usage?days=90`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setUsage)
      .catch(() => setUsage([]))
      .finally(() => setLoading(false));
  }, [runtimeId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-12 rounded-md" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    );
  }

  if (usage.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-dashed py-6">
        <BarChart3 className="h-5 w-5 text-muted-foreground/40" />
        <p className="mt-2 text-xs text-muted-foreground">No usage data yet</p>
      </div>
    );
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const filtered = usage.filter((u) => new Date(u.date) >= cutoff);

  const totals = filtered.reduce(
    (acc, u) => ({
      input: acc.input + u.input_tokens,
      output: acc.output + u.output_tokens,
      cacheRead: acc.cacheRead + u.cache_read_tokens,
      cacheWrite: acc.cacheWrite + u.cache_write_tokens,
    }),
    { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        {TIME_RANGES.map((range) => (
          <button
            key={range.days}
            onClick={() => setDays(range.days)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${days === range.days ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
          >
            {range.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Input", value: totals.input },
          { label: "Output", value: totals.output },
          { label: "Cache Read", value: totals.cacheRead },
          { label: "Cache Write", value: totals.cacheWrite },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border px-3 py-2">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="text-sm font-semibold mt-0.5">{formatTokens(card.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DailyTokenChart data={filtered.map((u) => ({ date: u.date, input: u.input_tokens, output: u.output_tokens }))} />
        <DailyCostChart data={filtered.map((u) => ({ date: u.date, cost: (u.input_tokens + u.output_tokens) * 0.00001 }))} />
      </div>

      <ModelDistributionChart data={Object.entries(
        filtered.reduce<Record<string, number>>((acc, u) => { acc[u.model] = (acc[u.model] ?? 0) + u.input_tokens + u.output_tokens; return acc; }, {}),
      ).map(([model, tokens]) => ({ model, tokens }))} />
    </div>
  );
}
