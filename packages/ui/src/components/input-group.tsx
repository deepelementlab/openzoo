"use client";

import * as React from "react";
import { cn } from "../lib/utils";

interface InputGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function InputGroup({ children, className }: InputGroupProps) {
  return (
    <div className={cn("flex items-center rounded-md border", className)}>
      {React.Children.map(children, (child, i) => {
        if (!React.isValidElement(child)) return child;
        const isFirst = i === 0;
        const isLast = i === React.Children.count(children) - 1;
        return React.cloneElement(child as React.ReactElement<any>, {
          className: cn(
            (child.props as any).className,
            "border-0 shadow-none",
            !isFirst && "rounded-l-none border-l",
            !isLast && "rounded-r-none",
          ),
        });
      })}
    </div>
  );
}

export function InputGroupText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 text-sm text-muted-foreground bg-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
