import React, { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";

export function Tooltip({ content, children, side = "top" }: { content: string; children: React.ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1",
    left: "right-full top-1/2 -translate-y-1/2 mr-1",
    right: "left-full top-1/2 -translate-y-1/2 ml-1",
  };
  return (
    <div ref={ref} className="relative inline-flex" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <div className={cn("absolute z-50 rounded-md bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md animate-in fade-in-0", positions[side])}>
          {content}
        </div>
      )}
    </div>
  );
}
