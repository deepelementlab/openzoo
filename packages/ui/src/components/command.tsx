import React from "react";
import { cn } from "../lib/utils";

interface CommandProps {
  children: React.ReactNode;
  className?: string;
}

export function Command({ children, className }: CommandProps) {
  return (
    <div className={cn("flex h-full w-full flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground", className)}>
      {children}
    </div>
  );
}

interface CommandInputProps {
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function CommandInput({ placeholder, value, onValueChange, className }: CommandInputProps) {
  return (
    <div className="flex items-center border-b px-3">
      <svg className="mr-2 h-4 w-4 shrink-0 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input
        className={cn("flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50", className)}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
      />
    </div>
  );
}

export function CommandList({ children, className }: CommandProps) {
  return <div className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden p-1", className)}>{children}</div>;
}

export function CommandEmpty({ children }: { children?: React.ReactNode }) {
  return <div className="py-6 text-center text-sm">{children ?? "No results found."}</div>;
}

interface CommandItemProps {
  children: React.ReactNode;
  onSelect?: () => void;
  className?: string;
}

export function CommandItem({ children, onSelect, className }: CommandItemProps) {
  return (
    <div
      className={cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground", className)}
      onClick={onSelect}
    >
      {children}
    </div>
  );
}

export function CommandGroup({ children, heading, className }: CommandProps & { heading?: string }) {
  return (
    <div className={cn("overflow-hidden p-1", className)}>
      {heading && <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{heading}</div>}
      {children}
    </div>
  );
}
