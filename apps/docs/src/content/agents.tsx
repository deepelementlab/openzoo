function Agents() {
  return (
    <>
      <h1>Agent Integration</h1>
      <p>OpenZoo supports multiple AI coding agents as first-class team members.</p>

      <h2>Supported Agents</h2>

      <h3>Claude (Anthropic)</h3>
      <p>Integrates with the Claude Code CLI for autonomous coding tasks.</p>
      <pre><code>{`openzoo config set agent.type claude`}</code></pre>
      <ul>
        <li>Structured JSON input with issue context</li>
        <li>MCP (Model Context Protocol) config support</li>
        <li>Permission mode: <code>bypassPermissions</code> for autonomous operation</li>
      </ul>

      <h3>Codex (OpenAI)</h3>
      <p>OpenAI&apos;s Codex CLI agent for code generation and review.</p>
      <pre><code>{`openzoo config set agent.type codex`}</code></pre>

      <h3>OpenCode</h3>
      <p>A versatile open-source coding agent.</p>
      <pre><code>{`openzoo config set agent.type opencode`}</code></pre>
      <ul>
        <li>Step-based event streaming</li>
        <li>Cache token tracking</li>
        <li>Environment variable configuration</li>
      </ul>

      <h3>Hermes (ACP)</h3>
      <p>Uses the Agent Communication Protocol (ACP) — JSON-RPC 2.0 over stdin/stdout.</p>
      <pre><code>{`openzoo config set agent.type hermes`}</code></pre>
      <ul>
        <li>Full bidirectional communication</li>
        <li>Capability discovery</li>
        <li>Event streaming with progress updates</li>
      </ul>

      <h3>OpenClaw</h3>
      <p>Agent with stderr-based JSON event output.</p>
      <pre><code>{`openzoo config set agent.type openclaw`}</code></pre>

      <h3>ClawCode</h3>
      <p>An open-source AI coding assistant CLI supporting 200+ LLM models with multi-role team orchestration.</p>
      <pre><code>{`openzoo config set agent.type clawcode`}</code></pre>
      <ul>
        <li>Non-interactive JSON output mode (<code>-f json</code>)</li>
        <li>200+ LLM models via OpenAI-compatible, Anthropic, and Gemini APIs</li>
        <li>44 built-in tools (file I/O, shell, search, browser automation, sub-agents)</li>
        <li>Multi-role team orchestration with experience-based learning</li>
      </ul>

      <h3>StormClaw</h3>
      <p>A self-hostable Rust-first personal AI assistant with pluggable communication channels.</p>
      <pre><code>{`openzoo config set agent.type stormclaw`}</code></pre>
      <ul>
        <li>Rust + Tokio async runtime for high performance</li>
        <li>Pluggable channels (Telegram, WhatsApp, Discord, Slack, Email)</li>
        <li>OpenAI-compatible LLM provider abstraction</li>
        <li>Session management with hot-reload configuration</li>
      </ul>

      <h2>Agent Lifecycle</h2>
      <pre><code>{`1. Register → Agent appears in workspace
2. Assign → Create task from issue
3. Run    → Agent executes (streams events)
4. Report → Agent submits results
5. Review → Human reviews and approves`}</code></pre>

      <h2>Event Streaming</h2>
      <p>All agents emit a unified set of events:</p>
      <table>
        <thead>
          <tr><th>Event</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>step</code></td><td>Agent started a new step</td></tr>
          <tr><td><code>output</code></td><td>Text output from the agent</td></tr>
          <tr><td><code>error</code></td><td>Error encountered</td></tr>
          <tr><td><code>done</code></td><td>Task completed</td></tr>
          <tr><td><code>tool_use</code></td><td>Agent used a tool (file read/write, search)</td></tr>
        </tbody>
      </table>

      <h2>Adding a Custom Agent</h2>
      <p>Implement the <code>Agent</code> interface in <code>server/pkg/agent/</code>:</p>
      <pre><code>{`type Agent interface {
  Run(ctx context.Context, msg Message) (<-chan Event, error)
  IsAvailable() bool
  DetectVersion(ctx context.Context) (string, error)
}`}</code></pre>
    </>
  );
}

export default Agents;
