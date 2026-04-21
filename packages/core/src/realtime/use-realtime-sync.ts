import {
  OpenZooRealtimeClient,
  dispatchWSEvent,
  onReconnect,
} from "./centrifugo-provider";
import { queryClient } from "../query-client";
import type { TypedWSEvent } from "../types/events";

export interface RealtimeCallbacks {
  onIssueChanged?: () => void;
  onCommentChanged?: (issueId: string) => void;
  onTaskChanged?: () => void;
  onAgentChanged?: () => void;
  onInboxChanged?: () => void;
  onProjectChanged?: () => void;
  onWorkspaceChanged?: () => void;
  onUnknown?: (type: string) => void;
}

const pendingRefetch = new Map<string, ReturnType<typeof setTimeout>>();
const DEBOUNCE_MS = 100;

function debouncedRefetch(key: string, fn: () => void) {
  if (pendingRefetch.has(key)) {
    clearTimeout(pendingRefetch.get(key)!);
  }
  pendingRefetch.set(key, setTimeout(() => {
    pendingRefetch.delete(key);
    fn();
  }, DEBOUNCE_MS));
}

function applyOptimisticIssueUpdate(event: TypedWSEvent) {
  const payload = (event as any).payload ?? event;
  const wsId = payload.workspace_id ?? "";
  if (!wsId) return;

  const queryKey = ["issues", wsId];
  const current = queryClient.getQueryData<{ issues: any[]; total: number }>(queryKey);
  if (!current?.issues) return;

  const type = event.type as string;

  if (type === "issue:created" && payload.id) {
    const exists = current.issues.some((i: any) => i.id === payload.id);
    if (!exists) {
      queryClient.setQueryData(queryKey, {
        ...current,
        issues: [payload, ...current.issues],
        total: current.total + 1,
      });
    }
    return;
  }

  if (type === "issue:updated" && payload.id) {
    queryClient.setQueryData(queryKey, {
      ...current,
      issues: current.issues.map((i: any) =>
        i.id === payload.id ? { ...i, ...payload } : i
      ),
    });
    queryClient.setQueryData(["issue", wsId, payload.id], (old: any) =>
      old ? { ...old, ...payload } : old
    );
    return;
  }

  if (type === "issue:deleted" && payload.issue_id) {
    queryClient.setQueryData(queryKey, {
      ...current,
      issues: current.issues.filter((i: any) => i.id !== payload.issue_id),
      total: Math.max(0, current.total - 1),
    });
    queryClient.removeQueries({ queryKey: ["issue", wsId, payload.issue_id] });
    return;
  }
}

function applyOptimisticTaskUpdate(event: TypedWSEvent) {
  const payload = (event as any).payload ?? event;
  const wsId = payload.workspace_id ?? "";
  if (!wsId) return;

  const type = event.type as string;

  if (type === "task:message" && payload.task_id) {
    queryClient.invalidateQueries({
      queryKey: ["task-messages", payload.task_id],
    });
    return;
  }

  queryClient.invalidateQueries({ queryKey: ["tasks", wsId] });

  if (payload.task_id) {
    queryClient.invalidateQueries({
      queryKey: ["task", payload.task_id],
    });
  }
}

function applyOptimisticAgentUpdate(event: TypedWSEvent) {
  const payload = (event as any).payload ?? event;
  const wsId = payload.workspace_id ?? "";
  if (!wsId || !payload.id) return;

  const queryKey = ["agents", wsId];
  const current = queryClient.getQueryData<any[]>(queryKey);
  if (!current) return;

  const type = event.type as string;

  if (type === "agent:status") {
    queryClient.setQueryData(queryKey, current.map((a: any) =>
      a.id === payload.id ? { ...a, ...payload } : a
    ));
    queryClient.setQueryData(["agent", wsId, payload.id], (old: any) =>
      old ? { ...old, ...payload } : old
    );
  }
}

export function attachRealtimeSync(
  workspaceId: string,
  callbacks: RealtimeCallbacks
) {
  if (!workspaceId) return () => {};

  const client = new OpenZooRealtimeClient(workspaceId);

  client.subscribe(`workspace:${workspaceId}`, (event) => {
    const type = event.type ?? "";
    const typedEvent = event as unknown as TypedWSEvent;
    dispatchWSEvent(typedEvent);

    if (type.startsWith("issue:") || type.startsWith("issue_reaction:")) {
      applyOptimisticIssueUpdate(typedEvent);
      debouncedRefetch("issues", () => callbacks.onIssueChanged?.());
      return;
    }
    if (type.startsWith("comment:") || type.startsWith("reaction:")) {
      const issueId = String((event as any).issue_id ?? (event as any).payload?.issue_id ?? "");
      debouncedRefetch(`comments-${issueId}`, () => callbacks.onCommentChanged?.(issueId));
      return;
    }
    if (type.startsWith("task:")) {
      applyOptimisticTaskUpdate(typedEvent);
      debouncedRefetch("tasks", () => callbacks.onTaskChanged?.());
      return;
    }
    if (type.startsWith("agent:")) {
      applyOptimisticAgentUpdate(typedEvent);
      debouncedRefetch("agents", () => callbacks.onAgentChanged?.());
      return;
    }
    if (type.startsWith("inbox:")) {
      debouncedRefetch("inbox", () => callbacks.onInboxChanged?.());
      return;
    }
    if (type.startsWith("project:")) {
      debouncedRefetch("projects", () => callbacks.onProjectChanged?.());
      return;
    }
    if (type.startsWith("workspace:") || type.startsWith("member:")) {
      debouncedRefetch("workspace", () => callbacks.onWorkspaceChanged?.());
      return;
    }
    callbacks.onUnknown?.(type);
  });

  client.connect();

  const unsubReconnect = onReconnect(() => {
    queryClient.invalidateQueries({ queryKey: ["issues", workspaceId] });
    queryClient.invalidateQueries({ queryKey: ["tasks", workspaceId] });
    queryClient.invalidateQueries({ queryKey: ["agents", workspaceId] });
    queryClient.invalidateQueries({ queryKey: ["inbox", workspaceId] });
  });

  return () => {
    client.disconnect();
    unsubReconnect();
  };
}

export { useWSEvent } from "./centrifugo-provider";
