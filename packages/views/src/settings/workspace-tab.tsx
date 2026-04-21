import React, { useEffect, useState } from "react";
import { useAuthStore, useWorkspaceStore, updateWorkspace, deleteWorkspace } from "@openzoo/core";
import { Input } from "@openzoo/ui";
import { Textarea } from "@openzoo/ui";
import { Button } from "@openzoo/ui";
import { Card } from "@openzoo/ui";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@openzoo/ui";

export function WorkspaceTab() {
  const user = useAuthStore((s) => s.user);
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);

  const [name, setName] = useState(workspace?.name ?? "");
  const [description, setDescription] = useState(workspace?.description ?? "");
  const [context, setContext] = useState(workspace?.context ?? "");
  const [issuePrefix, setIssuePrefix] = useState(workspace?.issue_prefix ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(workspace?.name ?? "");
    setDescription(workspace?.description ?? "");
    setContext(workspace?.context ?? "");
    setIssuePrefix(workspace?.issue_prefix ?? "");
  }, [workspace]);

  const handleSave = async () => {
    if (!workspace) return;
    setSaving(true);
    try {
      const updated = await updateWorkspace(workspace.id, { name, description, context, issue_prefix: issuePrefix });
      setCurrentWorkspace(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Failed to save workspace settings:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!workspace) return;
    setDeleting(true);
    try {
      await deleteWorkspace(workspace.id);
      await loadWorkspaces();
    } catch (e) {
      console.error("Failed to delete workspace:", e);
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  if (!workspace) {
    return <div className="text-muted-foreground text-sm">No workspace selected.</div>;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">General</h2>
        <Card className="p-6 space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Workspace Name</label>
              <Input
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="Workspace name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description ?? ""}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="What is this workspace for?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Issue Prefix</label>
              <Input
                value={issuePrefix}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIssuePrefix(e.target.value)}
                placeholder="e.g. ENG"
                className="max-w-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                Prefix for issue identifiers (e.g. ENG-1, ENG-2)
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Context</label>
              <Textarea
                value={context ?? ""}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContext(e.target.value)}
                placeholder="Additional context for AI agents working in this workspace..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This context is provided to agents to help them understand your workspace.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </Button>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-destructive">Danger Zone</h2>
        <Card className="border-destructive/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete Workspace</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete this workspace and all its data. This action cannot be undone.
              </p>
            </div>
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">Delete Workspace</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Workspace</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete &quot;{workspace.name}&quot;? This will permanently remove all issues, projects, agents, and other data. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                    {deleting ? "Deleting..." : "Delete Workspace"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      </section>
    </div>
  );
}
