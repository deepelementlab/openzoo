"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { IssueSubscriber } from "@openzoo/core/types";

export function useIssueSubscribers(issueId: string, userId?: string) {
  const qc = useQueryClient();
  const { data: subscribers = [], isLoading: loading } = useQuery({
    queryKey: ["issue-subscribers", issueId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/issues/${issueId}/subscribers`);
      if (!res.ok) return [];
      return res.json() as Promise<IssueSubscriber[]>;
    },
  });

  const isSubscribed = subscribers.some(
    (s) => s.user_id === userId,
  );

  const toggleSubscribe = useCallback(async () => {
    if (!userId) return;
    try {
      if (isSubscribed) {
        await fetch(`/api/v1/issues/${issueId}/subscribers/${userId}`, { method: "DELETE" });
      } else {
        await fetch(`/api/v1/issues/${issueId}/subscribers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        });
      }
      qc.invalidateQueries({ queryKey: ["issue-subscribers", issueId] });
    } catch {
      // error handled silently
    }
  }, [userId, isSubscribed, issueId, qc]);

  return { subscribers, loading, isSubscribed, toggleSubscribe };
}
