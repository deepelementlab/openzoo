"use client";

import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import type { Agent } from "@openzoo/core/types";
import { Button } from "@openzoo/ui/components/button";

export function InstructionsTab({ agent, onSave }: { agent: Agent; onSave: (instructions: string) => Promise<void> }) {
  const [value, setValue] = useState(agent.instructions ?? "");
  const [saving, setSaving] = useState(false);
  const isDirty = value !== (agent.instructions ?? "");

  useEffect(() => {
    setValue(agent.instructions ?? "");
  }, [agent.id, agent.instructions]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Agent Instructions</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Define this agent&apos;s identity and working style.</p>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Define this agent's role, expertise, and working style..."
        className="w-full min-h-[300px] rounded-md border bg-transparent px-3 py-2 text-sm font-mono placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{value.length > 0 ? `${value.length} characters` : "No instructions set"}</span>
        <Button size="sm" onClick={handleSave} disabled={!isDirty || saving}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Save
        </Button>
      </div>
    </div>
  );
}
