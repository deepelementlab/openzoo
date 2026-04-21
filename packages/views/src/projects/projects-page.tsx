﻿import React, { useEffect, useState, useCallback } from "react";
import {
  listProjects, createProject, updateProject, deleteProject,
  listIssues, useWorkspaceStore, attachRealtimeSync,
} from "@openzoo/core";
import type { Project, Issue } from "@openzoo/core";
import { Button, Badge, Card, Input, Textarea, Spinner, EmptyState, Separator } from "@openzoo/ui";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@openzoo/ui";
import { useNavigation } from "../navigation";

const PROJECT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  planned: { label: "Planned", color: "bg-gray-100 text-gray-700" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  paused: { label: "Paused", color: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-500" },
};

const PROJECT_PRIORITY_CONFIG: Record<string, string> = {
  urgent: "text-red-600",
  high: "text-orange-500",
  medium: "text-yellow-500",
  low: "text-blue-500",
  none: "text-gray-400",
};

export function ProjectsPage() {
  const navigation = useNavigation();
  const wsId = useWorkspaceStore((s) => s.currentWorkspace?.id);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [creating, setCreating] = useState(false);

  const loadProjects = useCallback(() => {
    if (!wsId) return;
    setLoading(true);
    listProjects({ workspace_id: wsId })
      .then((res) => setProjects(res.projects ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [wsId]);

  useEffect(() => { loadProjects(); }, [loadProjects]);
  useEffect(() => {
    if (!wsId) return;
    return attachRealtimeSync(wsId, {});
  }, [wsId]);

  const handleCreate = async () => {
    if (!wsId || !newTitle.trim()) return;
    setCreating(true);
    try {
      await createProject({
        workspace_id: wsId,
        title: newTitle,
        description: newDesc || undefined,
        icon: newIcon || undefined,
      });
      setNewTitle("");
      setNewDesc("");
      setNewIcon("");
      setCreateOpen(false);
      loadProjects();
    } catch (e) {
      console.error("Failed to create project:", e);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!wsId) return;
    try {
      await deleteProject(wsId, projectId);
      loadProjects();
      if (selectedProjectId === projectId) setSelectedProjectId(null);
    } catch (e) {
      console.error("Failed to delete project:", e);
    }
  };

  if (!wsId) return <div className="p-8 text-center text-muted-foreground">Select a workspace first</div>;
  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        wsId={wsId}
        onBack={() => setSelectedProjectId(null)}
        onUpdate={async (data) => {
          await updateProject(wsId, selectedProject.id, data);
          loadProjects();
        }}
        onDelete={() => handleDelete(selectedProject.id)}
        onIssueClick={(issueId) => navigation.navigate(`/issues/${issueId}`)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Projects ({projects.length})</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>New Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  className="w-16 text-center"
                  value={newIcon}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIcon(e.target.value)}
                  placeholder="\u{1F4C1}"
                />
                <Input
                  value={newTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTitle(e.target.value)}
                  placeholder="Project title"
                  autoFocus
                />
              </div>
              <Textarea
                value={newDesc}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={3}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={creating || !newTitle.trim()}>
                  {creating ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <EmptyState title="No projects yet" description="Create a project to organize your issues." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const statusCfg = PROJECT_STATUS_CONFIG[p.status] ?? PROJECT_STATUS_CONFIG.planned;
            const progress = p.issue_count > 0 ? Math.round((p.done_count / p.issue_count) * 100) : 0;

            return (
              <Card
                key={p.id}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedProjectId(p.id)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.icon ?? "\u{1F4C1}"}</span>
                      <h3 className="text-sm font-semibold">{p.title}</h3>
                    </div>
                    <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
                  </div>
                  {p.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{p.issue_count} issues</span>
                      <span>{progress}% done</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProjectDetail({ project, wsId, onBack, onUpdate, onDelete, onIssueClick }: {
  project: Project;
  wsId: string;
  onBack: () => void;
  onUpdate: (data: Record<string, unknown>) => Promise<void>;
  onDelete: () => void;
  onIssueClick: (issueId: string) => void;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);

  const loadIssues = useCallback(() => {
    if (!wsId) return;
    setLoadingIssues(true);
    listIssues({ workspace_id: wsId })
      .then((res) => {
        const projectIssues = res.issues.filter((i) => i.project_id === project.id);
        setIssues(projectIssues);
      })
      .catch(console.error)
      .finally(() => setLoadingIssues(false));
  }, [wsId, project.id]);

  useEffect(() => { loadIssues(); }, [loadIssues]);

  const statusCfg = PROJECT_STATUS_CONFIG[project.status] ?? PROJECT_STATUS_CONFIG.planned;
  const progress = project.issue_count > 0 ? Math.round((project.done_count / project.issue_count) * 100) : 0;

  const handleTitleSave = async () => {
    if (!titleValue.trim()) return;
    await onUpdate({ title: titleValue });
    setEditingTitle(false);
  };

  const handleDescSave = async () => {
    await onUpdate({ description: descValue });
    setEditingDesc(false);
  };

  return (
    <div className="flex gap-6 max-w-6xl mx-auto">
      <div className="flex-1 min-w-0 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>&larr; Back</Button>
          <span className="text-2xl">{project.icon ?? "\u{1F4C1}"}</span>
          <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
        </div>

        <div>
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={titleValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitleValue(e.target.value)}
                className="text-2xl font-bold"
                autoFocus
              />
              <Button size="sm" onClick={handleTitleSave}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingTitle(false)}>Cancel</Button>
            </div>
          ) : (
            <h1
              className="text-2xl font-bold cursor-pointer hover:bg-muted/30 rounded px-1 -mx-1"
              onClick={() => { setEditingTitle(true); setTitleValue(project.title); }}
            >
              {project.title}
            </h1>
          )}

          {editingDesc ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={descValue}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescValue(e.target.value)}
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleDescSave}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingDesc(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <p
              className="mt-2 text-muted-foreground cursor-pointer hover:bg-muted/30 rounded px-1 -mx-1 min-h-[2em]"
              onClick={() => { setEditingDesc(true); setDescValue(project.description ?? ""); }}
            >
              {project.description || "Add a description..."}
            </p>
          )}
        </div>

        <Separator />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Issues ({issues.length})</h2>
          </div>
          {loadingIssues ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
              ))}
            </div>
          ) : issues.length === 0 ? (
            <EmptyState title="No issues in this project" description="Create issues and assign them to this project." />
          ) : (
            <div className="space-y-2">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/30"
                  onClick={() => onIssueClick(issue.id)}
                >
                  <span className="text-xs font-mono text-muted-foreground w-16">{issue.identifier}</span>
                  <span className="text-sm font-medium flex-1 truncate">{issue.title}</span>
                  <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">
                    {issue.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="w-64 shrink-0 space-y-4">
        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={project.status}
              onChange={(e) => onUpdate({ status: e.target.value })}
            >
              {Object.entries(PROJECT_STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Priority</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={project.priority}
              onChange={(e) => onUpdate({ priority: e.target.value })}
            >
              {Object.entries(PROJECT_PRIORITY_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">Progress</h3>
            <div className="text-center">
              <span className="text-3xl font-bold">{progress}%</span>
              <p className="text-xs text-muted-foreground mt-1">{project.done_count} of {project.issue_count} issues done</p>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <Separator />

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Created: {new Date(project.created_at).toLocaleDateString()}</p>
            <p>Updated: {new Date(project.updated_at).toLocaleDateString()}</p>
          </div>
        </Card>

        <Button variant="destructive" size="sm" className="w-full" onClick={onDelete}>
          Delete Project
        </Button>
      </aside>
    </div>
  );
}
