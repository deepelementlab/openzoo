import { useMemo } from "react";

interface ActivityHeatmapProps {
  data: Array<{ date: string; tokens: number }>;
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const weeks = useMemo(() => {
    const now = new Date();
    const result: Array<Array<{ date: string; count: number; level: number }>> = [];
    const dataMap = new Map(data.map((d) => [d.date, d.tokens]));

    for (let w = 12; w >= 0; w--) {
      const week: Array<{ date: string; count: number; level: number }> = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (w * 7 + (6 - d)));
        const key = date.toISOString().split("T")[0];
        const count = dataMap.get(key) ?? 0;
        const level = count === 0 ? 0 : count < 1000 ? 1 : count < 10000 ? 2 : count < 50000 ? 3 : 4;
        week.push({ date: key, count, level });
      }
      result.push(week);
    }
    return result;
  }, [data]);

  const colors = ["bg-muted", "bg-green-200 dark:bg-green-900", "bg-green-400 dark:bg-green-700", "bg-green-600 dark:bg-green-500", "bg-green-800 dark:bg-green-300"];

  return (
    <div className="flex gap-0.5">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-0.5">
          {week.map((day, di) => (
            <div
              key={di}
              className={`h-2.5 w-2.5 rounded-sm ${colors[day.level]}`}
              title={`${day.date}: ${day.count.toLocaleString()} tokens`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
