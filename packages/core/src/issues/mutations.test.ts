import { describe, it, expect, vi, beforeEach } from "vitest";
import { getApiClient, setToken, setWorkspaceId } from "../api/connect-client";

describe("Issue Mutations", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
    setToken("test-token");
    setWorkspaceId("ws-1");
  });

  async function mockResponse(data: unknown, status = 200) {
    mockFetch.mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    });
  }

  describe("createIssue", () => {
    it("should call /rpc/issue/create with correct data", async () => {
      const newIssue = { id: "i-1", title: "Test Issue", workspace_id: "ws-1" };
      await mockResponse(newIssue);

      const { createIssue } = await import("./mutations");
      const result = await createIssue({
        workspace_id: "ws-1",
        title: "Test Issue",
        description: "Test description",
      });

      expect(result).toEqual(newIssue);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/rpc/issue/create"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Test Issue"),
        }),
      );
    });
  });

  describe("updateIssue", () => {
    it("should call /rpc/issue/update with merged data", async () => {
      const updated = { id: "i-1", title: "Updated", status: "in_progress" };
      await mockResponse(updated);

      const { updateIssue } = await import("./mutations");
      const result = await updateIssue("ws-1", "i-1", { status: "in_progress" });

      expect(result).toEqual(updated);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.workspace_id).toBe("ws-1");
      expect(body.issue_id).toBe("i-1");
      expect(body.status).toBe("in_progress");
    });
  });

  describe("deleteIssue", () => {
    it("should call /rpc/issue/delete", async () => {
      await mockResponse(undefined);

      const { deleteIssue } = await import("./mutations");
      await deleteIssue("ws-1", "i-1");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.workspace_id).toBe("ws-1");
      expect(body.issue_id).toBe("i-1");
    });
  });

  describe("batchUpdateIssues", () => {
    it("should call /rpc/issue/batch-update with issue ids", async () => {
      const response = { issues: [], updated: 3 };
      await mockResponse(response);

      const { batchUpdateIssues } = await import("./mutations");
      const result = await batchUpdateIssues("ws-1", ["i-1", "i-2", "i-3"], { status: "done" });

      expect(result.updated).toBe(3);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.issue_ids).toEqual(["i-1", "i-2", "i-3"]);
      expect(body.status).toBe("done");
    });
  });

  describe("addIssueReaction / removeIssueReaction", () => {
    it("should add reaction to issue", async () => {
      const reaction = { id: "r-1", emoji: "👍", issue_id: "i-1" };
      await mockResponse(reaction);

      const { addIssueReaction } = await import("./mutations");
      const result = await addIssueReaction("ws-1", "i-1", "👍");

      expect(result).toEqual(reaction);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.emoji).toBe("👍");
    });

    it("should remove reaction from issue", async () => {
      await mockResponse(undefined);

      const { removeIssueReaction } = await import("./mutations");
      await removeIssueReaction("ws-1", "i-1", "👍");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.emoji).toBe("👍");
    });
  });

  describe("subscribeIssue / unsubscribeIssue", () => {
    it("should subscribe user to issue", async () => {
      const sub = { issue_id: "i-1", user_id: "u-1", reason: "manual" };
      await mockResponse(sub);

      const { subscribeIssue } = await import("./mutations");
      const result = await subscribeIssue("ws-1", "i-1", "u-1");

      expect(result).toEqual(sub);
    });

    it("should unsubscribe user from issue", async () => {
      await mockResponse(undefined);

      const { unsubscribeIssue } = await import("./mutations");
      await unsubscribeIssue("ws-1", "i-1", "u-1");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.user_id).toBe("u-1");
    });
  });
});
