"use client";

import * as React from "react";
import { cn } from "../lib/utils";

interface MenubarProps {
  children: React.ReactNode;
  className?: string;
}

export function Menubar({ children, className }: MenubarProps) {
  return (
    <nav
      className={cn(
        "flex items-center gap-1 rounded-md border bg-background p-1",
        className,
      )}
    >
      {children}
    </nav>
  );
}

interface MenubarMenuProps {
  label: string;
  children: React.ReactNode;
}

export function MenubarMenu({ label, children }: MenubarMenuProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="rounded-sm px-3 py-1.5 text-sm hover:bg-accent transition-colors"
      >
        {label}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-md border bg-background p-1 shadow-md">
          {children}
        </div>
      )}
    </div>
  );
}

interface MenubarItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function MenubarItem({ children, onClick, className }: MenubarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors text-left",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function MenubarSeparator() {
  return <div className="my-1 h-px bg-border" />;
}
