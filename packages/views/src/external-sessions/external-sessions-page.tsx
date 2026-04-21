import React, { useState, useRef, useEffect, useCallback } from "react";
import { useWorkspaceStore, getToken, getApiClient, listAgents } from "@openzoo/core";
import { useExternalSessions, useDiscoverExternalSessions, useAdoptExternalSession, useReleaseExternalSession } from "@openzoo/core";
import { Button, Badge, EmptyState, Spinner, Card, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@openzoo/ui";
import { toast } from "@openzoo/ui";

const STATUS_COLORS: Record<string, string> = {
  discovered: "bg-blue-100 text-blue-700",
  monitoring: "bg-green-100 text-green-700",
  adopted: "bg-purple-100 text-purple-700",
  lost: "bg-gray-100 text-gray-500",
};

const STATUS_DOT: Record<string, string> = {
  discovered: "bg-blue-500",
  monitoring: "bg-green-500",
  adopted: "bg-purple-500",
  lost: "bg-gray-400",
};

interface ExternalSession {
  id: string;
  workspace_id: string;
  agent_id: string | null;
  session_id: string;
  pid: number;
  process_cwd: string;
  claude_version: string;
  session_file_path: string;
  status: string;
  discovered_at: string;
  last_seen_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function ExternalSessionsPage() {
  const wsId = useWorkspaceStore((s) => s.currentWorkspace?.id);
  const { data: sessions = [], isLoading, refetch } = useExternalSessions(wsId ?? "");
  const discover = useDiscoverExternalSessions();
  const adopt = useAdoptExternalSession();
  const release = useReleaseExternalSession();

  const [adoptTarget, setAdoptTarget] = useState<ExternalSession | null>(null);
  const [adoptAgentId, setAdoptAgentId] = useState("");
  const [availableAgents, setAvailableAgents] = useState<Array<{ id: string; name: string }>>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [monitorSession, setMonitorSession] = useState<ExternalSession | null>(null);

  const handleDiscover = async () => {
    if (!wsId) return;
    try {
      const result = await discover.mutateAsync(wsId);
      toast({
        title: "Discovery complete",
        description: `Found ${result.sessions} sessions, ${result.processes} processes, ${result.total} discovered`,
      });
    } catch (e: any) {
      toast({ title: "Discovery failed", description: e.message, variant: "destructive" });
    }
  };

  const handleAdoptConfirm = async () => {
    if (!adoptTarget || !adoptAgentId.trim()) return;
    try {
      await adopt.mutateAsync({ id: adoptTarget.id, agentId: adoptAgentId.trim() });
      toast({ title: "Session adopted", description: `Session ${adoptTarget.session_id.slice(0, 8)} is now adopted` });
      setAdoptTarget(null);
      setAdoptAgentId("");
      refetch();
    } catch (e: any) {
      toast({ title: "Failed to adopt", description: e.message, variant: "destructive" });
    }
  };

  const handleRelease = async (session: ExternalSession) => {
    if (!session.id) return;
    try {
      await release.mutateAsync(session.id);
      toast({ title: "Session released" });
      refetch();
    } catch (e: any) {
      toast({ title: "Failed to release", description: e.message, variant: "destructive" });
    }
  };

  const loadAgents = async () => {
    if (!wsId) return;
    setAgentsLoading(true);
    try {
      const agents = await listAgents(wsId);
      setAvailableAgents(agents.map((a: any) => ({ id: a.id, name: a.name })));
    } catch {
      setAvailableAgents([]);
    }
    setAgentsLoading(false);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">External Sessions</h1>
          <p className="text-sm text-muted-foreground">Manage Claude Code instances running outside OpenZoo</p>
        </div>
        <Button onClick={handleDiscover} disabled={discover.isPending || !wsId}>
          {discover.isPending ? <Spinner size="sm" /> : "Discover Claude"}
        </Button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title="No external sessions"
          description="Start a Claude Code instance in PowerShell, then click Discover to find it"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s: ExternalSession) => (
            <Card key={s.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[s.status] ?? "bg-gray-400"}`} />
                  <h3 className="font-semibold text-sm">{s.session_id.slice(0, 8)}</h3>
                </div>
                <Badge className={STATUS_COLORS[s.status] ?? ""}>
                  {s.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {s.pid > 0 && <p>PID: <span className="text-foreground">{s.pid}</span></p>}
                {(s.metadata as any)?.model && <p>Model: <span className="text-foreground">{(s.metadata as any).model}</span></p>}
                {s.process_cwd && (
                  <p className="text-xs truncate" title={s.process_cwd}>CWD: {s.process_cwd}</p>
                )}
                {(s.metadata as any)?.confidence != null && (
                  <p>Confidence: <span className="text-foreground">{((s.metadata.confidence as number) * 100).toFixed(0)}%</span></p>
                )}
                <p className="text-xs">Discovered: <span className="text-foreground">{new Date(s.discovered_at).toLocaleString()}</span></p>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t">
                {s.status === "discovered" && (
                  <>
                    <Button size="sm" onClick={() => { setAdoptTarget(s); setAdoptAgentId(""); loadAgents(); }} className="flex-1">Adopt</Button>
                    <Button size="sm" variant="outline" onClick={() => setMonitorSession(s)} className="flex-1">Monitor</Button>
                  </>
                )}
                {s.status === "monitoring" && (
                  <>
                    <Button size="sm" onClick={() => { setAdoptTarget(s); setAdoptAgentId(""); }} className="flex-1">Adopt</Button>
                    <Button size="sm" variant="outline" onClick={() => setMonitorSession(s)} className="flex-1">View</Button>
                    <Button size="sm" variant="outline" onClick={() => handleRelease(s)} className="flex-1">Release</Button>
                  </>
                )}
                {s.status === "adopted" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setMonitorSession(s)} className="flex-1">View</Button>
                    <Button size="sm" variant="outline" onClick={() => handleRelease(s)} className="flex-1">Release</Button>
                  </>
                )}
                {s.status === "lost" && (
                  <p className="text-xs text-muted-foreground italic w-full text-center">Session no longer active</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={adoptTarget !== null} onOpenChange={(open) => { if (!open) setAdoptTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adopt External Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Session: <span className="text-foreground font-mono">{adoptTarget?.session_id?.slice(0, 8)}</span>
              {adoptTarget?.process_cwd && <><br />CWD: <span className="text-foreground font-mono text-xs">{adoptTarget.process_cwd}</span></>}
            </p>
            <div className="space-y-1">
              <label className="text-sm font-medium">Select Agent</label>
              {agentsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner size="sm" /> Loading agents...</div>
              ) : availableAgents.length === 0 ? (
                <p className="text-sm text-destructive">No agents available. Create an agent first.</p>
              ) : (
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={adoptAgentId}
                  onChange={(e) => setAdoptAgentId(e.target.value)}
                >
                  <option value="">-- Select an agent --</option>
                  {availableAgents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.id.slice(0, 8)})</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdoptTarget(null)}>Cancel</Button>
            <Button onClick={handleAdoptConfirm} disabled={!adoptAgentId.trim() || adopt.isPending}>
              {adopt.isPending ? <Spinner size="sm" /> : "Adopt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {monitorSession && (
        <StreamMonitorDialog
          session={monitorSession}
          onClose={() => setMonitorSession(null)}
        />
      )}
    </div>
  );
}

function StreamMonitorDialog({ session, onClose }: { session: ExternalSession; onClose: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const startStream = useCallback(() => {
    const abort = new AbortController();
    abortRef.current = abort;
    setLines([]);
    setError(null);
    setConnected(false);

    const token = getToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch(`${getApiClient().baseUrl}/rpc/daemon/external/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify({ id: session.id }),
      signal: abort.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setConnected(true);
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No readable stream");
        const decoder = new TextDecoder();
        let buffer = "";

        function pump(): Promise<void> {
          return reader.read().then(({ done, value }) => {
            if (done) return;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split("\n");
            buffer = parts.pop() || "";
            for (const part of parts) {
              const trimmed = part.trim();
              if (!trimmed) continue;
              if (trimmed.startsWith("data: ")) {
                const data = trimmed.slice(6);
                try {
                  const parsed = JSON.parse(data);
                  const text = parsed.content || parsed.text || parsed.message || JSON.stringify(parsed);
                  setLines((prev) => [...prev.slice(-500), text]);
                } catch {
                  setLines((prev) => [...prev.slice(-500), data]);
                }
              } else if (trimmed.startsWith("event: ")) {
                const eventType = trimmed.slice(7);
                if (eventType === "error" || eventType === "end") {
                  setConnected(false);
                }
              }
            }
            return pump();
          });
        }
        return pump();
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setConnected(false);
        }
      });
  }, [session.id]);

  useEffect(() => {
    startStream();
    return () => { abortRef.current?.abort(); };
  }, [startStream]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) { abortRef.current?.abort(); onClose(); } }}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-green-500" : "bg-gray-400"}`} />
            Session {session.session_id.slice(0, 8)}
            {connected && <span className="text-xs text-muted-foreground font-normal">Live</span>}
          </DialogTitle>
        </DialogHeader>
        <div
          ref={scrollRef}
          className="bg-gray-950 text-green-400 rounded-md p-4 font-mono text-xs h-96 overflow-y-auto whitespace-pre-wrap"
        >
          {error && <div className="text-red-400 mb-2">Error: {error}</div>}
          {lines.length === 0 && !error && (
            <div className="text-gray-500 italic">{connected ? "Waiting for output..." : "Connecting..."}</div>
          )}
          {lines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => { abortRef.current?.abort(); startStream(); }}>
            Reconnect
          </Button>
          <Button variant="outline" size="sm" onClick={() => { abortRef.current?.abort(); onClose(); }}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
