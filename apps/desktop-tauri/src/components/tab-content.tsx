import * as React from "react";
import { useTabStore, getTitleForPath } from "../stores/tab-store";
import { HashRouter, Route, Routes, Navigate, useLocation, useNavigate, useParams, Link } from "react-router-dom";
import {
  DashboardLayout, LoginPage, IssuesPage, IssueDetailPage,
  AgentsPage, InboxPage, ProjectsPage, SettingsPage,
  RuntimesPage, ChatPage, SearchPage,
  NavigationContext, type NavigationAdapter, NotFoundPage,
  MyIssuesPage, SkillsPage, CyclesPage, LabelsPage, ViewsPage,
} from "@openzoo/views";

function useTabNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  return React.useMemo<NavigationAdapter>(() => ({
    navigate: (path) => navigate(path),
    goBack: () => navigate(-1),
    getCurrentPath: () => location.pathname,
    createHref: (path) => `#${path}`,
    usePathname: () => location.pathname,
    useParams: <T extends Record<string, string>>() => params as T,
    Link: ({ to, className, children }) => (
      <a href={`#${to}`} className={className} onClick={(e) => { e.preventDefault(); navigate(to); }}>
        {children}
      </a>
    ),
  }), [location, navigate, params]);
}

function TabRouter({ tabId }: { tabId: string }) {
  const { tabs, updateTabTitle } = useTabStore();
  const tab = tabs.find((t) => t.id === tabId);
  const navigation = useTabNav();
  const location = useLocation();

  React.useEffect(() => {
    const title = getTitleForPath(location.pathname);
    updateTabTitle(tabId, title);
  }, [location.pathname, tabId, updateTabTitle]);

  if (!tab) return null;

  return (
    <NavigationContext.Provider value={navigation}>
      <DashboardLayout>
        <React.Suspense fallback={<div className="flex items-center justify-center h-64 text-sm text-muted-foreground">Loading...</div>}>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/my-issues" element={<MyIssuesPage />} />
            <Route path="/issues" element={<IssuesPage />} />
            <Route path="/issues/:issueId" element={<IssueDetailPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/runtimes" element={<RuntimesPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/cycles" element={<CyclesPage />} />
            <Route path="/labels" element={<LabelsPage />} />
            <Route path="/views" element={<ViewsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </React.Suspense>
      </DashboardLayout>
    </NavigationContext.Provider>
  );
}

function DashboardHome() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
      <p className="text-muted-foreground">Select a section from the sidebar.</p>
    </div>
  );
}

function TabContent() {
  const { tabs, activeTabId } = useTabStore();

  return (
    <div className="flex-1 overflow-hidden relative">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className="absolute inset-0 overflow-auto"
          style={{ display: tab.id === activeTabId ? "block" : "none" }}
        >
          <HashRouter>
            <TabRouter tabId={tab.id} />
          </HashRouter>
        </div>
      ))}
      {tabs.length === 0 && (
        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
          No open tabs. Click + to open a new tab.
        </div>
      )}
    </div>
  );
}

export { TabContent };
