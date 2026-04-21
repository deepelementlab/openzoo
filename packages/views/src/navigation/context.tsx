import React, { createContext, useContext, type ReactNode } from "react";
import type { NavigationAdapter } from "@openzoo/core";

const NavigationCtx = createContext<NavigationAdapter | null>(null);

export function NavigationProvider({ adapter, children }: { adapter: NavigationAdapter; children: ReactNode }) {
  return <NavigationCtx.Provider value={adapter}>{children}</NavigationCtx.Provider>;
}

export function useNavigate() {
  const ctx = useContext(NavigationCtx);
  if (!ctx) throw new Error("useNavigate must be used within NavigationProvider");
  return ctx.navigate;
}

export function useNavigation() {
  const ctx = useContext(NavigationCtx);
  if (!ctx) throw new Error("useNavigation must be used within NavigationProvider");
  return ctx;
}
