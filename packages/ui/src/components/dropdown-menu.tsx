import React, { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  return <div className="relative inline-flex">{children}</div>;
}

export function DropdownMenuTrigger({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <div onClick={onClick}>{children}</div>;
}

export function DropdownMenuContent({ children, open, onClose, className, align = "end" }: {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
  className?: string;
  align?: "start" | "end";
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div ref={ref} className={cn(
      "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
      align === "end" ? "right-0" : "left-0", "top-full mt-1", className,
    )}>
      {children}
    </div>
  );
}

export function DropdownMenuItem({ children, onClick, className }: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button className={cn("relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground", className)}
      onClick={onClick}>
      {children}
    </button>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn("-mx-1 my-1 h-px bg-muted", className)} />;
}
