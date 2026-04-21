function Frontend() {
  return (
    <>
      <h1>Frontend Architecture</h1>
      <p>The frontend uses a three-package architecture enabling maximum code sharing between Web and Desktop.</p>

      <h2>Package Separation</h2>
      <h3>@openzoo/core — Data &amp; Platform Layer</h3>
      <ul>
        <li>Connect-RPC API client with automatic auth headers</li>
        <li>Zustand stores (auth, workspace, issues)</li>
        <li>TanStack React Query hooks and mutations</li>
        <li>Centrifugo real-time WebSocket client</li>
        <li>CoreProvider (QueryClient + AuthInitializer)</li>
      </ul>

      <h3>@openzoo/ui — Component Library</h3>
      <ul>
        <li>Radix UI primitives (Dialog, Popover, Select, etc.)</li>
        <li>TipTap rich text editor</li>
        <li>ThemeProvider (light/dark/system)</li>
        <li>ToastProvider, ErrorBoundary, LoadingScreen</li>
        <li>Tailwind CSS with CSS variables (oklch color space)</li>
      </ul>

      <h3>@openzoo/views — Page Components</h3>
      <ul>
        <li>Complete page implementations (IssuesPage, AgentsPage, etc.)</li>
        <li>DashboardLayout with sidebar navigation</li>
        <li>NavigationAdapter abstraction for platform-agnostic routing</li>
        <li>ModalProvider for global modal management</li>
      </ul>

      <h2>NavigationAdapter Pattern</h2>
      <p>The key architectural pattern enabling cross-platform views:</p>
      <pre><code>{`interface NavigationAdapter {
  navigate(path: string): void;
  goBack?(): void;
  getCurrentPath(): string;
  createHref(path: string): string;
  usePathname(): string;
  useParams<T>(): T;
  Link: React.ComponentType<LinkProps>;
}`}</code></pre>
      <p>
        Each host app provides its own adapter implementation. Web uses <code>react-router-dom</code>&apos;s
        hooks, Desktop uses <code>HashRouter</code> with Tauri integration. All views consume the
        adapter via <code>NavigationContext</code>.
      </p>

      <h2>Shell App Pattern</h2>
      <p>
        <code>apps/web-vite</code> and <code>apps/desktop-tauri</code> are intentionally thin.
        They only provide:
      </p>
      <ol>
        <li>Provider stack (ThemeProvider → CoreProvider → ToastProvider)</li>
        <li>Router setup (BrowserRouter or HashRouter)</li>
        <li>NavigationAdapter implementation</li>
        <li>Route-to-page mapping</li>
      </ol>
      <p>All business logic lives in the shared packages.</p>

      <h2>Provider Hierarchy</h2>
      <pre><code>{`ThemeProvider
  └── CoreProvider (QueryClient + AuthInitializer)
        └── ToastProvider
              └── ErrorBoundary
                    └── Router (BrowserRouter | HashRouter)
                          └── NavigationContext.Provider
                                └── Page Components`}</code></pre>
    </>
  );
}

export default Frontend;
