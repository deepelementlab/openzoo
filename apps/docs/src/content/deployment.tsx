function Deployment() {
  return (
    <>
      <h1>Deployment</h1>
      <p>Deploy OpenZoo to production using Docker Compose with health checks and monitoring.</p>

      <h2>Docker Compose (Recommended)</h2>
      <pre><code>{`services:
  server:
    image: openzoo/server:latest
    build: ./server
    ports:
      - "8080:8080"
    volumes:
      - openzoo-data:/data
    environment:
      - OPENZOO_HTTP_ADDR=:8080
      - OPENZOO_CENTRIFUGO_URL=http://centrifugo:8000/api
      - OPENZOO_CENTRIFUGO_API_KEY=\${CENTRIFUGO_API_KEY}
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  centrifugo:
    image: centrifugo/centrifugo:v5
    ports:
      - "8000:8000"
    environment:
      - CENTRIFUGO_API_KEY=\${CENTRIFUGO_API_KEY}
      - CENTRIFUGO_TOKEN_HMAC_SECRET_KEY=\${CENTRIFUGO_SECRET}
    restart: unless-stopped

volumes:
  openzoo-data:`}</code></pre>

      <h2>Environment Variables</h2>
      <table>
        <thead>
          <tr><th>Variable</th><th>Default</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>OPENZOO_HTTP_ADDR</code></td><td>:8080</td><td>HTTP listen address</td></tr>
          <tr><td><code>OPENZOO_DB_PATH</code></td><td>/data/openzoo.db</td><td>SQLite database path</td></tr>
          <tr><td><code>OPENZOO_CENTRIFUGO_URL</code></td><td>—</td><td>Centrifugo API URL</td></tr>
          <tr><td><code>OPENZOO_CENTRIFUGO_API_KEY</code></td><td>—</td><td>Centrifugo API key</td></tr>
        </tbody>
      </table>

      <h2>Health Check</h2>
      <p>The <code>/health</code> endpoint verifies database connectivity:</p>
      <pre><code>{`curl http://localhost:8080/health
# 200 OK: {"status":"ok"}
# 503: {"status":"error","error":"database unavailable"}`}</code></pre>

      <h2>Monitoring</h2>
      <p>Prometheus metrics are exposed at <code>/metrics</code>:</p>
      <ul>
        <li><code>http_requests_total</code> — Request count by method/path/status</li>
        <li><code>http_request_duration_seconds</code> — Request latency histogram</li>
        <li><code>http_requests_in_flight</code> — Current in-flight requests</li>
      </ul>

      <h2>Rollback Procedure</h2>
      <ol>
        <li>Stop the current container: <code>docker compose down server</code></li>
        <li>Restore database from backup: <code>cp backup/openzoo.db /data/</code></li>
        <li>Start previous version: <code>docker compose up -d server</code></li>
        <li>Verify health: <code>curl http://localhost:8080/health</code></li>
      </ol>
    </>
  );
}

export default Deployment;
