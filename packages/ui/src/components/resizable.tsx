import * as React from "react";
import { cn } from "../lib/utils";

interface ResizablePanelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "horizontal" | "vertical";
}

function ResizablePanelGroup({ direction = "horizontal", className, children, ...props }: ResizablePanelGroupProps) {
  return (
    <div className={cn("flex", direction === "vertical" ? "flex-col" : "flex-row", className)} {...props}>
      {children}
    </div>
  );
}

function ResizablePanel({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-auto", className)} {...props}>{children}</div>;
}

function ResizableHandle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("w-px bg-border hover:bg-primary/50 cursor-col-resize transition-colors", className)}
      {...props}
    />
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
