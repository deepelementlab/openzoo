interface ProjectMetrics {
  totalCount: number;
  completedCount: number;
  doneColumnCount: number;
}

export function getProjectIssueMetrics(
  project: { issue_count: number; done_count: number },
  issues: { status: string }[]
): ProjectMetrics {
  return {
    totalCount: project.issue_count,
    completedCount: project.done_count,
    doneColumnCount: issues.filter((i) => i.status === "done").length,
  };
}
