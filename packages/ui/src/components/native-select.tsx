"use client";

import * as React from "react";
import { cn } from "../lib/utils";

interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export function NativeSelect({ className, children, ...props }: NativeSelectProps) {
  return (
    <select
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
        "focus:outline-none focus:ring-1 focus:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
