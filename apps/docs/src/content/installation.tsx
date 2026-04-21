function Installation() {
  return (
    <>
      <h1>Installation</h1>
      <p>Three ways to install OpenZoo: from source, pre-built binary, or Docker.</p>

      <h2>System Requirements</h2>
      <ul>
        <li>Go 1.22+ (building from source)</li>
        <li>Node.js 20+ and pnpm 9+ (frontend development)</li>
        <li>Docker 24+ and Docker Compose v2 (containerized deployment)</li>
        <li>512MB RAM minimum, 1GB recommended</li>
        <li>100MB disk space for the binary + SQLite database</li>
      </ul>

      <h2>Option 1: Build from Source</h2>
      <pre><code>{`git clone https://github.com/openzoo/openzoo.git
cd openzoo/server
go build -o openzoo ./cmd/openzoo
./openzoo serve --http :8080`}</code></pre>

      <h3>Frontend Build</h3>
      <pre><code>{`cd openzoo
pnpm install
pnpm --filter @openzoo/web build`}</code></pre>
      <p>The built assets are in <code>apps/web-vite/dist/</code>. Configure the server to serve these static files.</p>

      <h2>Option 2: Pre-built Binary</h2>
      <p>Download the latest release from GitHub Releases:</p>
      <pre><code>{`curl -sL https://github.com/openzoo/openzoo/releases/latest/download/openzoo-linux-amd64 -o openzoo
chmod +x openzoo
sudo mv openzoo /usr/local/bin/
openzoo serve --http :8080`}</code></pre>

      <h2>Option 3: Docker</h2>
      <pre><code>{`docker run -d \\
  --name openzoo \\
  -p 8080:8080 \\
  -v openzoo-data:/data \\
  openzoo/server:latest`}</code></pre>

      <h3>Docker Compose (with Centrifugo)</h3>
      <pre><code>{`services:
  server:
    image: openzoo/server:latest
    ports:
      - "8080:8080"
    volumes:
      - openzoo-data:/data
    environment:
      - OPENZOO_CENTRIFUGO_URL=http://centrifugo:8000/api
      - OPENZOO_CENTRIFUGO_API_KEY=your-api-key
  centrifugo:
    image: centrifugo/centrifugo:v5
    ports:
      - "8000:8000"
    environment:
      - CENTRIFUGO_API_KEY=your-api-key
      - CENTRIFUGO_TOKEN_HMAC_SECRET_KEY=your-secret`}</code></pre>

      <h2>Verify Installation</h2>
      <pre><code>{`curl http://localhost:8080/health`}</code></pre>
      <p>A healthy response returns HTTP 200 with <code>{'{"status":"ok"}'}</code>.</p>
    </>
  );
}

export default Installation;
