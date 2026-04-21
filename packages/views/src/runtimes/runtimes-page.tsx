import React, { useState, useCallback } from "react";
import { useWorkspaceStore, useRuntimes, useRegisterRuntime, useDeleteRuntime, useRuntimeUsage } from "@openzoo/core";
import { startEmbeddedDaemon, stopEmbeddedDaemon, getEmbeddedDaemonStatus } from "@openzoo/core";
import { Button, Badge, EmptyState, Spinner, Card, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Textarea } from "@openzoo/ui";
import { toast } from "@openzoo/ui";
import type { RuntimeDevice } from "@openzoo/core";

const STATUS_COLORS: Record<string, string> = {
  online: "bg-green-100 text-green-700",
  offline: "bg-gray-100 text-gray-500",
  error: "bg-red-100 text-red-700",
  busy: "bg-yellow-100 text-yellow-700",
};

const STATUS_DOT: Record<string, string> = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  error: "bg-red-500",
  busy: "bg-yellow-500",
};

function UsageChart({ data }: { data: unknown[] }) {
  if (!data || data.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No usage data</p>;
  }
  const points = (data as any[]).slice(0, 7).reverse();
  const maxVal = Math.max(...points.map((p: any) => (p.input_tokens || 0) + (p.output_tokens || 0)), 1);

  return (
    <div className="flex items-end gap-1 h-16 mt-2">
      {points.map((p: any, i: number) => {
        const total = (p.input_tokens || 0) + (p.output_tokens || 0);
        const height = Math.max((total / maxVal) * 100, 5);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full bg-primary/20 rounded-t" style={{ height: `${height}%` }} />
            <span className="text-[9px] text-muted-foreground">{p.date?.slice(5) ?? ""}</span>
          </div>
        );
      })}
    </div>
  );
}

export function RuntimesPage() {
  const wsId = useWorkspaceStore((s) => s.currentWorkspace?.id);
  const { data: runtimes = [], isLoading, refetch } = useRuntimes(wsId ?? "");
  const registerRuntime = useRegisterRuntime();
  const deleteRuntime = useDeleteRuntime();
  const [showRegister, setShowRegister] = useState(false);
  const [selectedRuntime, setSelectedRuntime] = useState<RuntimeDevice | null>(null);

  const { data: usageData = [] } = useRuntimeUsage(
    wsId ?? "",
    selectedRuntime?.id ?? "",
    7,
  );

  const [regName, setRegName] = useState("");
  const [regProvider, setRegProvider] = useState("openai");
  const [regMode, setRegMode] = useState<"local" | "cloud">("local");

  const handleRegister = async () => {
    if (!wsId || !regName.trim()) return;
    await registerRuntime.mutateAsync({
      workspace_id: wsId,
      name: regName.trim(),
      provider: regProvider,
      runtime_mode: regMode,
    });
    setRegName("");
    setShowRegister(false);
    refetch();
  };

  const handleDelete = async (runtimeId: string) => {
    if (!wsId) return;
    await deleteRuntime.mutateAsync({ workspaceId: wsId, runtimeId });
    refetch();
  };

  const [daemonStatus, setDaemonStatus] = useState<{ running: boolean; runtime_id?: string } | null>(null);
  const [daemonLoading, setDaemonLoading] = useState(false);

  const checkDaemonStatus = useCallback(async () => {
    if (!wsId) return;
    try {
      const status = await getEmbeddedDaemonStatus(wsId);
      setDaemonStatus(status as any);
    } catch { setDaemonStatus({ running: false }); }
  }, [wsId]);

  React.useEffect(() => { checkDaemonStatus(); }, [checkDaemonStatus]);

  const handleStartDaemon = async () => {
    if (!wsId) return;
    setDaemonLoading(true);
    try {
      await startEmbeddedDaemon({ workspace_id: wsId, provider: "claude" });
      toast({ title: "Daemon started", description: "Embedded daemon is now running and will claim tasks automatically." });
      await checkDaemonStatus();
      refetch();
    } catch (e: any) {
      toast({ title: "Failed to start daemon", description: e.message, variant: "destructive" });
    } finally { setDaemonLoading(false); }
  };

  const handleStopDaemon = async () => {
    if (!wsId) return;
    setDaemonLoading(true);
    try {
      await stopEmbeddedDaemon(wsId);
      toast({ title: "Daemon stopped" });
      setDaemonStatus({ running: false });
      refetch();
    } catch (e: any) {
      toast({ title: "Failed to stop daemon", description: e.message, variant: "destructive" });
    } finally { setDaemonLoading(false); }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Runtimes</h1>
          <p className="text-sm text-muted-foreground">Manage AI model providers and runtime devices</p>
        </div>
        <Button onClick={() => setShowRegister(true)}>Register Runtime</Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${daemonStatus?.running ? "bg-green-500" : "bg-gray-400"}`} />
            <div>
              <h3 className="font-semibold text-sm">Embedded Daemon</h3>
              <p className="text-xs text-muted-foreground">
                {daemonStatus?.running
                  ? `Running (Runtime: ${(daemonStatus as any)?.runtime_id?.slice(0, 8) ?? "..."})`
                  : "Not running — Start the daemon to automatically process tasks"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {daemonStatus?.running ? (
              <Button variant="outline" size="sm" onClick={handleStopDaemon} disabled={daemonLoading}>
                {daemonLoading ? <Spinner size="sm" /> : "Stop Daemon"}
              </Button>
            ) : (
              <Button size="sm" onClick={handleStartDaemon} disabled={daemonLoading}>
                {daemonLoading ? <Spinner size="sm" /> : "▶ Start Daemon"}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={checkDaemonStatus}>↻</Button>
          </div>
        </div>
      </Card>

      {runtimes.length === 0 ? (
        <EmptyState
          title="No runtimes"
          description="Register a runtime device to start running agents"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {runtimes.map((rt: RuntimeDevice) => (
            <Card
              key={rt.id}
              className="p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedRuntime(rt)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[rt.status] ?? "bg-gray-400"}`} />
                  <h3 className="font-semibold">{rt.name}</h3>
                </div>
                <Badge className={STATUS_COLORS[rt.status] ?? ""}>
                  {rt.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Provider: <span className="text-foreground capitalize">{rt.provider}</span></p>
                <p>Mode: <span className="text-foreground capitalize">{rt.runtime_mode}</span></p>
                {rt.last_seen_at && (
                  <p>Last seen: <span className="text-foreground">{new Date(rt.last_seen_at).toLocaleString()}</span></p>
                )}
                {rt.device_info && (
                  <p className="text-xs truncate" title={rt.device_info}>Device: {rt.device_info}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedRuntime && (
        <Dialog open onOpenChange={(open) => !open && setSelectedRuntime(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Runtime Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${STATUS_DOT[selectedRuntime.status]}`} />
                <span className="font-semibold">{selectedRuntime.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Provider:</span>
                  <p className="font-medium capitalize">{selectedRuntime.provider}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Mode:</span>
                  <p className="font-medium capitalize">{selectedRuntime.runtime_mode}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium">{selectedRuntime.status}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p className="font-medium">{new Date(selectedRuntime.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              {selectedRuntime.device_info && (
                <div>
                  <span className="text-muted-foreground text-sm">Device Info:</span>
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap">
                    {selectedRuntime.device_info}
                  </pre>
                </div>
              )}

              <div>
                <span className="text-muted-foreground text-sm">Usage (Last 7 days)</span>
                <UsageChart data={usageData} />
              </div>

              <DialogFooter>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(selectedRuntime.id)}
                  disabled={deleteRuntime.isPending}
                >
                  {deleteRuntime.isPending ? "Deleting..." : "Delete"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedRuntime(null)}>Close</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showRegister} onOpenChange={(open) => !open && setShowRegister(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register Runtime</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <Input value={regName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegName(e.target.value)} placeholder="My Runtime" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Provider</label>
              <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={regProvider} onChange={(e) => setRegProvider(e.target.value)}>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="google">Google (Gemini)</option>
                <option value="openrouter">OpenRouter</option>
                <option value="ollama">Ollama (Local)</option>
                <option value="lmstudio">LM Studio</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Mode</label>
              <div className="flex gap-3">
                <button className={`flex-1 px-3 py-2 rounded-md text-sm border ${regMode === "local" ? "bg-accent border-primary" : "border-input"}`} onClick={() => setRegMode("local")}>Local</button>
                <button className={`flex-1 px-3 py-2 rounded-md text-sm border ${regMode === "cloud" ? "bg-accent border-primary" : "border-input"}`} onClick={() => setRegMode("cloud")}>Cloud</button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegister(false)}>Cancel</Button>
            <Button onClick={handleRegister} disabled={!regName.trim() || registerRuntime.isPending}>
              {registerRuntime.isPending ? <Spinner size="sm" /> : "Register"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
