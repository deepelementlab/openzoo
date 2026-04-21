"use client";

import { ListTodo } from "lucide-react";
import type { Task } from "@openzoo/core/types";

const taskStatusConfig: Record<string, { label: string; color: string }> = {
  running: { label: "Running", color: "text-green-500" },
  dispatched: { label: "Dispatched", color: "text-blue-500" },
  queued: { label: "Queued", color: "text-yellow-500" },
  completed: { label: "Completed", color: "text-muted-foreground" },
  failed: { label: "Failed", color: "text-red-500" },
  cancelled: { label: "Cancelled", color: "text-muted-foreground" },
};

export function TasksTab({ tasks }: { tasks: Task[] }) {
  const activeStatuses = ["running", "dispatched", "queued"];
  const sortedTasks = [...tasks].sort((a, b) => {
    const aActive = activeStatuses.indexOf(a.status);
    const bActive = activeStatuses.indexOf(b.status);
    if (aActive !== -1 && bActive === -1) return -1;
    if (aActive === -1 && bActive !== -1) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Task Queue</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Issues assigned to this agent and their execution status.</p>
      </div>
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <ListTodo className="h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No tasks in queue</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {sortedTasks.map((task) => {
            const config = taskStatusConfig[task.status] ?? taskStatusConfig.queued!;
            const isRunning = task.status === "running";
            return (
              <div key={task.id} className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${isRunning ? "border-green-200 bg-green-50" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm truncate">{`Task ${task.id.slice(0, 8)}...`}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {task.started_at ? `Started ${new Date(task.started_at).toLocaleString()}` : `Created ${new Date(task.created_at).toLocaleString()}`}
                  </div>
                </div>
                <span className={`shrink-0 text-xs font-medium ${config.color}`}>{config.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
