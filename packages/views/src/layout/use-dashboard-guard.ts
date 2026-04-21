import { useLocation } from "react-router-dom";
import { useAuthStore } from "@openzoo/core/auth";
import { useWorkspaceStore } from "@openzoo/core/workspace";

export function useDashboardGuard(loginPath = "/login") {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => !!s.user);
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);

  return {
    isAuthenticated,
    shouldRedirect: !isAuthenticated,
    redirectPath: loginPath,
    from: location,
    hasWorkspace: !!workspace,
  };
}
