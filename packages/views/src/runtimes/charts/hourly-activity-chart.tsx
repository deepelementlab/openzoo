import React from "react";

interface HourlyActivityChartProps {
  data: { hour: number; count: number }[];
}

export function HourlyActivityChart({ data }: HourlyActivityChartProps) {
  const hours = Array.from({ length: 24 }, (_, i) => {
    const existing = data?.find((d) => d.hour === i);
    return { hour: i, count: existing?.count ?? 0 };
  });

  const maxCount = Math.max(...hours.map((h) => h.count), 1);
  const cellSize = 16;
  const gap = 2;
  const cols = 12;
  const rows = 2;
  const labelW = 28;
  const w = labelW + cols * (cellSize + gap);
  const h = rows * (cellSize + gap) + 20;

  const getColor = (count: number) => {
    if (count === 0) return "var(--color-muted, #e5e7eb)";
    const intensity = count / maxCount;
    if (intensity > 0.75) return "var(--color-primary, #3b82f6)";
    if (intensity > 0.5) return "var(--color-primary-light, #60a5fa)";
    if (intensity > 0.25) return "var(--color-primary-lighter, #93c5fd)";
    return "var(--color-primary-lightest, #bfdbfe)";
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Hourly Activity</h4>
      <svg width={w} height={h} className="overflow-visible">
        {hours.map((d, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = labelW + col * (cellSize + gap);
          const y = row * (cellSize + gap);
          return (
            <g key={d.hour}>
              <rect
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                rx={3}
                fill={getColor(d.count)}
              >
                <title>{`${d.hour}:00 - ${d.count} events`}</title>
              </rect>
              {col === 0 && (
                <text
                  x={labelW - 4}
                  y={y + cellSize / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-[9px]"
                >
                  {d.hour}h
                </text>
              )}
            </g>
          );
        })}
        {hours.slice(0, cols).map((d, i) => (
          <text
            key={`label-${d.hour}`}
            x={labelW + i * (cellSize + gap) + cellSize / 2}
            y={rows * (cellSize + gap) + 12}
            textAnchor="middle"
            className="fill-muted-foreground text-[8px]"
          >
            {d.hour}
          </text>
        ))}
      </svg>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
          <rect
            key={i}
            width={10}
            height={10}
            rx={2}
            fill={getColor(v * maxCount)}
            className="inline-block"
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
