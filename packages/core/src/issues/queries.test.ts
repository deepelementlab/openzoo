import { describe, it, expect, vi, beforeEach } from "vitest";
import { listIssues, getIssue, searchIssues, listIssueSubscribers, issueKeys } from "./queries";
import { setToken, setWorkspaceId } from "../api/connect-client";

describe("issueKeys", () => {
  it("should generate correct list key", () => {
    const key = issueKeys.list("ws-1");
    expect(key).toEqual(["issues", "ws-1", undefined]);
  });

  it("should generate correct list key with params", () => {
    const key = issueKeys.list("ws-1", { status: "open" });
    expect(key).toEqual(["issues", "ws-1", { status: "open" }]);
  });

  it("should generate correct detail key", () => {
    const key = issueKeys.detail("ws-1", "i-1");
    expect(key).toEqual(["issue", "ws-1", "i-1"]);
  });

  it("should generate correct subscribers key", () => {
    const key = issueKeys.subscribers("ws-1", "i-1");
    expect(key).toEqual(["issue-subscribers", "ws-1", "i-1"]);
  });

  it("should generate correct timeline key", () => {
    const key = issueKeys.timeline("ws-1", "i-1");
    expect(key).toEqual(["timeline", "ws-1", "i-1"]);
  });

  it("should generate correct comments key", () => {
    const key = issueKeys.comments("ws-1", "i-1");
    expect(key).toEqual(["comments", "ws-1", "i-1"]);
  });
});

describe("Issue query functions", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
    setToken("test-token");
    setWorkspaceId("ws-1");
  });

  async function mockResponse(data: unknown) {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
    });
  }

  describe("listIssues", () => {
    it("should fetch issue list", async () => {
      const data = { issues: [{ id: "i-1" }], total: 1 };
      await mockResponse(data);

      const result = await listIssues({ workspace_id: "ws-1" });
      expect(result).toEqual(data);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.workspace_id).toBe("ws-1");
    });

    it("should pass filter params", async () => {
      await mockResponse({ issues: [], total: 0 });

      await listIssues({ workspace_id: "ws-1", status: "open", limit: 10 });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.status).toBe("open");
      expect(body.limit).toBe(10);
    });
  });

  describe("getIssue", () => {
    it("should fetch single issue", async () => {
      const issue = { id: "i-1", title: "Test" };
      await mockResponse(issue);

      const result = await getIssue("ws-1", "i-1");
      expect(result).toEqual(issue);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.workspace_id).toBe("ws-1");
      expect(body.issue_id).toBe("i-1");
    });
  });

  describe("searchIssues", () => {
    it("should search issues with query", async () => {
      const data = { results: [{ id: "i-1" }], total: 1 };
      await mockResponse(data);

      const result = await searchIssues("ws-1", "bug");
      expect(result).toEqual(data);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.query).toBe("bug");
    });

    it("should use custom limit", async () => {
      await mockResponse({ results: [], total: 0 });

      await searchIssues("ws-1", "test", 50);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.limit).toBe(50);
    });
  });

  describe("listIssueSubscribers", () => {
    it("should fetch subscribers for an issue", async () => {
      const subscribers = [
        { issue_id: "i-1", user_id: "u-1", user_type: "member", reason: "creator" },
      ];
      await mockResponse({ subscribers });

      const result = await listIssueSubscribers("ws-1", "i-1");
      expect(result).toEqual(subscribers);
    });

    it("should return empty array when subscribers is null", async () => {
      await mockResponse({ subscribers: null });

      const result = await listIssueSubscribers("ws-1", "i-1");
      expect(result).toEqual([]);
    });
  });
});
