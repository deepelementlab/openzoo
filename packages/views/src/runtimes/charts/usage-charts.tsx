import React from "react";

interface DailyTokenChartProps {
  data: { date: string; input: number; output: number }[];
}

export function DailyTokenChart({ data }: DailyTokenChartProps) {
  if (!data || data.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No token data</p>;
  }
  const points = data.slice(0, 14);
  const maxVal = Math.max(...points.map((d) => d.input + d.output), 1);
  const w = 280;
  const h = 100;
  const padX = 30;
  const padY = 10;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;

  const inputPoints = points.map((d, i) => ({
    x: padX + (i / Math.max(points.length - 1, 1)) * chartW,
    y: padY + chartH - (d.input / maxVal) * chartH,
  }));
  const outputPoints = points.map((d, i) => ({
    x: padX + (i / Math.max(points.length - 1, 1)) * chartW,
    y: padY + chartH - (d.output / maxVal) * chartH,
  }));

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <div>
      <h4 className="text-xs font-medium mb-2">Daily Tokens</h4>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        <line x1={padX} y1={padY} x2={padX} y2={h - padY} stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
        <line x1={padX} y1={h - padY} x2={w - padX} y2={h - padY} stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
        <path d={toPath(inputPoints)} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
        <path d={toPath(outputPoints)} fill="none" stroke="#10b981" strokeWidth="1.5" />
        {inputPoints.map((p, i) => (
          <circle key={`i${i}`} cx={p.x} cy={p.y} r="2" fill="#3b82f6" />
        ))}
        {outputPoints.map((p, i) => (
          <circle key={`o${i}`} cx={p.x} cy={p.y} r="2" fill="#10b981" />
        ))}
      </svg>
      <div className="flex gap-4 mt-1 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-blue-500 inline-block" /> Input</span>
        <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-emerald-500 inline-block" /> Output</span>
      </div>
    </div>
  );
}

interface DailyCostChartProps {
  data: { date: string; cost: number }[];
}

export function DailyCostChart({ data }: DailyCostChartProps) {
  if (!data || data.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No cost data</p>;
  }
  const points = data.slice(0, 14);
  const maxVal = Math.max(...points.map((d) => d.cost), 0.01);
  const w = 280;
  const h = 80;
  const padX = 30;
  const padY = 10;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;

  const barW = Math.max(chartW / points.length - 2, 2);

  return (
    <div>
      <h4 className="text-xs font-medium mb-2">Daily Cost</h4>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        {points.map((d, i) => {
          const barH = Math.max((d.cost / maxVal) * chartH, 1);
          const x = padX + (i / points.length) * chartW;
          return <rect key={i} x={x} y={h - padY - barH} width={barW} height={barH} fill="#f59e0b" rx="1" />;
        })}
      </svg>
    </div>
  );
}

interface ModelDistributionChartProps {
  data: { model: string; count: number }[];
}

export function ModelDistributionChart({ data }: ModelDistributionChartProps) {
  if (!data || data.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No model data</p>;
  }
  const total = data.reduce((s, d) => s + d.count, 0);
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
  const cx = 50;
  const cy = 50;
  const r = 40;

  let angle = 0;
  const slices = data.map((d, i) => {
    const pct = d.count / total;
    const startAngle = angle;
    angle += pct * 360;
    const endAngle = angle;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = pct > 0.5 ? 1 : 0;
    const path = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
    return { path, color: colors[i % colors.length], model: d.model, pct };
  });

  return (
    <div>
      <h4 className="text-xs font-medium mb-2">Model Distribution</h4>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 100 100" className="w-24 h-24">
          {slices.map((s, i) => (
            <path key={i} d={s.path} fill={s.color} />
          ))}
        </svg>
        <div className="space-y-1">
          {slices.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px]">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span>{s.model}</span>
              <span className="text-muted-foreground">{(s.pct * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ActivityHeatmapProps {
  data: { date: string; count: number }[];
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const weeks = 7;
  const days = 7;
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const cells: { intensity: number; label: string }[][] = [];
  const dataMap = new Map(data.map((d) => d.date));

  for (let w = 0; w < weeks; w++) {
    const week: { intensity: number; label: string }[] = [];
    for (let d = 0; d < days; d++) {
      const idx = w * days + d;
      const dateStr = data[idx]?.date || "";
      const count = dataMap.get(dateStr) || data[idx]?.count || 0;
      week.push({ intensity: count / maxCount, label: dateStr });
    }
    cells.push(week);
  }

  const getColor = (intensity: number) => {
    if (intensity === 0) return "bg-muted";
    if (intensity < 0.25) return "bg-green-200 dark:bg-green-900";
    if (intensity < 0.5) return "bg-green-300 dark:bg-green-700";
    if (intensity < 0.75) return "bg-green-400 dark:bg-green-600";
    return "bg-green-500 dark:bg-green-500";
  };

  return (
    <div>
      <h4 className="text-xs font-medium mb-2">Activity</h4>
      <div className="flex gap-0.5">
        {cells.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((cell, di) => (
              <div key={di} className={`w-3 h-3 rounded-sm ${getColor(cell.intensity)}`} title={cell.label} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
