import * as React from "react";
import { cn } from "../lib/utils";

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn("w-full", className)} {...props}>
      {children}
    </div>
  ),
);
ChartContainer.displayName = "ChartContainer";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  formatter?: (value: number, name: string) => string;
}

function ChartTooltip({ active, payload, formatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">
            {formatter ? formatter(entry.value, entry.name) : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export { ChartContainer, ChartTooltip, type ChartTooltipProps };
