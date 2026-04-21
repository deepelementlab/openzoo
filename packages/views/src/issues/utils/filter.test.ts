import { describe, it, expect } from "vitest";
import type { Issue } from "@openzoo/core/types";

interface IssueFilters {
  status?: string[];
  priority?: string[];
  assigneeFilter?: Array<{ type: string; id: string }>;
  creatorFilter?: Array<{ type: string; id: string }>;
  projectFilter?: string[];
}

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: "issue-0",
    workspace_id: "ws-1",
    number: 1,
    identifier: "OZ-1",
    title: "Test Issue",
    description: null,
    status: "todo",
    priority: "medium",
    assignee_type: null,
    assignee_id: null,
    creator_type: "member",
    creator_id: "u-1",
    parent_issue_id: null,
    project_id: null,
    position: 0,
    due_date: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function filterIssues(issues: Issue[], filters: IssueFilters): Issue[] {
  let result = issues;
  if (filters.status?.length) {
    result = result.filter((i) => filters.status!.includes(i.status));
  }
  if (filters.priority?.length) {
    result = result.filter((i) => filters.priority!.includes(i.priority));
  }
  if (filters.assigneeFilter?.length) {
    result = result.filter(
      (i) =>
        i.assignee_id &&
        filters.assigneeFilter!.some((a) => a.id === i.assignee_id),
    );
  }
  if (filters.creatorFilter?.length) {
    result = result.filter((i) =>
      filters.creatorFilter!.some((c) => c.id === i.creator_id),
    );
  }
  if (filters.projectFilter?.length) {
    result = result.filter(
      (i) => i.project_id && filters.projectFilter!.includes(i.project_id),
    );
  }
  return result;
}

describe("filterIssues", () => {
  const issues: Issue[] = [
    makeIssue({ id: "1", status: "todo", priority: "high", assignee_type: "member", assignee_id: "u-1", creator_id: "u-1", project_id: "p-1" }),
    makeIssue({ id: "2", status: "in_progress", priority: "medium", assignee_type: "agent", assignee_id: "a-1", creator_id: "u-2", project_id: "p-2" }),
    makeIssue({ id: "3", status: "done", priority: "low", creator_id: "u-1" }),
    makeIssue({ id: "4", status: "todo", priority: "urgent", assignee_type: "member", assignee_id: "u-2", creator_id: "u-3", project_id: "p-1" }),
  ];

  it("returns all issues when no filters are active", () => {
    expect(filterIssues(issues, {})).toHaveLength(4);
  });

  it("filters by status", () => {
    expect(filterIssues(issues, { status: ["todo"] })).toHaveLength(2);
    expect(filterIssues(issues, { status: ["done"] })).toHaveLength(1);
  });

  it("filters by priority", () => {
    expect(filterIssues(issues, { priority: ["high", "urgent"] })).toHaveLength(2);
  });

  it("filters by assignee", () => {
    expect(filterIssues(issues, { assigneeFilter: [{ type: "member", id: "u-1" }] })).toHaveLength(1);
  });

  it("filters by creator", () => {
    expect(filterIssues(issues, { creatorFilter: [{ type: "member", id: "u-1" }] })).toHaveLength(2);
  });

  it("filters by project", () => {
    expect(filterIssues(issues, { projectFilter: ["p-1"] })).toHaveLength(2);
  });

  it("applies status + priority filters together", () => {
    expect(filterIssues(issues, { status: ["todo"], priority: ["high"] })).toHaveLength(1);
  });

  it("applies status + creator filters together", () => {
    expect(filterIssues(issues, { status: ["todo", "done"], creatorFilter: [{ type: "member", id: "u-1" }] })).toHaveLength(2);
  });

  it("returns empty when no issues match", () => {
    expect(filterIssues(issues, { status: ["blocked"] })).toHaveLength(0);
  });
});
