import type { Issue } from "@openzoo/core/types";

export function sortIssues(issues: Issue[], sortBy: string): Issue[] {
  const sorted = [...issues];
  switch (sortBy) {
    case "newest":
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case "oldest":
      return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    case "updated":
      return sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    case "priority": {
      const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };
      return sorted.sort((a, b) => (order[a.priority] ?? 4) - (order[b.priority] ?? 4));
    }
    default:
      return sorted;
  }
}
