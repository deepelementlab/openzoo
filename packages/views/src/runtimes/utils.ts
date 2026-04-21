export function formatLastSeen(lastSeenAt: string | null): string {
  if (!lastSeenAt) return "Never";
  const now = Date.now();
  const then = new Date(lastSeenAt).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(lastSeenAt).toLocaleDateString();
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  "claude-sonnet-4-20250514": { inputPer1M: 3, outputPer1M: 15 },
  "claude-3-5-sonnet-20241022": { inputPer1M: 3, outputPer1M: 15 },
  "claude-3-5-haiku-20241022": { inputPer1M: 0.8, outputPer1M: 4 },
  "claude-3-opus-20240229": { inputPer1M: 15, outputPer1M: 75 },
  "claude-3-haiku-20240307": { inputPer1M: 0.25, outputPer1M: 1.25 },
};

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  return (inputTokens / 1_000_000) * pricing.inputPer1M + (outputTokens / 1_000_000) * pricing.outputPer1M;
}

export function aggregateByDate(entries: Array<{
  date: string; provider: string; model: string;
  input_tokens: number; output_tokens: number;
  cache_read_tokens: number; cache_write_tokens: number;
}>) {
  const byDate = new Map<string, { input: number; output: number; cost: number }>();
  const byModel = new Map<string, { tokens: number; cost: number }>();

  for (const e of entries) {
    const existing = byDate.get(e.date) ?? { input: 0, output: 0, cost: 0 };
    existing.input += e.input_tokens;
    existing.output += e.output_tokens;
    existing.cost += estimateCost(e.model, e.input_tokens, e.output_tokens);
    byDate.set(e.date, existing);

    const modelEntry = byModel.get(e.model) ?? { tokens: 0, cost: 0 };
    modelEntry.tokens += e.input_tokens + e.output_tokens;
    modelEntry.cost += estimateCost(e.model, e.input_tokens, e.output_tokens);
    byModel.set(e.model, modelEntry);
  }

  return { byDate, byModel };
}
