function Monorepo() {
  return (
    <>
      <h1>Monorepo Structure</h1>
      <p>OpenZoo uses a pnpm workspace monorepo managed by Turborepo.</p>

      <h2>Directory Layout</h2>
      <pre><code>{`openzoo/
├── apps/
│   ├── web-vite/          # Web application (Vite + React Router)
│   ├── desktop-tauri/     # Desktop application (Tauri 2)
│   └── docs/              # Documentation site (Vite + React)
├── packages/
│   ├── core/              # @openzoo/core — State, API, hooks
│   ├── ui/                # @openzoo/ui — Component library
│   └── views/             # @openzoo/views — Page components
├── server/                # Go backend
│   ├── cmd/openzoo/       # CLI entry point
│   ├── cmd/server/        # Server entry point
│   ├── internal/          # Private packages
│   │   ├── connectapi/    # Connect-RPC handlers
│   │   ├── service/       # Business logic
│   │   ├── storage/       # Database queries
│   │   └── middleware/    # HTTP middleware
│   └── pkg/agent/         # Agent adapters (public)
├── scripts/               # Operational scripts
└── turbo.json             # Turborepo configuration`}</code></pre>

      <h2>Package Dependencies</h2>
      <pre><code>{`apps/web-vite  →  @openzoo/core, @openzoo/ui, @openzoo/views
apps/desktop   →  @openzoo/core, @openzoo/ui, @openzoo/views
apps/docs      →  (standalone)
@openzoo/views →  @openzoo/core, @openzoo/ui
@openzoo/core  →  (no internal deps)
@openzoo/ui    →  (no internal deps)`}</code></pre>

      <h2>Vite Aliases</h2>
      <p>During development, apps consume packages via Vite path aliases for hot-reload:</p>
      <pre><code>{`// vite.config.ts
resolve: {
  alias: {
    "@openzoo/core": path.resolve(__dirname, "../../packages/core/src"),
    "@openzoo/ui": path.resolve(__dirname, "../../packages/ui/src"),
    "@openzoo/views": path.resolve(__dirname, "../../packages/views/src"),
  },
}`}</code></pre>

      <h2>Build Commands</h2>
      <table>
        <thead>
          <tr><th>Command</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>pnpm dev</code></td><td>Start all apps in development mode</td></tr>
          <tr><td><code>pnpm build</code></td><td>Build all packages and apps</td></tr>
          <tr><td><code>pnpm typecheck</code></td><td>Run TypeScript type checking</td></tr>
          <tr><td><code>pnpm lint</code></td><td>Lint all packages</td></tr>
          <tr><td><code>pnpm test</code></td><td>Run tests across all packages</td></tr>
        </tbody>
      </table>
    </>
  );
}

export default Monorepo;
