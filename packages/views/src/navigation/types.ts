import React from "react";

/**
 * NavigationAdapter - platform-agnostic navigation interface.
 * Each app (web-vite, desktop-tauri) provides its own implementation.
 */
export interface NavigationAdapter {
  navigate(path: string): void;
  goBack?(): void;
  getCurrentPath(): string;
  createHref(path: string): string;
  usePathname(): string;
  useParams<T extends Record<string, string>>(): T;
  Link: React.ComponentType<{ to: string; className?: string; children: React.ReactNode }>;
}

export const NavigationContext = React.createContext<NavigationAdapter | null>(null);

export function useNavigation(): NavigationAdapter {
  const nav = React.useContext(NavigationContext);
  if (!nav) throw new Error("NavigationContext not provided");
  return nav;
}
