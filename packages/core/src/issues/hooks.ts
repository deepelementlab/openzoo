import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listIssues, getIssue, searchIssues, listIssueSubscribers, issueKeys } from "../issues/queries";
import { createIssue, updateIssue, deleteIssue, batchUpdateIssues, addIssueReaction, removeIssueReaction, subscribeIssue, unsubscribeIssue } from "../issues/mutations";
import type { Issue, IssueSubscriber } from "../types";

interface IssueListData {
  issues: Issue[];
  total: number;
}

export function useIssues(workspaceId: string, params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: issueKeys.list(workspaceId, params as Record<string, unknown>),
    queryFn: () => listIssues({ workspace_id: workspaceId, ...params }),
    enabled: !!workspaceId,
    select: (data) => ({ issues: data.issues ?? [], total: data.total ?? 0 }),
  });
}

export function useIssue(workspaceId: string, issueId: string) {
  return useQuery({
    queryKey: issueKeys.detail(workspaceId, issueId),
    queryFn: () => getIssue(workspaceId, issueId),
    enabled: !!workspaceId && !!issueId,
  });
}

export function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createIssue,
    onSuccess: (newIssue, vars) => {
      const key = issueKeys.list(vars.workspace_id);
      qc.setQueryData<IssueListData>(key, (old) =>
        old && !old.issues.some((i) => i.id === newIssue.id)
          ? { ...old, issues: [...old.issues, newIssue], total: old.total + 1 }
          : old,
      );
      if (newIssue.parent_issue_id) {
        qc.invalidateQueries({ queryKey: issueKeys.detail(vars.workspace_id, newIssue.parent_issue_id) });
      }
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: issueKeys.list(vars.workspace_id) });
    },
  });
}

export function useUpdateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, issueId, data }: { workspaceId: string; issueId: string; data: Record<string, unknown> }) =>
      updateIssue(workspaceId, issueId, data),
    onMutate: async ({ workspaceId, issueId, data }) => {
      const listKey = issueKeys.list(workspaceId);
      const detailKey = issueKeys.detail(workspaceId, issueId);

      qc.cancelQueries({ queryKey: listKey });

      const prevList = qc.getQueryData<IssueListData>(listKey);
      const prevDetail = qc.getQueryData<Issue>(detailKey);

      const parentId =
        prevDetail?.parent_issue_id ??
        prevList?.issues.find((i) => i.id === issueId)?.parent_issue_id ??
        null;

      if (prevList) {
        qc.setQueryData<IssueListData>(listKey, {
          ...prevList,
          issues: prevList.issues.map((i) =>
            i.id === issueId ? { ...i, ...data } : i,
          ),
        });
      }

      if (prevDetail) {
        qc.setQueryData<Issue>(detailKey, { ...prevDetail, ...data });
      }

      return { prevList, prevDetail, parentId };
    },
    onError: (_err, vars, ctx: { prevList?: IssueListData; prevDetail?: Issue; parentId?: string | null } | undefined) => {
      if (ctx?.prevList) qc.setQueryData(issueKeys.list(vars.workspaceId), ctx.prevList);
      if (ctx?.prevDetail) qc.setQueryData(issueKeys.detail(vars.workspaceId, vars.issueId), ctx.prevDetail);
    },
    onSettled: (_, __, vars, ctx) => {
      qc.invalidateQueries({ queryKey: issueKeys.detail(vars.workspaceId, vars.issueId) });
      qc.invalidateQueries({ queryKey: issueKeys.list(vars.workspaceId) });
      if (ctx?.parentId) {
        qc.invalidateQueries({ queryKey: issueKeys.detail(vars.workspaceId, ctx.parentId) });
      }
    },
  });
}

export function useDeleteIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, issueId }: { workspaceId: string; issueId: string }) =>
      deleteIssue(workspaceId, issueId),
    onMutate: async ({ workspaceId, issueId }) => {
      const listKey = issueKeys.list(workspaceId);
      await qc.cancelQueries({ queryKey: listKey });
      const prevList = qc.getQueryData<IssueListData>(listKey);
      const deleted = prevList?.issues.find((i) => i.id === issueId);

      if (prevList) {
        qc.setQueryData<IssueListData>(listKey, {
          ...prevList,
          issues: prevList.issues.filter((i) => i.id !== issueId),
          total: prevList.total - 1,
        });
      }

      qc.removeQueries({ queryKey: issueKeys.detail(workspaceId, issueId) });

      return { prevList, parentIssueId: deleted?.parent_issue_id ?? null };
    },
    onError: (_err, vars, ctx: { prevList?: IssueListData; parentIssueId?: string | null } | undefined) => {
      if (ctx?.prevList) qc.setQueryData(issueKeys.list(vars.workspaceId), ctx.prevList);
    },
    onSettled: (_, __, vars, ctx) => {
      qc.invalidateQueries({ queryKey: issueKeys.list(vars.workspaceId) });
      if (ctx?.parentIssueId) {
        qc.invalidateQueries({ queryKey: issueKeys.detail(vars.workspaceId, ctx.parentIssueId) });
      }
    },
  });
}

export function useBatchUpdateIssues() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, issueIds, data }: { workspaceId: string; issueIds: string[]; data: Record<string, unknown> }) =>
      batchUpdateIssues(workspaceId, issueIds, data),
    onMutate: async ({ workspaceId, issueIds, data }) => {
      const listKey = issueKeys.list(workspaceId);
      await qc.cancelQueries({ queryKey: listKey });
      const prevList = qc.getQueryData<IssueListData>(listKey);

      if (prevList) {
        const idSet = new Set(issueIds);
        qc.setQueryData<IssueListData>(listKey, {
          ...prevList,
          issues: prevList.issues.map((i) =>
            idSet.has(i.id) ? { ...i, ...data } : i,
          ),
        });
      }

      return { prevList };
    },
    onError: (_err, vars, ctx: { prevList?: IssueListData } | undefined) => {
      if (ctx?.prevList) qc.setQueryData(issueKeys.list(vars.workspaceId), ctx.prevList);
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: issueKeys.list(vars.workspaceId) });
      for (const id of vars.issueIds) {
        qc.invalidateQueries({ queryKey: issueKeys.detail(vars.workspaceId, id) });
      }
    },
  });
}

export function useAddIssueReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, issueId, emoji }: { workspaceId: string; issueId: string; emoji: string }) =>
      addIssueReaction(workspaceId, issueId, emoji),
    onMutate: async ({ workspaceId, issueId, emoji }) => {
      const detailKey = issueKeys.detail(workspaceId, issueId);
      const listKey = issueKeys.list(workspaceId);
      await qc.cancelQueries({ queryKey: detailKey });

      const prevDetail = qc.getQueryData<Issue>(detailKey);
      if (prevDetail) {
        const tempReaction = {
          id: `temp-${Date.now()}`,
          issue_id: issueId,
          actor_type: "member",
          actor_id: "",
          emoji,
          created_at: new Date().toISOString(),
        };
        qc.setQueryData<Issue>(detailKey, {
          ...prevDetail,
          reactions: [...(prevDetail.reactions ?? []), tempReaction],
        });
      }

      return { prevDetail };
    },
    onError: (_err, vars, ctx: { prevDetail?: Issue } | undefined) => {
      if (ctx?.prevDetail) qc.setQueryData(issueKeys.detail(vars.workspaceId, vars.issueId), ctx.prevDetail);
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: issueKeys.detail(vars.workspaceId, vars.issueId) });
      qc.invalidateQueries({ queryKey: issueKeys.list(vars.workspaceId) });
    },
  });
}

export function useRemoveIssueReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, issueId, emoji }: { workspaceId: string; issueId: string; emoji: string }) =>
      removeIssueReaction(workspaceId, issueId, emoji),
    onMutate: async ({ workspaceId, issueId, emoji }) => {
      const detailKey = issueKeys.detail(workspaceId, issueId);
      await qc.cancelQueries({ queryKey: detailKey });

      const prevDetail = qc.getQueryData<Issue>(detailKey);
      if (prevDetail) {
        qc.setQueryData<Issue>(detailKey, {
          ...prevDetail,
          reactions: (prevDetail.reactions ?? []).filter((r) => r.emoji !== emoji),
        });
      }

      return { prevDetail };
    },
    onError: (_err, vars, ctx: { prevDetail?: Issue } | undefined) => {
      if (ctx?.prevDetail) qc.setQueryData(issueKeys.detail(vars.workspaceId, vars.issueId), ctx.prevDetail);
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: issueKeys.detail(vars.workspaceId, vars.issueId) });
      qc.invalidateQueries({ queryKey: issueKeys.list(vars.workspaceId) });
    },
  });
}

export function useIssueSubscribers(workspaceId: string, issueId: string) {
  return useQuery({
    queryKey: issueKeys.subscribers(workspaceId, issueId),
    queryFn: () => listIssueSubscribers(workspaceId, issueId),
    enabled: !!workspaceId && !!issueId,
  });
}

export function useSubscribeIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, issueId, userId }: { workspaceId: string; issueId: string; userId: string }) =>
      subscribeIssue(workspaceId, issueId, userId),
    onMutate: async ({ workspaceId, issueId, userId }) => {
      const key = issueKeys.subscribers(workspaceId, issueId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<IssueSubscriber[]>(key);

      const temp: IssueSubscriber = {
        issue_id: issueId,
        user_type: "member",
        user_id: userId,
        reason: "manual",
        created_at: new Date().toISOString(),
      };

      if (previous) {
        if (!previous.some((s) => s.user_id === userId)) {
          qc.setQueryData<IssueSubscriber[]>(key, [...previous, temp]);
        }
      } else {
        qc.setQueryData<IssueSubscriber[]>(key, [temp]);
      }

      return { previous };
    },
    onError: (_err, vars, ctx: { previous?: IssueSubscriber[] } | undefined) => {
      if (ctx?.previous) qc.setQueryData(issueKeys.subscribers(vars.workspaceId, vars.issueId), ctx.previous);
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: issueKeys.subscribers(vars.workspaceId, vars.issueId) });
    },
  });
}

export function useUnsubscribeIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, issueId, userId }: { workspaceId: string; issueId: string; userId: string }) =>
      unsubscribeIssue(workspaceId, issueId, userId),
    onMutate: async ({ workspaceId, issueId, userId }) => {
      const key = issueKeys.subscribers(workspaceId, issueId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<IssueSubscriber[]>(key);
      if (previous) {
        qc.setQueryData<IssueSubscriber[]>(key, previous.filter((s) => s.user_id !== userId));
      }
      return { previous };
    },
    onError: (_err, vars, ctx: { previous?: IssueSubscriber[] } | undefined) => {
      if (ctx?.previous) qc.setQueryData(issueKeys.subscribers(vars.workspaceId, vars.issueId), ctx.previous);
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: issueKeys.subscribers(vars.workspaceId, vars.issueId) });
    },
  });
}
