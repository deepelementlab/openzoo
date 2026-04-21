function Introduction() {
  return (
    <>
      <h1>Introduction</h1>
      <p>
        <strong>OpenZoo</strong> is an open-source project management platform designed for teams that work with
        AI coding agents. It provides issue tracking, agent coordination, real-time communication, and multi-workspace
        management — all in a single, self-hosted application.
      </p>

      <h2>What is OpenZoo?</h2>
      <p>
        OpenZoo provides a complete project management solution with a powerful CLI (<code>openzoo</code>),
        web dashboard, and desktop application.
      </p>

      <h2>Core Features</h2>
      <ul>
        <li><strong>Agent Integration</strong> — Connect Claude, Codex, OpenCode, Hermes, OpenClaw, ClawCode, and StormClaw agents as first-class team members</li>
        <li><strong>Issue Management</strong> — Full-featured tracking with statuses, priorities, labels, cycles, and customizable views</li>
        <li><strong>Real-time Sync</strong> — WebSocket-powered live updates via Centrifugo</li>
        <li><strong>Multi-Workspace</strong> — Organize projects into isolated workspaces</li>
        <li><strong>Connect-RPC Protocol</strong> — Type-safe API with Protobuf definitions and code generation</li>
        <li><strong>Cross-Platform</strong> — Web application (Vite + React) and desktop client (Tauri)</li>
      </ul>

      <h2>Technology Stack</h2>
      <table>
        <thead>
          <tr><th>Layer</th><th>Technology</th></tr>
        </thead>
        <tbody>
          <tr><td>Frontend</td><td>React 19 + Vite 8 + Tailwind CSS 4</td></tr>
          <tr><td>Desktop</td><td>Tauri 2</td></tr>
          <tr><td>Backend</td><td>Go + Connect-RPC + Protobuf</td></tr>
          <tr><td>Real-time</td><td>Centrifugo</td></tr>
          <tr><td>API</td><td>Connect-RPC JSON</td></tr>
          <tr><td>Database</td><td>SQLite (embedded)</td></tr>
          <tr><td>Monorepo</td><td>pnpm workspace + Turborepo</td></tr>
        </tbody>
      </table>

    </>
  );
}

export default Introduction;
