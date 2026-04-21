"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";

interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function ButtonGroup({ children, className }: ButtonGroupProps) {
  return (
    <div className={cn("inline-flex rounded-md", className)}>
      {React.Children.map(children, (child, i) => {
        if (!React.isValidElement(child)) return child;
        const isFirst = i === 0;
        const isLast = i === React.Children.count(children) - 1;
        return React.cloneElement(child as React.ReactElement<any>, {
          className: cn(
            (child.props as any).className,
            !isFirst && "rounded-l-none border-l-0",
            !isLast && "rounded-r-none",
          ),
        });
      })}
    </div>
  );
}

interface ButtonGroupItemProps extends React.ComponentProps<typeof Button> {
  value?: string;
}

export function ButtonGroupItem({ className, ...props }: ButtonGroupItemProps) {
  return <Button className={cn(className)} {...props} />;
}
