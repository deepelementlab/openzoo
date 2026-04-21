"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

interface NavigationMenuProps {
  children: React.ReactNode;
  className?: string;
}

export function NavigationMenu({ children, className }: NavigationMenuProps) {
  return (
    <nav className={cn("relative flex items-center gap-1", className)}>
      {children}
    </nav>
  );
}

interface NavigationMenuItemProps {
  label: string;
  children: React.ReactNode;
}

export function NavigationMenuItem({ label, children }: NavigationMenuItemProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
      >
        {label}
        <ChevronDown className="size-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-md border bg-background p-2 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}

interface NavigationMenuLinkProps {
  href?: string;
  children: React.ReactNode;
  className?: string;
}

export function NavigationMenuLink({
  href,
  children,
  className,
}: NavigationMenuLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "block rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors",
        className,
      )}
    >
      {children}
    </a>
  );
}

export function NavigationMenuContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      {children}
    </div>
  );
}
