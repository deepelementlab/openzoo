import * as React from "react";
import { cn } from "../lib/utils";

function Sidebar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex h-full flex-col bg-background", className)} {...props} />;
}

function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center border-b px-4 py-3", className)} {...props} />;
}

function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-y-auto", className)} {...props} />;
}

function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-t p-3", className)} {...props} />;
}

function SidebarGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-3 py-2", className)} {...props} />;
}

function SidebarGroupLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-1 px-2 text-xs font-semibold text-muted-foreground", className)} {...props} />;
}

function SidebarItem({ className, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors", className)}
      {...props}
    />
  );
}

export { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarItem };
