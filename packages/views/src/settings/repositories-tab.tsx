import React, { useState, useEffect } from "react";
import { useWorkspaceStore, getApiClient } from "@openzoo/core";
import { Button, Card, Input, Badge, Spinner } from "@openzoo/ui";

type Repo = {
  id: string;
  name: string;
  url: string;
  branch: string;
  provider: string;
  status: string;
  last_synced: string | null;
};

const PROVIDER_COLORS: Record<string, string> = { github: "bg-gray-800", gitlab: "bg-orange-500", bitbucket: "bg-blue-500" };
const STATUS_COLORS: Record<string, string> = { connected: "bg-green-100 text-green-700", syncing: "bg-yellow-100 text-yellow-700", error: "bg-red-100 text-red-700" };

async function listRepos(workspaceId: string): Promise<Repo[]> {
  const resp = await getApiClient().call<{ repos: Repo[] }>("/rpc/workspace/repos", { workspace_id: workspaceId });
  return resp.repos ?? [];
}

async function addRepo(workspaceId: string, url: string, branch: string): Promise<Repo> {
  return getApiClient().call<Repo>("/rpc/workspace/add-repo", { workspace_id: workspaceId, url, branch });
}

async function removeRepo(workspaceId: string, repoId: string): Promise<void> {
  await getApiClient().call("/rpc/workspace/remove-repo", { workspace_id: workspaceId, repo_id: repoId });
}

async function syncRepo(workspaceId: string, repoId: string): Promise<void> {
  await getApiClient().call("/rpc/workspace/sync-repo", { workspace_id: workspaceId, repo_id: repoId });
}

export function RepositoriesTab() {
  const wsId = useWorkspaceStore((s) => s.currentWorkspace?.id);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newBranch, setNewBranch] = useState("main");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!wsId) return;
    setLoading(true);
    listRepos(wsId)
      .then(setRepos)
      .catch(() => setRepos([]))
      .finally(() => setLoading(false));
  }, [wsId]);

  const handleAdd = async () => {
    if (!newUrl.trim() || !wsId) return;
    setSaving(true);
    try {
      const repo = await addRepo(wsId, newUrl, newBranch);
      setRepos((prev) => [...prev, repo]);
      setNewUrl("");
      setNewBranch("main");
      setShowAdd(false);
    } catch (err) {
      console.error("Failed to add repo:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!wsId) return;
    try {
      await removeRepo(wsId, id);
      setRepos((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to remove repo:", err);
    }
  };

  const handleSync = async (id: string) => {
    if (!wsId) return;
    setRepos((prev) => prev.map((r) => r.id === id ? { ...r, status: "syncing" } : r));
    try {
      await syncRepo(wsId, id);
      setRepos((prev) => prev.map((r) => r.id === id ? { ...r, status: "connected", last_synced: new Date().toISOString() } : r));
    } catch (err) {
      setRepos((prev) => prev.map((r) => r.id === id ? { ...r, status: "error" } : r));
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Spinner /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Repositories</h3>
          <p className="text-sm text-muted-foreground">Connected code repositories for agents to access</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>Add Repository</Button>
      </div>

      {showAdd && (
        <Card className="p-4 space-y-3">
          <h4 className="text-sm font-medium">Connect Repository</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Repository URL</label>
              <Input value={newUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUrl(e.target.value)} placeholder="https://github.com/org/repo" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Branch</label>
              <Input value={newBranch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBranch(e.target.value)} placeholder="main" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowAdd(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving || !newUrl.trim()}>
              {saving ? <Spinner size="sm" /> : "Connect"}
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {repos.map((repo) => (
          <Card key={repo.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-sm ${PROVIDER_COLORS[repo.provider] ?? "bg-gray-400"}`} />
                  <span className="text-sm font-medium">{repo.name}</span>
                  <Badge className={STATUS_COLORS[repo.status] ?? ""}>
                    {repo.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono truncate max-w-md">{repo.url}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Branch: <code className="bg-muted px-1 rounded">{repo.branch}</code></span>
                  {repo.last_synced && <span>Last synced: {new Date(repo.last_synced).toLocaleString()}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleSync(repo.id)} disabled={repo.status === "syncing"}>
                  {repo.status === "syncing" ? <Spinner size="sm" /> : "Sync"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleRemove(repo.id)}>Remove</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {repos.length === 0 && !showAdd && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No repositories connected</p>
          <Button variant="link" onClick={() => setShowAdd(true)} className="text-sm">Add your first repository</Button>
        </div>
      )}

      <div className="p-3 rounded-md border bg-muted/20 text-xs text-muted-foreground space-y-1">
        <p className="font-medium">Supported Providers</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>GitHub (Personal Access Token or OAuth)</li>
          <li>GitLab (Personal Access Token)</li>
          <li>Bitbucket (App Password)</li>
        </ul>
      </div>
    </div>
  );
}
