function ApiProtocol() {
  return (
    <>
      <h1>API Protocol (Connect-RPC)</h1>
      <p>OpenZoo uses Connect-RPC with JSON encoding for type-safe API communication.</p>

      <h2>Why Connect-RPC?</h2>
      <ul>
        <li><strong>Type Safety</strong> — Protobuf definitions generate both Go and TypeScript types</li>
        <li><strong>Code Generation</strong> — <code>buf generate</code> produces client/server stubs</li>
        <li><strong>JSON Support</strong> — Human-readable JSON encoding (no binary protobuf on the wire)</li>
        <li><strong>Streaming</strong> — Server-streaming for agent events</li>
        <li><strong>Error Types</strong> — Structured error codes with rich detail</li>
      </ul>

      <h2>Protocol Details</h2>
      <p>All RPC calls are HTTP POST requests to <code>{'/rpc/{service}/{method}'}</code>:</p>
      <pre><code>{`POST /rpc/issue/create HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token>
X-Workspace-ID: <workspace-id>

{"title": "Fix login bug", "description": "...", "priority": "HIGH"}`}</code></pre>

      <h2>Protobuf Definitions</h2>
      <p>9 proto files define the complete API surface:</p>
      <table>
        <thead>
          <tr><th>Proto File</th><th>Service</th><th>Methods</th></tr>
        </thead>
        <tbody>
          <tr><td>issue.proto</td><td>IssueService</td><td>Create, Get, List, Update, Delete, React</td></tr>
          <tr><td>comment.proto</td><td>CommentService</td><td>Create, List, Update, Delete</td></tr>
          <tr><td>agent.proto</td><td>AgentService</td><td>Register, List, Get, Run</td></tr>
          <tr><td>project.proto</td><td>ProjectService</td><td>Create, List, Get, Update</td></tr>
          <tr><td>workspace.proto</td><td>WorkspaceService</td><td>Create, List, Get, Update</td></tr>
          <tr><td>auth.proto</td><td>AuthService</td><td>SendCode, VerifyCode, GetCurrentUser</td></tr>
          <tr><td>runtime.proto</td><td>RuntimeService</td><td>Register, List, Ping, GetUsage</td></tr>
          <tr><td>inbox.proto</td><td>InboxService</td><td>List, MarkRead, Archive</td></tr>
          <tr><td>label.proto</td><td>LabelService</td><td>Create, List, Update, Delete</td></tr>
        </tbody>
      </table>

      <h2>Error Handling</h2>
      <pre><code>{`{
  "code": "not_found",
  "message": "Issue not found",
  "details": [{"issue_id": "123"}]
}`}</code></pre>
      <p>Common error codes: <code>invalid_argument</code>, <code>not_found</code>, <code>permission_denied</code>, <code>unauthenticated</code>, <code>internal</code>.</p>
    </>
  );
}

export default ApiProtocol;
