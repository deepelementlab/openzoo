import React, { useEffect, useState, useCallback } from "react";
import {
  listAgents, createAgent, updateAgent, archiveAgent, restoreAgent,
  listSkills, listRuntimes,
  useWorkspaceStore, attachRealtimeSync,
} from "@openzoo/core";
import type { Agent, Skill, RuntimeDevice, AgentStatus } from "@openzoo/core";
import { Button, Badge, Card, Input, Textarea, Spinner, EmptyState, Tabs, TabsList, TabsTrigger, TabsContent, Separator } from "@openzoo/ui";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@openzoo/ui";

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string; dot: string }> = {
  idle: { label: "Idle", color: "text-green-600", dot: "bg-green-500" },
  working: { label: "Working", color: "text-blue-600", dot: "bg-blue-500" },
  blocked: { label: "Blocked", color: "text-yellow-600", dot: "bg-yellow-500" },
  error: { label: "Error", color: "text-red-600", dot: "bg-red-500" },
  offline: { label: "Offline", color: "text-gray-500", dot: "bg-gray-400" },
};

type DetailTab = "instructions" | "skills" | "settings";

export function AgentsPage() {
  const wsId = useWorkspaceStore((s) => s.currentWorkspace?.id);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [runtimes, setRuntimes] = useState<RuntimeDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newInstructions, setNewInstructions] = useState("");
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(() => {
    if (!wsId) return;
    setLoading(true);
    Promise.all([
      listAgents(wsId),
      listSkills(wsId),
      listRuntimes(wsId).then((res: any) => res.runtimes || res || []),
    ]).then(([a, s, r]) => {
      setAgents(a);
      setSkills(s);
      setRuntimes(r);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [wsId]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    if (!wsId) return;
    return attachRealtimeSync(wsId, {});
  }, [wsId]);

  const handleCreate = async () => {
    if (!wsId || !newName.trim()) return;
    setCreating(true);
    try {
      const runtimeId = runtimes.length > 0 ? runtimes[0].id : undefined;
      await createAgent({
        workspace_id: wsId,
        name: newName,
        description: newDesc || undefined,
        instructions: newInstructions || undefined,
        runtime_id: runtimeId,
      });
      setNewName("");
      setNewDesc("");
      setNewInstructions("");
      setCreateOpen(false);
      loadData();
    } catch (e) {
      console.error("Failed to create agent:", e);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (agentId: string, data: Record<string, unknown>) => {
    if (!wsId) return;
    await updateAgent(wsId, agentId, data);
    loadData();
  };

  const handleArchive = async (agentId: string) => {
    if (!wsId) return;
    await archiveAgent(wsId, agentId);
    loadData();
  };

  const handleRestore = async (agentId: string) => {
    if (!wsId) return;
    await restoreAgent(wsId, agentId);
    loadData();
  };

  if (!wsId) return <div className="p-8 text-center text-muted-foreground">Select a workspace first</div>;
  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null;

  if (selectedAgent) {
    return (
      <AgentDetail
        agent={selectedAgent}
        skills={skills}
        runtimes={runtimes}
        onBack={() => setSelectedAgentId(null)}
        onUpdate={handleUpdate}
        onArchive={handleArchive}
        onRestore={handleRestore}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Agents ({agents.length})</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>New Agent</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={newName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
                placeholder="Agent name"
                autoFocus
              />
              <Textarea
                value={newDesc}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
              />
              <Textarea
                value={newInstructions}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewInstructions(e.target.value)}
                placeholder="Instructions for the agent (optional)"
                rows={4}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
                  {creating ? "Creating..." : "Create Agent"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {agents.length === 0 ? (
        <EmptyState title="No agents yet" description="Create an agent to start automating tasks with AI." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const st = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.offline;
            const isArchived = !!agent.archived_at;
            return (
              <Card
                key={agent.id}
                className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${isArchived ? "opacity-60" : ""}`}
                onClick={() => setSelectedAgentId(agent.id)}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-sm">
                        {agent.avatar_url ? (
                          <img src={agent.avatar_url} alt="" className="h-full w-full rounded-md object-cover" />
                        ) : (
                          <span className="font-bold">{agent.name[0]}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{agent.name}</h3>
                        <div className="flex items-center gap-1 text-xs">
                          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                          <span className={st.color}>{st.label}</span>
                        </div>
                      </div>
                    </div>
                    {isArchived && <Badge variant="outline">Archived</Badge>}
                  </div>
                  {agent.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{agent.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Visibility: {agent.visibility}</span>
                    {agent.skills && agent.skills.length > 0 && (
                      <span>Skills: {agent.skills.length}</span>
                    )}
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

function AgentDetail({ agent, skills, runtimes, onBack, onUpdate, onArchive, onRestore }: {
  agent: Agent;
  skills: Skill[];
  runtimes: RuntimeDevice[];
  onBack: () => void;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
}) {
  const st = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.offline;
  const isArchived = !!agent.archived_at;
  const runtime = runtimes.find((r) => r.id === agent.runtime_id);
  const [activeTab, setActiveTab] = useState<DetailTab>("instructions");

  return (
    <div className="flex flex-col h-full">
      {isArchived && (
        <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 text-xs text-muted-foreground border-b">
          <span>This agent is archived. Restore to use it again.</span>
          <Button variant="outline" size="sm" onClick={() => onRestore(agent.id)}>Restore</Button>
        </div>
      )}

      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onBack}>&larr; Back</Button>
        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-sm font-bold">
          {agent.avatar_url ? (
            <img src={agent.avatar_url} alt="" className="h-full w-full rounded-md object-cover" />
          ) : (
            agent.name[0]
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold truncate">{agent.name}</h2>
            <span className={`flex items-center gap-1 text-xs ${st.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
              {st.label}
            </span>
          </div>
          {runtime && <span className="text-xs text-muted-foreground">Runtime: {runtime.name}</span>}
        </div>
        {!isArchived && (
          <Button variant="outline" size="sm" onClick={() => onArchive(agent.id)}>Archive</Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DetailTab)} className="flex-1 flex flex-col">
        <div className="border-b px-4">
          <TabsList>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <TabsContent value="instructions">
            <InstructionsTab agent={agent} onSave={(instructions) => onUpdate(agent.id, { instructions })} />
          </TabsContent>
          <TabsContent value="skills">
            <SkillsTab agent={agent} allSkills={skills} onSave={(skillIds) => onUpdate(agent.id, { skill_ids: skillIds })} />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab agent={agent} runtimes={runtimes} onSave={onUpdate} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function InstructionsTab({ agent, onSave }: { agent: Agent; onSave: (instructions: string) => Promise<void> }) {
  const [value, setValue] = useState(agent.instructions ?? "");
  const [saving, setSaving] = useState(false);
  const isDirty = value !== (agent.instructions ?? "");

  useEffect(() => { setValue(agent.instructions ?? ""); }, [agent.id, agent.instructions]);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(value); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h3 className="text-sm font-semibold">Agent Instructions</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Define this agent&apos;s identity and working style. These instructions are injected into every task.
        </p>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`Define this agent's role, expertise, and working style.\n\nExample:\nYou are a frontend engineer specializing in React and TypeScript.\n\n## Working Style\n- Write small, focused PRs\n- Prefer composition over inheritance\n- Always add unit tests`}
        className="w-full min-h-[300px] rounded-md border bg-transparent px-3 py-2 text-sm font-mono placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {value.length > 0 ? `${value.length} characters` : "No instructions set"}
        </span>
        <Button size="sm" onClick={handleSave} disabled={!isDirty || saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

function SkillsTab({ agent, allSkills, onSave }: { agent: Agent; allSkills: Skill[]; onSave: (skillIds: string[]) => Promise<void> }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(agent.skills?.map((s) => s.id) ?? []));
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(Array.from(selectedIds)); } finally { setSaving(false); }
  };

  const isDirty = (() => {
    const current = new Set(agent.skills?.map((s) => s.id) ?? []);
    if (current.size !== selectedIds.size) return true;
    for (const id of selectedIds) if (!current.has(id)) return true;
    return false;
  })();

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Agent Skills</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Assign skills to this agent.</p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!isDirty || saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
      {allSkills.length === 0 ? (
        <p className="text-sm text-muted-foreground">No skills available. Create skills in the workspace first.</p>
      ) : (
        <div className="space-y-2">
          {allSkills.map((skill) => (
            <label key={skill.id} className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/30">
              <input
                type="checkbox"
                checked={selectedIds.has(skill.id)}
                onChange={() => toggle(skill.id)}
                className="rounded border-muted-foreground/30"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{skill.name}</p>
                {skill.description && <p className="text-xs text-muted-foreground truncate">{skill.description}</p>}
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsTab({ agent, runtimes, onSave }: {
  agent: Agent;
  runtimes: RuntimeDevice[];
  onSave: (id: string, data: Record<string, unknown>) => Promise<void>;
}) {
  const [name, setName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description ?? "");
  const [visibility, setVisibility] = useState(agent.visibility);
  const [maxTasks, setMaxTasks] = useState(agent.max_concurrent_tasks);
  const [selectedRuntimeId, setSelectedRuntimeId] = useState(agent.runtime_id);
  const [saving, setSaving] = useState(false);

  const dirty =
    name !== agent.name ||
    description !== (agent.description ?? "") ||
    visibility !== agent.visibility ||
    maxTasks !== agent.max_concurrent_tasks ||
    selectedRuntimeId !== agent.runtime_id;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(agent.id, {
        name: name.trim(),
        description,
        visibility,
        max_concurrent_tasks: maxTasks,
        runtime_id: selectedRuntimeId,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">General</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Visibility</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
            >
              <option value="workspace">Workspace</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Max Concurrent Tasks</label>
            <Input
              type="number"
              min={1}
              max={10}
              value={maxTasks}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxTasks(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Runtime</label>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={selectedRuntimeId}
            onChange={(e) => setSelectedRuntimeId(e.target.value)}
          >
            <option value="">No runtime</option>
            {runtimes.map((r) => (
              <option key={r.id} value={r.id}>{r.name} ({r.status})</option>
            ))}
          </select>
        </div>
      </div>
      <Button onClick={handleSave} disabled={!dirty || saving}>
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
