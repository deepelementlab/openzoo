function QuickStart() {
  return (
    <>
      <h1>Quick Start</h1>
      <p>Get OpenZoo running in under 5 minutes.</p>

      <h2>Prerequisites</h2>
      <ul>
        <li>Go 1.22+</li>
        <li>Node.js 20+ and pnpm 9+</li>
        <li>Git</li>
      </ul>

      <h2>1. Clone the Repository</h2>
      <pre><code>git clone https://github.com/openzoo/openzoo.git
cd openzoo</code></pre>

      <h2>2. Start the Backend</h2>
      <pre><code>cd server
go run ./cmd/openzoo serve --http :8080</code></pre>
      <p>The server starts on <code>http://localhost:8080</code> with an embedded SQLite database.</p>

      <h2>3. Start the Frontend</h2>
      <pre><code>cd apps/web-vite
pnpm install
pnpm dev</code></pre>
      <p>The web app starts on <code>http://localhost:3000</code> and proxies API requests to the backend.</p>

      <h2>4. Create Your First Workspace</h2>
      <ol>
        <li>Open <code>http://localhost:3000</code> in your browser</li>
        <li>Sign in with your email (verification code authentication)</li>
        <li>Create a new workspace</li>
        <li>Create your first issue</li>
      </ol>

      <h2>5. Connect an Agent (Optional)</h2>
      <pre><code>openzoo setup --server http://localhost:8080
openzoo login --email your@email.com</code></pre>
      <p>This configures the CLI to communicate with your local server and authenticates.</p>

      <h2>Next Steps</h2>
      <ul>
        <li>Read the <a href="/docs/architecture">Architecture Overview</a> to understand the system design</li>
        <li>Configure <a href="/docs/agents">Agent Integration</a> for your preferred coding agent</li>
        <li>Set up <a href="/docs/deployment">Production Deployment</a> with Docker</li>
      </ul>
    </>
  );
}

export default QuickStart;
