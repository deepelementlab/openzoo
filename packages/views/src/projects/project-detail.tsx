import React from "react";
import type { Issue } from "@openzoo/core";
import { Badge, Card } from "@openzoo/ui";

interface Project {
  id: string;
  name: string;
  description?: string;
  status?: string;
}

interface ProjectDetailProps {
  project: Project;
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
}

export function ProjectDetail({ project, issues, onIssueClick }: ProjectDetailProps) {
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const issue of issues) {
      counts[issue.status] = (counts[issue.status] || 0) + 1;
    }
    return counts;
  }, [issues]);

  const doneCount = statusCounts["done"] || 0;
  const total = issues.length;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{project.name}</h2>
        {project.description && <p className="text-sm text-muted-foreground mt-1">{project.description}</p>}
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Progress</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-sm text-muted-foreground">{progress}%</span>
        </div>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span>Done: {doneCount}</span>
          <span>In Progress: {statusCounts["in_progress"] || 0}</span>
          <span>Total: {total}</span>
        </div>
      </Card>

      <div>
        <h3 className="text-sm font-medium mb-2">Issues</h3>
        {issues.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No issues in this project</p>
        ) : (
          <div className="space-y-1">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted/30 cursor-pointer"
                onClick={() => onIssueClick(issue)}
              >
                <span className="text-xs text-muted-foreground">{issue.identifier}</span>
                <span className="text-sm truncate">{issue.title}</span>
                <Badge variant="outline" className="ml-auto text-[10px]">{issue.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
