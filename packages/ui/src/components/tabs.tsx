import React, { createContext, useContext, useState } from "react";
import { cn } from "../lib/utils";

interface TabsContextValue {
  value: string;
  onChange: (v: string) => void;
}
const TabsCtx = createContext<TabsContextValue>({ value: "", onChange: () => {} });

export function Tabs({ defaultValue = "", value: controlled, onValueChange, children, className }: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [internal, setInternal] = useState(defaultValue);
  const value = controlled ?? internal;
  const onChange = onValueChange ?? setInternal;
  return (
    <TabsCtx.Provider value={{ value, onChange }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = useContext(TabsCtx);
  return (
    <button
      className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        ctx.value === value && "bg-background text-foreground shadow", className)}
      onClick={() => ctx.onChange(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = useContext(TabsCtx);
  if (ctx.value !== value) return null;
  return <div className={cn("mt-2 ring-offset-background focus-visible:outline-none", className)}>{children}</div>;
}
