"use client";

import { useState } from "react";
import { Loader2, Save, Globe, Lock } from "lucide-react";
import type { Agent, AgentVisibility } from "@openzoo/core/types";
import { Button } from "@openzoo/ui/components/button";
import { Input } from "@openzoo/ui/components/input";
import { Label } from "@openzoo/ui/components/label";

export function SettingsTab({ agent, onSave }: { agent: Agent; onSave: (updates: Partial<Agent>) => Promise<void> }) {
  const [name, setName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description ?? "");
  const [visibility, setVisibility] = useState<AgentVisibility>(agent.visibility);
  const [maxTasks, setMaxTasks] = useState(agent.max_concurrent_tasks);
  const [saving, setSaving] = useState(false);

  const dirty = name !== agent.name || description !== (agent.description ?? "") || visibility !== agent.visibility || maxTasks !== agent.max_concurrent_tasks;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), description, visibility, max_concurrent_tasks: maxTasks });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Label className="text-xs text-muted-foreground">Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this agent do?" className="mt-1" />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Visibility</Label>
        <div className="mt-1.5 flex gap-2">
          <button type="button" onClick={() => setVisibility("workspace")} className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${visibility === "workspace" ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="text-left"><div className="font-medium">Workspace</div><div className="text-xs text-muted-foreground">All members can assign</div></div>
          </button>
          <button type="button" onClick={() => setVisibility("private")} className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${visibility === "private" ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
            <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="text-left"><div className="font-medium">Private</div><div className="text-xs text-muted-foreground">Only you can assign</div></div>
          </button>
        </div>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Max Concurrent Tasks</Label>
        <Input type="number" min={1} max={50} value={maxTasks} onChange={(e) => setMaxTasks(Number(e.target.value))} className="mt-1 w-24" />
      </div>
      <Button onClick={handleSave} disabled={!dirty || saving} size="sm">
        {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
        Save Changes
      </Button>
    </div>
  );
}
