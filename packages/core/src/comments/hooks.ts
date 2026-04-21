import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listComments, createComment, updateComment, deleteComment, addReaction, removeReaction, listTimeline } from "../comments/queries";
import { issueKeys } from "../issues/queries";
import type { Comment, Reaction, TimelineEntry } from "../types";

export function useComments(workspaceId: string, issueId: string) {
  return useQuery({
    queryKey: issueKeys.comments(workspaceId, issueId),
    queryFn: () => listComments(workspaceId, issueId),
    enabled: !!workspaceId && !!issueId,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createComment,
    onMutate: async (vars) => {
      const key = issueKeys.comments(vars.workspace_id, vars.issue_id);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Comment[]>(key);

      if (previous) {
        const optimistic: Comment = {
          id: `temp-${Date.now()}`,
          issue_id: vars.issue_id,
          author_type: "member",
          author_id: "",
          content: vars.content,
          type: "comment",
          parent_id: vars.parent_id ?? null,
          reactions: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        qc.setQueryData<Comment[]>(key, [...previous, optimistic]);
      }

      const prevTimeline = qc.getQueryData<TimelineEntry[]>(issueKeys.timeline(vars.workspace_id, vars.issue_id));

      return { previous, prevTimeline };
    },
    onError: (_err, vars, ctx: { previous?: Comment[]; prevTimeline?: TimelineEntry[] } | undefined) => {
      if (ctx?.previous) qc.setQueryData(issueKeys.comments(vars.workspace_id, vars.issue_id), ctx.previous);
      if (ctx?.prevTimeline) qc.setQueryData(issueKeys.timeline(vars.workspace_id, vars.issue_id), ctx.prevTimeline);
    },
    onSuccess: (newComment, vars) => {
      const timelineKey = issueKeys.timeline(vars.workspace_id, vars.issue_id);
      qc.setQueryData<TimelineEntry[]>(timelineKey, (old) => {
        if (!old) return old;
        const entry: TimelineEntry = {
          id: newComment.id,
          type: "comment",
          content: newComment.content,
          author_type: newComment.author_type,
          author_id: newComment.author_id,
          parent_id: newComment.parent_id ?? undefined,
          reactions: newComment.reactions,
          created_at: newComment.created_at,
        };
        if (old.some((e) => e.id === newComment.id)) return old;
        return [...old, entry];
      });
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: issueKeys.comments(vars.workspace_id, vars.issue_id) });
      qc.invalidateQueries({ queryKey: issueKeys.timeline(vars.workspace_id, vars.issue_id) });
    },
  });
}

export function useUpdateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, commentId, content }: { workspaceId: string; commentId: string; content: string }) =>
      updateComment(workspaceId, commentId, content),
    onMutate: async ({ workspaceId, commentId, content }) => {
      const commentsKey = issueKeys.comments(workspaceId, "");
      await qc.cancelQueries({ queryKey: ["comments", workspaceId] });

      const previous = qc.getQueryData<Comment[]>(["comments", workspaceId]);
      if (previous) {
        qc.setQueryData<Comment[]>(["comments", workspaceId], previous.map((c) =>
          c.id === commentId ? { ...c, content } : c,
        ));
      }

      return { previous };
    },
    onError: (_err, vars, ctx: { previous?: Comment[] } | undefined) => {
      if (ctx?.previous) qc.setQueryData(["comments", vars.workspaceId], ctx.previous);
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", vars.workspaceId] });
    },
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, commentId }: { workspaceId: string; commentId: string }) =>
      deleteComment(workspaceId, commentId),
    onMutate: async ({ workspaceId, commentId }) => {
      const key = ["comments", workspaceId];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Comment[]>(key);

      if (previous) {
        const toRemove = new Set<string>([commentId]);
        let changed = true;
        while (changed) {
          changed = false;
          for (const c of previous) {
            if (c.parent_id && toRemove.has(c.parent_id) && !toRemove.has(c.id)) {
              toRemove.add(c.id);
              changed = true;
            }
          }
        }
        qc.setQueryData<Comment[]>(key, previous.filter((c) => !toRemove.has(c.id)));
      }

      return { previous };
    },
    onError: (_err, vars, ctx: { previous?: Comment[] } | undefined) => {
      if (ctx?.previous) qc.setQueryData(["comments", vars.workspaceId], ctx.previous);
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", vars.workspaceId] });
    },
  });
}

export function useAddReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, commentId, emoji }: { workspaceId: string; commentId: string; emoji: string }) =>
      addReaction(workspaceId, commentId, emoji),
    onMutate: async ({ workspaceId, commentId, emoji }) => {
      const key = ["comments", workspaceId];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Comment[]>(key);

      if (previous) {
        qc.setQueryData<Comment[]>(key, previous.map((c) => {
          if (c.id !== commentId) return c;
          const tempReaction: Reaction = {
            id: `temp-${Date.now()}`,
            comment_id: commentId,
            actor_type: "member",
            actor_id: "",
            emoji,
            created_at: new Date().toISOString(),
          };
          return { ...c, reactions: [...(c.reactions ?? []), tempReaction] };
        }));
      }

      return { previous };
    },
    onError: (_err, vars, ctx: { previous?: Comment[] } | undefined) => {
      if (ctx?.previous) qc.setQueryData(["comments", vars.workspaceId], ctx.previous);
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", vars.workspaceId] });
    },
  });
}

export function useRemoveReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, commentId, emoji }: { workspaceId: string; commentId: string; emoji: string }) =>
      removeReaction(workspaceId, commentId, emoji),
    onMutate: async ({ workspaceId, commentId, emoji }) => {
      const key = ["comments", workspaceId];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Comment[]>(key);

      if (previous) {
        qc.setQueryData<Comment[]>(key, previous.map((c) => {
          if (c.id !== commentId) return c;
          return { ...c, reactions: (c.reactions ?? []).filter((r) => !(r.emoji === emoji)) };
        }));
      }

      return { previous };
    },
    onError: (_err, vars, ctx: { previous?: Comment[] } | undefined) => {
      if (ctx?.previous) qc.setQueryData(["comments", vars.workspaceId], ctx.previous);
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", vars.workspaceId] });
    },
  });
}

export function useTimeline(workspaceId: string, issueId: string) {
  return useQuery({
    queryKey: issueKeys.timeline(workspaceId, issueId),
    queryFn: () => listTimeline(workspaceId, issueId),
    enabled: !!workspaceId && !!issueId,
  });
}
