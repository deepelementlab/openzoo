function Testing() {
  return (
    <>
      <h1>Testing</h1>
      <p>OpenZoo uses multiple testing strategies across the stack.</p>

      <h2>Backend Tests (Go)</h2>
      <pre><code>cd server
go test ./...                    # Run all tests
go test ./pkg/agent/... -v       # Run agent tests with verbose output
go test ./cmd/server/... -tags=integration  # Integration tests</code></pre>

      <h3>Integration Tests</h3>
      <p>Located in <code>cmd/server/integration_test.go</code>, these tests start a full server and exercise the complete request lifecycle:</p>
      <ul>
        <li>Health check and metrics endpoints</li>
        <li>Authentication flow (send code, verify)</li>
        <li>Issue CRUD operations</li>
        <li>Comment management</li>
        <li>Label and project management</li>
        <li>Agent registration</li>
        <li>Cycle and view management</li>
      </ul>

      <h3>Agent Adapter Tests</h3>
      <p>Located in <code>pkg/agent/hermes_openclaw_test.go</code>:</p>
      <ul>
        <li>Command construction and validation</li>
        <li>Event parsing from stdout/stderr</li>
        <li>Error handling and timeout behavior</li>
        <li>Environment variable building</li>
      </ul>

      <h2>Frontend Tests</h2>
      <pre><code>pnpm test                        # Unit tests (Vitest)
pnpm --filter @openzoo/web test:e2e  # E2E tests (Playwright)</code></pre>

      <h3>Test Stack</h3>
      <table>
        <thead>
          <tr><th>Type</th><th>Tool</th><th>Location</th></tr>
        </thead>
        <tbody>
          <tr><td>Unit</td><td>Vitest</td><td><code>src/**/*.test.ts</code></td></tr>
          <tr><td>Component</td><td>Vitest + Testing Library</td><td><code>src/**/*.test.tsx</code></td></tr>
          <tr><td>E2E</td><td>Playwright</td><td><code>tests/**/*.spec.ts</code></td></tr>
        </tbody>
      </table>

      <h2>Running the Full Suite</h2>
      <pre><code>pnpm test          # Frontend unit tests
cd server && go test ./...  # Backend tests
pnpm test:e2e      # End-to-end tests</code></pre>
    </>
  );
}

export default Testing;
