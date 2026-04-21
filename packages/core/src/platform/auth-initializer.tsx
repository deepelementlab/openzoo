import React, { useEffect, type ReactNode } from "react";
import { useAuthStore } from "../auth/store";
import { useWorkspaceStore } from "../workspace/store";
import { setToken, setWorkspaceId } from "../api/connect-client";

interface AuthInitializerProps {
  children: ReactNode;
  onUnauthorized?: () => void;
}

/**
 * Restores auth state from localStorage on mount.
 * Must wrap the app at the top level.
 */
export const AuthInitializer: React.FC<AuthInitializerProps> = ({ children, onUnauthorized }) => {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (isAuthenticated && token) {
      setToken(token);
      loadWorkspaces();
    }
  }, [isAuthenticated, token, loadWorkspaces]);

  useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceId(currentWorkspace.id);
    }
  }, [currentWorkspace]);

  return <>{children}</>;
};
