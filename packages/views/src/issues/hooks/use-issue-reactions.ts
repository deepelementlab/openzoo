"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { IssueReaction } from "@openzoo/core/types";

export function useIssueReactions(issueId: string, userId?: string) {
  const qc = useQueryClient();
  const { data: reactions = [], isLoading: loading } = useQuery({
    queryKey: ["issue-reactions", issueId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/issues/${issueId}/reactions`);
      if (!res.ok) return [];
      return res.json() as Promise<IssueReaction[]>;
    },
  });

  const toggleReaction = useCallback(
    async (emoji: string) => {
      if (!userId) return;
      const existing = reactions.find(
        (r) => r.emoji === emoji && r.actor_type === "member" && r.actor_id === userId,
      );
      try {
        if (existing) {
          await fetch(`/api/v1/issues/${issueId}/reactions/${existing.id}`, { method: "DELETE" });
        } else {
          await fetch(`/api/v1/issues/${issueId}/reactions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emoji }),
          });
        }
        qc.invalidateQueries({ queryKey: ["issue-reactions", issueId] });
      } catch {
        // error handled silently
      }
    },
    [userId, reactions, issueId, qc],
  );

  return { reactions, loading, toggleReaction };
}
