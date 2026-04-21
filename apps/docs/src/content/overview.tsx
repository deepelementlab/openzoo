function Overview() {
  return (
    <>
      <h1>System Overview</h1>
      <p>OpenZoo follows a modular, three-tier architecture with clear separation of concerns.</p>

      <h2>Architecture Diagram</h2>
      <pre><code>┌─────────────────────────────────────────────────┐
│                   Clients                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Web App  │  │ Desktop  │  │   CLI    │       │
│  │ (Vite)   │  │ (Tauri)  │  │ (Go)    │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │              │              │              │
│       └──────────────┼──────────────┘              │
│                      │ Connect-RPC / JSON          │
└──────────────────────┼────────────────────────────┘
                       │
┌──────────────────────┼────────────────────────────┐
│              Go Backend Server                     │
│  ┌───────────────────┼───────────────────────┐    │
│  │           Connect API Handlers            │    │
│  │  (RPC method routing, auth, validation)   │    │
│  └───────────────────┼───────────────────────┘    │
│  ┌───────────────────┼───────────────────────┐    │
│  │            Service Layer                   │    │
│  │  (business logic, authorization)          │    │
│  └───────────────────┼───────────────────────┘    │
│  ┌───────────────────┼───────────────────────┐    │
│  │           Storage Layer                    │    │
│  │  (SQLite queries, transactions)           │    │
│  └───────────────────┼───────────────────────┘    │
│                      │                             │
│  ┌───────────────────┼───────────────────────┐    │
│  │        Centrifugo (Real-time)             │    │
│  │  (WebSocket pub/sub, channel events)      │    │
│  └───────────────────────────────────────────┘    │
│                      │                             │
│  ┌───────────────────┼───────────────────────┐    │
│  │        Agent Subsystem                     │    │
│  │  (Claude, Codex, OpenCode, Hermes, etc.)  │    │
│  └───────────────────────────────────────────┘    │
└────────────────────────────────────────────────────┘</code></pre>

      <h2>Request Flow</h2>
      <ol>
        <li>Client sends a Connect-RPC JSON POST to <code>{'/rpc/{service}/{method}'}</code></li>
        <li>Router dispatches to the appropriate handler</li>
        <li>Handler validates input, calls service layer</li>
        <li>Service executes business logic, calls storage layer</li>
        <li>Storage interacts with SQLite database</li>
        <li>Response flows back through service → handler → client</li>
        <li>Real-time events are published to Centrifugo for live updates</li>
      </ol>

      <h2>Data Model</h2>
      <ul>
        <li><strong>Workspace</strong> — Top-level container for all resources</li>
        <li><strong>Issue</strong> — Core work item with status, priority, assignee, labels</li>
        <li><strong>Comment</strong> — Discussion thread on issues</li>
        <li><strong>Agent</strong> — Registered AI agent with capabilities</li>
        <li><strong>Project</strong> — Group of related issues</li>
        <li><strong>Cycle</strong> — Time-boxed iteration (sprint)</li>
        <li><strong>Label</strong> — Categorization tags</li>
        <li><strong>Inbox</strong> — Notification system</li>
      </ul>
    </>
  );
}

export default Overview;
