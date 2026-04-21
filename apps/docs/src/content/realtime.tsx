function Realtime() {
  return (
    <>
      <h1>Realtime Communication</h1>
      <p>OpenZoo uses Centrifugo for WebSocket-based real-time updates.</p>

      <h2>Architecture</h2>
      <pre><code>{`Backend (Go) → Centrifugo API → WebSocket → Frontend (Centrifuge JS)`}</code></pre>

      <h2>Channel Structure</h2>
      <p>Events are scoped to workspaces using channel names:</p>
      <pre><code>{`workspace:{workspaceId}  — All events for a workspace`}</code></pre>

      <h2>Event Types</h2>
      <table>
        <thead>
          <tr><th>Event</th><th>Trigger</th><th>Client Action</th></tr>
        </thead>
        <tbody>
          <tr><td><code>issue_changed</code></td><td>Issue created/updated/deleted</td><td>Invalidate issue queries</td></tr>
          <tr><td><code>task_changed</code></td><td>Agent task status update</td><td>Invalidate task queries</td></tr>
          <tr><td><code>inbox_changed</code></td><td>New notification</td><td>Invalidate inbox queries</td></tr>
          <tr><td><code>comment_changed</code></td><td>Comment added/updated</td><td>Invalidate comment queries</td></tr>
        </tbody>
      </table>

      <h2>Client-Side Integration</h2>
      <p>The <code>attachRealtimeSync</code> function from <code>@openzoo/core</code> handles connection lifecycle:</p>
      <pre><code>{`import { attachRealtimeSync } from "@openzoo/core";

const disconnect = attachRealtimeSync(workspaceId, {
  onIssueChanged: () => queryClient.invalidateQueries({ queryKey: ["issues"] }),
  onTaskChanged: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  onInboxChanged: () => queryClient.invalidateQueries({ queryKey: ["inbox"] }),
});

disconnect(); // Clean up on unmount`}</code></pre>

      <h2>Automatic Reconnection</h2>
      <p>
        Centrifugo&apos;s client library handles automatic reconnection with exponential backoff.
        When the connection is restored, the client automatically re-subscribes to channels
        and the server publishes a &quot;refresh&quot; event.
      </p>

      <h2>Configuration</h2>
      <pre><code>{`# Server environment variables
OPENZOO_CENTRIFUGO_URL=http://localhost:8000/api
OPENZOO_CENTRIFUGO_API_KEY=your-api-key
OPENZOO_CENTRIFUGO_TOKEN_HMAC_SECRET_KEY=your-secret`}</code></pre>
    </>
  );
}

export default Realtime;
