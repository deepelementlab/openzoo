import React, { useState, useEffect, useCallback } from "react";
import { useWorkspaceStore, useCreateIssue, useAgents, useMembers, useProjects } from "@openzoo/core";
import { Button, Input, Spinner, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@openzoo/ui";
import { ContentEditor } from "@openzoo/ui";

const STATUS_OPTIONS = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "backlog", label: "Backlog" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS = [
  { value: "none", label: "No Priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

interface CreateIssueModalProps {
  onClose: () => void;
  initialStatus?: string;
  initialProjectId?: string;
}

export function CreateIssueModal({ onClose, initialStatus, initialProjectId }: CreateIssueModalProps) {
  const wsId = useWorkspaceStore((s) => s.currentWorkspace?.id);
  const createIssue = useCreateIssue();
  const { data: agents = [] } = useAgents(wsId ?? "");
  const { data: members = [] } = useMembers(wsId ?? "");
  const { data: projects = { projects: [], total: 0 } } = useProjects(wsId ?? "");
  const projectList = projects.projects ?? [];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(initialStatus ?? "todo");
  const [priority, setPriority] = useState("none");
  const [projectId, setProjectId] = useState(initialProjectId ?? "");
  const [assigneeType, setAssigneeType] = useState<"member" | "agent" | "">("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async () => {
    if (!wsId || !title.trim()) return;
    await createIssue.mutateAsync({
      workspace_id: wsId,
      title: title.trim(),
      description: description || undefined,
      status,
      priority,
      project_id: projectId || undefined,
      assignee_type: assigneeType || undefined,
      assignee_id: assigneeId || undefined,
      due_date: dueDate || undefined,
    });
    onClose();
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Escape") {
        onClose();
      }
    },
    [handleSubmit, onClose],
  );

  useEffect(() => {
    if (initialStatus) setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    if (initialProjectId) setProjectId(initialProjectId);
  }, [initialProjectId]);

  const isSubmitting = createIssue.isPending;
  const canSubmit = title.trim() !== "" && !isSubmitting;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Issue</DialogTitle>
        </DialogHeader>

        <div className="space-y-4" onKeyDown={handleKeyDown}>
          <Input
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="Issue title"
            className="text-lg font-semibold"
            autoFocus
          />

          <ContentEditor
            value={description}
            onChange={setDescription}
            placeholder="Add a description..."
            minHeight="100px"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {projectList.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Project</label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="">No Project</option>
                  {projectList.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name ?? p.id.slice(0, 8)}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Assignee</label>
              <div className="flex gap-1">
                <select
                  className="w-24 rounded-md border bg-background px-2 py-2 text-sm"
                  value={assigneeType}
                  onChange={(e) => { setAssigneeType(e.target.value as "member" | "agent" | ""); setAssigneeId(""); }}
                >
                  <option value="">None</option>
                  <option value="member">Member</option>
                  <option value="agent">🤖 Agent</option>
                </select>
                <select
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  disabled={!assigneeType}
                >
                  <option value="">Unassigned</option>
                  {assigneeType === "member" && members.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.email ?? m.id.slice(0, 8)}</option>
                  ))}
                  {assigneeType === "agent" && agents.map((a: any) => (
                    <option key={a.id} value={a.id}>🤖 {a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? "Hide Advanced" : "Show Advanced"}
          </Button>

          {showAdvanced && (
            <div className="space-y-3 p-3 rounded-md border bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Advanced options will be available when file attachments and labels are implemented.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? <Spinner size="sm" /> : "Create Issue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
