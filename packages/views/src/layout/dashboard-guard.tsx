import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@openzoo/core/auth";
import { useWorkspaceStore } from "@openzoo/core/workspace";

interface DashboardGuardProps {
  children: React.ReactNode;
  loginPath?: string;
  loadingFallback?: React.ReactNode;
}

export function DashboardGuard({
  children,
  loginPath = "/login",
  loadingFallback,
}: DashboardGuardProps) {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => !!s.user);
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);

  if (!isAuthenticated) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (!workspace && loadingFallback) {
    return <>{loadingFallback}</>;
  }

  return <>{children}</>;
}
