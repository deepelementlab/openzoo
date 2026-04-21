import { describe, it, expect, vi, beforeEach } from "vitest";
import { listComments, createComment, updateComment, deleteComment, addReaction, removeReaction, listTimeline } from "./queries";
import { setToken, setWorkspaceId } from "../api/connect-client";

describe("Comment query functions", () => {
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

  describe("listComments", () => {
    it("should fetch comments for an issue", async () => {
      const comments = [{ id: "c-1", content: "Hello" }];
      await mockResponse({ comments });

      const result = await listComments("ws-1", "i-1");
      expect(result).toEqual(comments);
    });

    it("should return empty array when comments is null", async () => {
      await mockResponse({ comments: null });

      const result = await listComments("ws-1", "i-1");
      expect(result).toEqual([]);
    });

    it("should pass pagination params", async () => {
      await mockResponse({ comments: [] });

      await listComments("ws-1", "i-1", 25, 10);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.limit).toBe(25);
      expect(body.offset).toBe(10);
    });
  });

  describe("createComment", () => {
    it("should create comment with content", async () => {
      const newComment = { id: "c-1", content: "Test comment" };
      await mockResponse(newComment);

      const result = await createComment({
        workspace_id: "ws-1",
        issue_id: "i-1",
        content: "Test comment",
      });

      expect(result).toEqual(newComment);
    });
  });

  describe("updateComment", () => {
    it("should update comment content", async () => {
      const updated = { id: "c-1", content: "Updated" };
      await mockResponse(updated);

      const result = await updateComment("ws-1", "c-1", "Updated");
      expect(result).toEqual(updated);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.content).toBe("Updated");
      expect(body.comment_id).toBe("c-1");
    });
  });

  describe("deleteComment", () => {
    it("should delete comment", async () => {
      await mockResponse(undefined);

      await deleteComment("ws-1", "c-1");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.comment_id).toBe("c-1");
    });
  });

  describe("addReaction / removeReaction", () => {
    it("should add reaction to comment", async () => {
      const reaction = { id: "r-1", emoji: "👍" };
      await mockResponse(reaction);

      const result = await addReaction("ws-1", "c-1", "👍");
      expect(result).toEqual(reaction);
    });

    it("should remove reaction from comment", async () => {
      await mockResponse(undefined);

      await removeReaction("ws-1", "c-1", "👍");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.emoji).toBe("👍");
    });
  });

  describe("listTimeline", () => {
    it("should fetch timeline entries", async () => {
      const entries = [{ id: "e-1", type: "comment" }];
      await mockResponse({ entries });

      const result = await listTimeline("ws-1", "i-1");
      expect(result).toEqual(entries);
    });

    it("should return empty array when entries is null", async () => {
      await mockResponse({ entries: null });

      const result = await listTimeline("ws-1", "i-1");
      expect(result).toEqual([]);
    });
  });
});
