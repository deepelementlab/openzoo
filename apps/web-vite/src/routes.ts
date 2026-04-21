export const ROUTES = {
  LANDING: "/",
  LOGIN: "/login",
  OAUTH_CALLBACK: "/auth/callback",
  DASHBOARD: "/",
  MY_ISSUES: "/my-issues",
  ISSUES: "/issues",
  ISSUE_DETAIL: "/issues/:issueId",
  AGENTS: "/agents",
  INBOX: "/inbox",
  PROJECTS: "/projects",
  RUNTIMES: "/runtimes",
  EXTERNAL_SESSIONS: "/external-sessions",
  SKILLS: "/skills",
  CYCLES: "/cycles",
  LABELS: "/labels",
  VIEWS: "/views",
  CHAT: "/chat",
  SEARCH: "/search",
  SETTINGS: "/settings",
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];
