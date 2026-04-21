export interface NavItem {
  label: string;
  path: string;
  icon?: string;
}

export interface NavigationAdapter {
  navigate: (path: string) => void;
  goBack: () => void;
  getCurrentPath?: () => string;
}

export const NAV_PATHS = {
  HOME: "/",
  ISSUES: "/issues",
  MY_ISSUES: "/issues?filter=my",
  AGENTS: "/agents",
  RUNTIMES: "/runtimes",
  EXTERNAL_SESSIONS: "/external-sessions",
  PROJECTS: "/projects",
  INBOX: "/inbox",
  CHAT: "/chat",
  SEARCH: "/search",
  SETTINGS: "/settings",
  LOGIN: "/login",
} as const;
