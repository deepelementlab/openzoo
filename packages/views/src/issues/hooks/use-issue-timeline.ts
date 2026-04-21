"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Comment } from "@openzoo/core/types";

export interface TimelineEntry {
  id: string;
  type: string;
  actor_type: string;
  actor_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  comment_type: string;
  reactions: import("@openzoo/core/types").Reaction[];
}

function commentToTimelineEntry(c: Comment): TimelineEntry {
  return {
    type: "comment",
    id: c.id,
    actor_type: c.author_type,
    actor_id: c.author_id,
    content: c.content,
    parent_id: c.parent_id,
    created_at: c.created_at,
    updated_at: c.updated_at,
    comment_type: c.type,
    reactions: c.reactions ?? [],
  };
}

export function useIssueTimeline(issueId: string, _userId?: string) {
  const qc = useQueryClient();
  const { data: comments = [], isLoading: loading } = useQuery({
    queryKey: ["issue-timeline", issueId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/issues/${issueId}/comments`);
      if (!res.ok) return [];
      return res.json() as Promise<Comment[]>;
    },
  });

  const [submitting, setSubmitting] = useState(false);

  const timeline = comments.map(commentToTimelineEntry);

  const submitComment = useCallback(
    async (content: string) => {
      if (!content.trim() || submitting) return;
      setSubmitting(true);
      try {
        await fetch(`/api/v1/issues/${issueId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        qc.invalidateQueries({ queryKey: ["issue-timeline", issueId] });
      } finally {
        setSubmitting(false);
      }
    },
    [issueId, submitting, qc],
  );

  const submitReply = useCallback(
    async (parentId: string, content: string) => {
      if (!content.trim()) return;
      await fetch(`/api/v1/issues/${issueId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parent_id: parentId }),
      });
      qc.invalidateQueries({ queryKey: ["issue-timeline", issueId] });
    },
    [issueId, qc],
  );

  const editComment = useCallback(
    async (commentId: string, content: string) => {
      await fetch(`/api/v1/issues/${issueId}/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      qc.invalidateQueries({ queryKey: ["issue-timeline", issueId] });
    },
    [issueId, qc],
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      await fetch(`/api/v1/issues/${issueId}/comments/${commentId}`, { method: "DELETE" });
      qc.invalidateQueries({ queryKey: ["issue-timeline", issueId] });
    },
    [issueId, qc],
  );

  const toggleReaction = useCallback(
    async (commentId: string, emoji: string) => {
      await fetch(`/api/v1/comments/${commentId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      qc.invalidateQueries({ queryKey: ["issue-timeline", issueId] });
    },
    [issueId, qc],
  );

  const allReplies = new Map<string, TimelineEntry[]>();
  for (const entry of timeline) {
    if (entry.parent_id) {
      const siblings = allReplies.get(entry.parent_id) ?? [];
      siblings.push(entry);
      allReplies.set(entry.parent_id, siblings);
    }
  }

  const rootEntries = timeline.filter((e) => !e.parent_id);

  return {
    timeline,
    rootEntries,
    allReplies,
    loading,
    submitting,
    submitComment,
    submitReply,
    editComment,
    deleteComment,
    toggleReaction,
  };
}
