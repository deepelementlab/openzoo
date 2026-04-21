function Configuration() {
  return (
    <>
      <h1>Configuration</h1>
      <p>OpenZoo is configured via environment variables, CLI commands, or a local config file.</p>

      <h2>CLI Config Commands</h2>
      <pre><code>openzoo config show              # Display current configuration
openzoo config set key value     # Set a configuration value
openzoo config local             # Show local config file path</code></pre>

      <h2>Server Configuration</h2>
      <table>
        <thead>
          <tr><th>Variable</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>OPENZOO_HTTP_ADDR</code></td><td>:8080</td><td>HTTP listen address</td></tr>
          <tr><td><code>OPENZOO_DB_PATH</code></td><td>openzoo.db</td><td>SQLite database file path</td></tr>
          <tr><td><code>OPENZOO_CENTRIFUGO_URL</code></td><td>—</td><td>Centrifugo server API URL</td></tr>
          <tr><td><code>OPENZOO_CENTRIFUGO_API_KEY</code></td><td>—</td><td>Centrifugo API key for publishing</td></tr>
          <tr><td><code>OPENZOO_CENTRIFUGO_TOKEN_SECRET</code></td><td>—</td><td>HMAC secret for Centrifugo token generation</td></tr>
          <tr><td><code>OPENZOO_LOG_LEVEL</code></td><td>info</td><td>Log level (debug, info, warn, error)</td></tr>
          <tr><td><code>OPENZOO_MAX_UPLOAD_SIZE</code></td><td>104857600</td><td>Max file upload size in bytes (default 100MB)</td></tr>
          <tr><td><code>OPENZOO_GITHUB_TOKEN</code></td><td>—</td><td>GitHub API token for update checks</td></tr>
        </tbody>
      </table>

      <h2>Frontend Configuration</h2>
      <table>
        <thead>
          <tr><th>Variable</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>VITE_API_URL</code></td><td>Backend API URL (empty = same origin)</td></tr>
          <tr><td><code>VITE_WS_URL</code></td><td>Centrifugo WebSocket URL</td></tr>
        </tbody>
      </table>

      <h2>Agent Configuration</h2>
      <p>Agents are configured per-workspace via the UI or CLI:</p>
      <pre><code>openzoo config set agent.type claude
openzoo config set agent.claude.path /usr/local/bin/claude
openzoo config set agent.claude.permission-mode bypassPermissions</code></pre>

      <h3>Supported Agent Types</h3>
      <table>
        <thead>
          <tr><th>Type</th><th>Binary</th><th>Protocol</th></tr>
        </thead>
        <tbody>
          <tr><td>claude</td><td><code>claude</code></td><td>CLI JSON streaming</td></tr>
          <tr><td>codex</td><td><code>codex</code></td><td>CLI JSON streaming</td></tr>
          <tr><td>opencode</td><td><code>opencode</code></td><td>CLI JSON streaming</td></tr>
          <tr><td>hermes</td><td><code>hermes</code></td><td>ACP (JSON-RPC over stdio)</td></tr>
          <tr><td>openclaw</td><td><code>openclaw</code></td><td>CLI + stderr JSON</td></tr>
          <tr><td>clawcode</td><td><code>clawcode</code></td><td>CLI JSON output</td></tr>
          <tr><td>stormclaw</td><td><code>stormclaw</code></td><td>CLI stdout</td></tr>
        </tbody>
      </table>

      <h2>Config File Location</h2>
      <pre><code>~/.config/openzoo/config.json    # macOS/Linux
%APPDATA%\openzoo\config.json     # Windows</code></pre>
    </>
  );
}

export default Configuration;
