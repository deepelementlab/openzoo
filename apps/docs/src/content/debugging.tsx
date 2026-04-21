function Debugging() {
  return (
    <>
      <h1>Debugging</h1>
      <p>Tips and tools for debugging OpenZoo in development and production.</p>

      <h2>Backend Debugging</h2>

      <h3>Enable Debug Logging</h3>
      <pre><code>{`OPENZOO_LOG_LEVEL=debug openzoo serve --http :8080`}</code></pre>

      <h3>Check Server Health</h3>
      <pre><code>{`curl http://localhost:8080/health
curl http://localhost:8080/metrics`}</code></pre>

      <h3>Database Inspection</h3>
      <pre><code>{`sqlite3 /data/openzoo.db ".tables"
sqlite3 /data/openzoo.db "SELECT * FROM issues LIMIT 10;"`}</code></pre>

      <h3>Daemon Issues</h3>
      <pre><code>{`openzoo daemon status
openzoo daemon stop
openzoo daemon start`}</code></pre>

      <h2>Frontend Debugging</h2>

      <h3>React DevTools</h3>
      <p>Install the React Developer Tools browser extension to inspect component state and props.</p>

      <h3>Network Requests</h3>
      <p>Open browser DevTools → Network tab. All API calls go to <code>/rpc/*</code> endpoints as POST requests.</p>

      <h3>WebSocket Events</h3>
      <p>Open browser DevTools → Network → WS tab to see Centrifugo WebSocket messages.</p>

      <h3>State Inspection</h3>
      <p>Zustand state can be inspected via the browser console:</p>
      <pre><code>{`window.__OPENZOO_AUTH_STATE__    // Auth store state
window.__OPENZOO_WORKSPACE_STATE__ // Workspace store state`}</code></pre>

      <h2>Agent Debugging</h2>

      <h3>Check Agent Availability</h3>
      <pre><code>{`which claude
which codex
which opencode`}</code></pre>

      <h3>Test Agent Manually</h3>
      <pre><code>{`echo '{"task":"list files"}' | claude --json`}</code></pre>

      <h3>View Agent Logs</h3>
      <p>Agent output is logged to the server&apos;s stdout/stderr. Check with:</p>
      <pre><code>{`docker logs openzoo-server 2>&1 | grep "agent"`}</code></pre>

      <h2>Common Issues</h2>
      <table>
        <thead>
          <tr><th>Problem</th><th>Solution</th></tr>
        </thead>
        <tbody>
          <tr><td>401 Unauthorized</td><td>Token expired — re-login or check <code>openzoo_token</code> in localStorage</td></tr>
          <tr><td>503 Service Unavailable</td><td>Database locked — check SQLite file permissions</td></tr>
          <tr><td>WebSocket not connecting</td><td>Centrifugo not running — check Docker Compose status</td></tr>
          <tr><td>Agent not found</td><td>Binary not in PATH — check <code>which agent</code></td></tr>
          <tr><td>CORS errors</td><td>Configure proxy in <code>vite.config.ts</code></td></tr>
        </tbody>
      </table>
    </>
  );
}

export default Debugging;
