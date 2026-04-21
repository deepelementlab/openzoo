import React from "react";
import ReactDOM from "react-dom/client";
import { CoreProvider, useAuthStore, attachRealtimeSync, getWorkspaceId } from "@openzoo/core";
import { LoginPage } from "@openzoo/views";
import { ThemeProvider, ToastProvider, ErrorBoundary } from "@openzoo/ui";
import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { DesktopLayout } from "./components/desktop-layout";
import { useTabStore } from "./stores/tab-store";
import "@openzoo/ui/styles/globals.css";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppShell() {
  const wsId = getWorkspaceId();

  React.useEffect(() => {
    if (wsId) {
      const disconnect = attachRealtimeSync(wsId, {
        onIssueChanged: () => console.log("[realtime] issue changed"),
        onTaskChanged: () => console.log("[realtime] task changed"),
      });
      return disconnect;
    }
  }, [wsId]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={
        <AuthGuard>
          <DesktopLayout />
        </AuthGuard>
      } />
    </Routes>
  );
}

function App() {
  return (
    <React.StrictMode>
      <ThemeProvider>
        <CoreProvider onUnauthorized={() => useAuthStore.getState().logout()}>
          <ToastProvider>
            <HashRouter>
              <ErrorBoundary>
                <AppShell />
              </ErrorBoundary>
            </HashRouter>
          </ToastProvider>
        </CoreProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
