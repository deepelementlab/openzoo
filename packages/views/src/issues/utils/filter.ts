import type { Issue, IssueStatus, IssuePriority } from "@openzoo/core";

type FilterParams = { status: IssueStatus | null; priority: IssuePriority | null; search: string };

export function filterIssues(issues: Issue[], filters: FilterParams): Issue[] {
  return issues.filter((issue) => {
    if (filters.status && issue.status !== filters.status) return false;
    if (filters.priority && issue.priority !== filters.priority) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!issue.title.toLowerCase().includes(q) && !issue.identifier.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

export function sortIssues(issues: Issue[], field: string, dir: "asc" | "desc"): Issue[] {
  const sorted = [...issues].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case "title": cmp = a.title.localeCompare(b.title); break;
      case "status": cmp = a.status.localeCompare(b.status); break;
      case "priority": cmp = a.priority.localeCompare(b.priority); break;
      case "created_at": cmp = (a.created_at || "").localeCompare(b.created_at || ""); break;
      default: cmp = 0;
    }
    return dir === "desc" ? -cmp : cmp;
  });
  return sorted;
}

export function redactSensitiveInfo(text: string): string {
  let result = text;
  result = result.replace(/sk-[a-zA-Z0-9]{20,}/g, "sk-***REDACTED***");
  result = result.replace(/Bearer\s+[a-zA-Z0-9._-]+/g, "Bearer ***REDACTED***");
  result = result.replace(/["'][a-f0-9]{32,}["']/g, '"***REDACTED***"');
  return result;
}
