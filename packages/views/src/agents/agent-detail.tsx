import React, { useState } from "react";
import type { Agent, Skill } from "@openzoo/core";
import { Badge, Card, Tabs, TabsList, TabsTrigger, TabsContent, Spinner } from "@openzoo/ui";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  idle: { label: "Idle", color: "text-green-600", dot: "bg-green-500" },
  working: { label: "Working", color: "text-blue-600", dot: "bg-blue-500" },
  blocked: { label: "Blocked", color: "text-yellow-600", dot: "bg-yellow-500" },
  error: { label: "Error", color: "text-red-600", dot: "bg-red-500" },
  offline: { label: "Offline", color: "text-gray-500", dot: "bg-gray-400" },
};

interface AgentDetailProps {
  agent: Agent;
  skills: Skill[];
  onUpdate: (id: string, data: Partial<Agent>) => void;
}

export function AgentDetail({ agent, skills, onUpdate }: AgentDetailProps) {
  const [activeTab, setActiveTab] = useState("instructions");
  const status = STATUS_CONFIG[agent.status] || STATUS_CONFIG.offline;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{agent.name}</h2>
            <span className={`w-2 h-2 rounded-full ${status.dot}`} />
            <Badge variant="outline" className={status.color}>{status.label}</Badge>
          </div>
          {agent.description && <p className="text-sm text-muted-foreground mt-1">{agent.description}</p>}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="instructions">
          <Card className="p-4">
            <textarea
              className="w-full min-h-[200px] bg-transparent text-sm font-mono resize-y border-0 focus:outline-none"
              value={agent.instructions || ""}
              onChange={(e) => onUpdate(agent.id, { instructions: e.target.value })}
              placeholder="Agent instructions..."
            />
          </Card>
        </TabsContent>
        <TabsContent value="skills">
          <div className="space-y-2">
            {skills.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No skills configured</p>}
            {skills.map((skill) => (
              <Card key={skill.id} className="p-3 flex items-center justify-between">
                <span className="text-sm font-medium">{skill.name}</span>
                <Badge variant="outline">{skill.type || "custom"}</Badge>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="settings">
          <Card className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Model</label>
              <input
                className="w-full mt-1 h-9 rounded-md border bg-background px-3 text-sm"
                value={agent.model || ""}
                onChange={(e) => onUpdate(agent.id, { model: e.target.value } as any)}
                placeholder="default"
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
