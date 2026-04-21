function Backend() {
  return (
    <>
      <h1>Backend Architecture</h1>
      <p>The Go backend follows a strict three-layer architecture with dependency injection.</p>

      <h2>Three-Tier Architecture</h2>
      <pre><code>{`Handler (connectapi/)  →  Service (service/)  →  Storage (storage/)`}</code></pre>

      <h3>Handler Layer (connectapi/)</h3>
      <ul>
        <li>Connect-RPC method handlers</li>
        <li>Input validation and serialization</li>
        <li>Authentication and authorization checks</li>
        <li>HTTP middleware (metrics, CORS, logging)</li>
      </ul>

      <h3>Service Layer (service/)</h3>
      <ul>
        <li>Business logic and domain rules</li>
        <li>Cross-entity operations (e.g., creating an issue + sending notification)</li>
        <li>Authorization enforcement</li>
        <li>Centrifugo event publishing</li>
      </ul>

      <h3>Storage Layer (storage/)</h3>
      <ul>
        <li>SQLite query construction and execution</li>
        <li>Transaction management</li>
        <li>Data mapping between database rows and domain types</li>
      </ul>

      <h2>Middleware Chain</h2>
      <pre><code>{`Request → Prometheus Metrics → CORS → Logging → Auth → Handler`}</code></pre>

      <h3>Available Endpoints</h3>
      <table>
        <thead>
          <tr><th>Path</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td><code>/rpc/*</code></td><td>Connect-RPC JSON endpoints</td></tr>
          <tr><td><code>/health</code></td><td>Health check (verifies DB connectivity)</td></tr>
          <tr><td><code>/metrics</code></td><td>Prometheus metrics</td></tr>
          <tr><td><code>/auth/*</code></td><td>OAuth callbacks</td></tr>
        </tbody>
      </table>

      <h2>Agent Subsystem</h2>
      <p>The <code>pkg/agent/</code> package provides a unified interface for AI agent integration:</p>
      <pre><code>{`type Agent interface {
  Run(ctx context.Context, msg Message) (<-chan Event, error)
  IsAvailable() bool
  DetectVersion(ctx context.Context) (string, error)
}`}</code></pre>
      <p>Supported adapters: Claude, Codex, OpenCode, Hermes (ACP), OpenClaw, ClawCode, StormClaw.</p>

      <h2>Daemon Mode</h2>
      <p>The server can run as a background daemon for CLI and desktop usage:</p>
      <pre><code>{`openzoo daemon start    # Start background server
openzoo daemon status   # Check if running
openzoo daemon stop     # Stop background server`}</code></pre>
    </>
  );
}

export default Backend;
