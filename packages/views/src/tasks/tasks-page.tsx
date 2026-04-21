import { useState, useEffect } from "react";
import { useWorkspaceStore } from "@openzoo/core";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input } from "@openzoo/ui";
import { Plus, RefreshCw } from "lucide-react";

interface Task {
  id: string;
  issue_id: string;
  agent_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  running: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function TasksPage() {
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agentId, setAgentId] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const body: Record<string, any> = {};
      if (agentId) body.agent_id = agentId;

      const resp = await fetch("/rpc/task/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      setTasks(data.tasks || []);
    } catch (e) {
      console.error("Failed to fetch tasks", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const updateStatus = async (taskId: string, status: string) => {
    try {
      await fetch("/rpc/task/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId, status }),
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status } : t))
      );
    } catch (e) {
      console.error("Failed to update task", e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button variant="outline" size="sm" onClick={fetchTasks}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Filter by agent ID"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <Card key={task.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{truncateId(task.id)}</span>
                  <Badge className={statusColors[task.status] || ""}>
                    {task.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Issue: {truncateId(task.issue_id)} | Agent: {truncateId(task.agent_id)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Created: {task.created_at}
                </p>
              </div>
              <div className="flex gap-2">
                {task.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatus(task.id, "running")}
                  >
                    Start
                  </Button>
                )}
                {task.status === "running" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatus(task.id, "completed")}
                  >
                    Complete
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No tasks yet. Tasks will appear here when agents start working on issues.
          </div>
        )}
      </div>
    </div>
  );
}

function truncateId(id: string): string {
  if (!id) return "";
  if (id.length > 8) return id.slice(0, 8) + "...";
  return id;
}
