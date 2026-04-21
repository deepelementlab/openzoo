import { describe, expect, it } from "vitest";
import type { Issue } from "@openzoo/core/types";
import { getProjectIssueMetrics } from "../project-issue-metrics";

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: "issue-0", workspace_id: "ws-1", number: 1, identifier: "OZ-1",
    title: "Test", description: null, status: "todo", priority: "medium",
    assignee_type: null, assignee_id: null, creator_type: "member", creator_id: "u-1",
    parent_issue_id: null, project_id: null, position: 0, due_date: null,
    created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("getProjectIssueMetrics", () => {
  it("uses project totals for progress and project-local done issues for the kanban done count", () => {
    const metrics = getProjectIssueMetrics(
      { issue_count: 9, done_count: 5 },
      [
        makeIssue({ id: "issue-1", status: "done" }),
        makeIssue({ id: "issue-2", status: "done" }),
        makeIssue({ id: "issue-3", status: "cancelled" }),
        makeIssue({ id: "issue-4", status: "todo" }),
      ],
    );
    expect(metrics).toEqual({
      totalCount: 9,
      completedCount: 5,
      doneColumnCount: 2,
    });
  });
});
