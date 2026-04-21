"use client";

import { Plus, FileText, Trash2 } from "lucide-react";
import type { Skill } from "@openzoo/core/types";
import { Button } from "@openzoo/ui/components/button";

export function SkillsTab({ skills, onAdd, onRemove }: { skills: Skill[]; onAdd?: () => void; onRemove?: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Skills</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Reusable skills assigned to this agent.</p>
        </div>
        {onAdd && (
          <Button variant="outline" size="sm" onClick={onAdd}>
            <Plus className="h-3 w-3" /> Add Skill
          </Button>
        )}
      </div>
      {skills.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <FileText className="h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No skills assigned</p>
        </div>
      ) : (
        <div className="space-y-2">
          {skills.map((skill) => (
            <div key={skill.id} className="flex items-center gap-3 rounded-lg border px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{skill.name}</div>
                {skill.description && <div className="text-xs text-muted-foreground truncate">{skill.description}</div>}
              </div>
              {onRemove && (
                <Button variant="ghost" size="sm" onClick={() => onRemove(skill.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
