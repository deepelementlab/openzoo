import React, { useState, useEffect, useCallback } from "react";
import {
  useWorkspaceStore,
  useAuthStore,
  useIssue,
  useUpdateIssue,
  useDeleteIssue,
  useAddIssueReaction,
  useRemoveIssueReaction,
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useAddReaction,
  useRemoveReaction,
  useTimeline,
  useIssueSubscribers,
  useSubscribeIssue,
  useUnsubscribeIssue,
  attachRealtimeSync,
  useAgents,
  createTask,
  listTasks,
  listTaskMessages,
  cancelTask,
} from "@openzoo/core";
import { Button, Badge, Spinner, Card, Textarea, Input, Separator } from "@openzoo/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@openzoo/ui";
import { ContentEditor, ReadonlyContent, TitleEditor } from "@openzoo/ui";
import { toast } from "@openzoo/ui";
import type { Issue, IssueStatus, IssuePriority } from "@openzoo/core";
import { useNavigation } from "../navigation";

const STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  blocked: "Blocked",
  cancelled: "Cancelled",
};

const PRIORITY_LABELS: Record<IssuePriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "No Priority",
};

const STATUS_COLORS: Record<string, string> = {
  backlog: "bg-gray-200 text-gray-700",
  todo: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  in_review: "bg-purple-100 text-purple-700",
  done: "bg-green-100 text-green-700",
  blocked: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const QUICK_EMOJIS = ["\u{1F44D}", "\u{1F44E}", "\u{1F389}", "\u{1F680}", "\u{2764}\uFE0F", "\u{1F604}"];

function CommentItem({
  comment,
  onUpdate,
  onDelete,
  onReaction,
}: {
  comment: any;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onReaction: (emoji: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.content ?? "");

  const handleSave = () => {
    if (editValue.trim()) {
      onUpdate(comment.id, editValue);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(comment.content ?? "");
    setIsEditing(false);
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">{comment.author_type ?? "user"}</span>
          <span className="mx-1">&middot;</span>
          <span>{comment.created_at ? new Date(comment.created_at).toLocaleString() : ""}</span>
        </div>
        <button
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          onDoubleClick={() => setIsEditing(true)}
          title="Double-click to edit"
        >
          Edit
        </button>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <ContentEditor
            value={editValue}
            onChange={setEditValue}
            placeholder="Edit comment..."
            minHeight="80px"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={!editValue.trim()}>Save</Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div onDoubleClick={() => setIsEditing(true)}>
          <ReadonlyContent content={comment.content ?? ""} className="text-sm" />
        </div>
      )}

      {comment.reactions && comment.reactions.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {comment.reactions.reduce((acc: any[], r: any) => {
            const existing = acc.find((a) => a.emoji === r.emoji);
            if (existing) existing.count++;
            else acc.push({ emoji: r.emoji, count: 1 });
            return acc;
          }, [] as { emoji: string; count: number }[]).map((r: { emoji: string; count: number }) => (
            <button
              key={r.emoji}
              className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs hover:bg-accent transition-colors"
              onClick={() => onReaction(r.emoji)}
            >
              {r.emoji} {r.count}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-1">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className="text-sm opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => onReaction(emoji)}
            title={`Add ${emoji} reaction`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </Card>
  );
}

function TimelineSection({ entries, visible }: { entries: any[]; visible: boolean }) {
  if (!visible || entries.length === 0) return null;

  const typeIcons: Record<string, string> = {
    status_change: "\u{1F504}",
    comment: "\u{1F4AC}",
    created: "\u{2795}",
    description_change: "\u{270F}\uFE0F",
    title_change: "\u{270F}\uFE0F",
  };

  return (
    <div className="space-y-2 mb-4">
      {entries.map((entry: any) => (
        <div key={entry.id} className="flex items-start gap-2 text-xs text-muted-foreground py-1">
          <span className="shrink-0 mt-0.5">
            {typeIcons[entry.type] ?? "\u{1F4CB}"}
          </span>
          <span>{entry.type.replace(/_/g, " ")}</span>
          {entry.from_value && entry.to_value && (
            <span className="text-foreground/70">
              {" "}from <span className="font-medium">{entry.from_value}</span> to{" "}
              <span className="font-medium">{entry.to_value}</span>
            </span>
          )}
          <span className="ml-auto text-muted-foreground/60">
            {new Date(entry.created_at).toLocaleString()}
          </span>
        </div>
      ))}
      <Separator />
    </div>
  );
}

const TASK_STATUS_ICONS: Record<string, string> = {
  queued: "\u{1F4E6}",
  dispatched: "\u{1F680}",
  running: "\u{2699}\uFE0F",
  completed: "\u{2705}",
  failed: "\u{274C}",
  cancelled: "\u{1F6D1}",
};

const TASK_STATUS_COLORS: Record<string, string> = {
  queued: "bg-gray-100 text-gray-700",
  dispatched: "bg-blue-100 text-blue-700",
  running: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

function TaskMessagesPanel({ messages }: { messages: any[] }) {
  if (messages.length === 0) {
    return <p className="text-xs text-muted-foreground italic py-4 text-center">等待任务消息...</p>;
  }

  const typeIcons: Record<string, string> = {
    text: "\u{1F4AC}",
    thinking: "\u{1F914}",
    tool_use: "\u{1F527}",
    tool_result: "\u{1F4E4}",
    error: "\u{26A0}\uFE0F",
  };

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {messages.map((msg) => (
        <Card key={msg.id} className="p-2 text-xs">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="shrink-0">{typeIcons[msg.type] ?? "\u{1F4CB}"}</span>
            <span className="font-medium text-muted-foreground">{msg.type}</span>
            {msg.tool && <span className="text-muted-foreground/70">({msg.tool})</span>}
            <span className="ml-auto text-muted-foreground/50">#{msg.seq}</span>
          </div>
          {(msg.content || msg.output) && (
            <div className="text-muted-foreground mt-1 whitespace-pre-wrap break-words max-w-full">
              {(msg.content ?? msg.output ?? "").slice(0, 300)}
              {(msg.content ?? msg.output ?? "").length > 300 ? "..." : ""}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

export function IssueDetailPage() {
  const navigation = useNavigation();
  const { issueId } = navigation.useParams<{ issueId: string }>();
  const wsId = useWorkspaceStore((s) => s.currentWorkspace?.id);
  const currentUserId = useAuthStore((s) => s.user?.id);
  console.log("[IssueDetailPage] wsId:", wsId, "issueId:", issueId);

  const [showTimeline, setShowTimeline] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState("");
  const [commentText, setCommentText] = useState("");
  const [runAgentId, setRunAgentId] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [issueTasks, setIssueTasks] = useState<any[]>([]);
  const [taskMessages, setTaskMessages] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: issue, isLoading: issueLoading, refetch: refetchIssue } = useIssue(wsId ?? "", issueId ?? "");
  const { data: comments = [], refetch: refetchComments } = useComments(wsId ?? "", issueId ?? "");
  const { data: timeline = [] } = useTimeline(showTimeline && wsId ? wsId : "", issueId ?? "");
  const { data: subscribers = [], isLoading: subsLoading } = useIssueSubscribers(wsId ?? "", issueId ?? "");
  const { data: agents = [] } = useAgents(wsId ?? "");

  const updateIssue = useUpdateIssue();
  const deleteIssue = useDeleteIssue();
  const addReaction = useAddIssueReaction();
  const removeReaction = useRemoveIssueReaction();
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const addCommentReaction = useAddReaction();
  const removeCommentReaction = useRemoveReaction();
  const subscribe = useSubscribeIssue();
  const unsubscribe = useUnsubscribeIssue();

  useEffect(() => {
    if (issue?.description !== undefined) {
      setDescValue(issue.description ?? "");
    }
  }, [issue?.description]);

  useEffect(() => {
    if (!wsId || !issueId) return;
    return attachRealtimeSync(wsId, {
      onIssueChanged: () => {
        refetchIssue();
        refetchComments();
      },
    });
  }, [wsId, refetchIssue, refetchComments]);

  const loadIssueTasks = useCallback(() => {
    if (!wsId || !issueId) return;
    listTasks({ workspace_id: wsId, issue_id: issueId, limit: 10 }).then((res) => {
      const tasks = (res as any).tasks ?? [];
      setIssueTasks(tasks);
      if (tasks.length > 0 && !selectedTaskId) {
        setSelectedTaskId(tasks[0].id);
      }
    }).catch(() => {});
  }, [wsId, issueId, selectedTaskId]);

  useEffect(() => {
    loadIssueTasks();
  }, [loadIssueTasks]);

  useEffect(() => {
    if (!wsId || !selectedTaskId) return;
    listTaskMessages(wsId, selectedTaskId).then(setTaskMessages).catch(() => {});
  }, [wsId, selectedTaskId]);

  const handleComment = async () => {
    if (!wsId || !issueId || !commentText.trim()) return;
    await createComment.mutateAsync({ workspace_id: wsId, issue_id: issueId, content: commentText });
    setCommentText("");
    refetchComments();
  };

  const handleStatusChange = async (status: string) => {
    if (!wsId || !issueId) return;
    await updateIssue.mutateAsync({ workspaceId: wsId, issueId, data: { status } });
  };

  const handlePriorityChange = async (priority: string) => {
    if (!wsId || !issueId) return;
    await updateIssue.mutateAsync({ workspaceId: wsId, issueId, data: { priority } });
  };

  const handleDescSave = async () => {
    if (!wsId || !issueId) return;
    await updateIssue.mutateAsync({ workspaceId: wsId, issueId, data: { description: descValue } });
    setEditingDesc(false);
  };

  const handleDelete = async () => {
    if (!wsId || !issueId) return;
    await deleteIssue.mutateAsync({ workspaceId: wsId, issueId });
    navigation.navigate("/issues");
  };

  const handleRunAgent = async () => {
    if (!wsId || !issueId) return;
    if (!runAgentId) {
      toast({ title: "请选择 Agent", description: "请先从下拉框中选择一个 Agent", variant: "default" });
      return;
    }
    setIsRunning(true);
    try {
      const task = await createTask({
        workspace_id: wsId,
        issue_id: issueId,
        agent_id: runAgentId,
        prompt: issue?.title ?? "",
      });
      toast({ title: "任务已创建", description: `Task ${task.id.slice(0, 8)} 已加入队列，等待 Daemon 领取执行` });
      await updateIssue.mutateAsync({
        workspaceId: wsId,
        issueId,
        data: { status: "in_progress", assignee_type: "agent", assignee_id: runAgentId },
      });
      const res = await listTasks({ workspace_id: wsId, issue_id: issueId, limit: 10 });
      setIssueTasks((res as any).tasks ?? []);
      refetchIssue();
    } catch (e: any) {
      console.error("Failed to run agent:", e);
      toast({ title: "任务创建失败", description: e?.message ?? "未知错误", variant: "destructive" });
    } finally {
      setIsRunning(false);
    }
  };

  const handleIssueReaction = async (emoji: string) => {
    if (!wsId || !issueId || !issue) return;
    const existing = issue.reactions?.find((r) => r.emoji === emoji);
    if (existing) {
      await removeReaction.mutateAsync({ workspaceId: wsId, issueId, emoji });
    } else {
      await addReaction.mutateAsync({ workspaceId: wsId, issueId, emoji });
    }
  };

  const handleCommentReaction = async (commentId: string, emoji: string) => {
    if (!wsId) return;
    await addCommentReaction.mutateAsync({ workspaceId: wsId, commentId, emoji });
  };

  const handleSubscribe = async () => {
    if (!wsId || !issueId || !currentUserId) return;
    const isSubscribed = subscribers.some((s: any) => s.user_id === currentUserId);
    if (isSubscribed) {
      await unsubscribe.mutateAsync({ workspaceId: wsId, issueId, userId: currentUserId });
    } else {
      await subscribe.mutateAsync({ workspaceId: wsId, issueId, userId: currentUserId });
    }
  };

  const isSubscribed = subscribers.some((s: any) => s.user_id === currentUserId);

  if (!wsId || issueLoading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  if (!issue) {
    return <div className="p-8 text-center text-muted-foreground">Issue not found</div>;
  }

  return (
    <div className="flex gap-6 max-w-6xl mx-auto">
      <div className="flex-1 min-w-0 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigation.navigate("/issues")}>
            &larr; Back
          </Button>
          <span className="text-sm text-muted-foreground font-mono">{issue.identifier ?? issue.id?.slice(0, 8)}</span>
          <Badge className={STATUS_COLORS[issue.status] ?? ""}>
            {STATUS_LABELS[issue.status] ?? issue.status}
          </Badge>
        </div>

        <div className="space-y-4">
          <TitleEditor
            value={issue.title}
            onSubmit={(val: string) => updateIssue.mutate({ workspaceId: wsId!, issueId: issue.id, data: { title: val } })}
            className="text-2xl font-bold"
            placeholder="Issue title"
          />

          {editingDesc ? (
            <div className="space-y-2">
              <ContentEditor
                value={descValue}
                onChange={setDescValue}
                placeholder="Add a description..."
                minHeight="120px"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleDescSave} disabled={updateIssue.isPending}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingDesc(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="text-muted-foreground cursor-pointer hover:bg-muted/30 rounded px-2 -mx-2 py-1 min-h-[2em] transition-colors"
              onClick={() => {
                setEditingDesc(true);
                setDescValue(issue.description ?? "");
              }}
            >
              {issue.description ? (
                <ReadonlyContent content={issue.description} />
              ) : (
                <span className="italic">Add a description...</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {QUICK_EMOJIS.map((emoji) => {
            const count = issue.reactions?.filter((r) => r.emoji === emoji).length ?? 0;
            return (
              <button
                key={emoji}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm border transition-colors ${
                  count > 0 ? "bg-accent border-accent" : "border-transparent hover:border-muted-foreground/30"
                }`}
                onClick={() => handleIssueReaction(emoji)}
              >
                {emoji} {count > 0 && <span className="text-xs">{count}</span>}
              </button>
            );
          })}
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Comments ({comments.length})</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowTimeline(!showTimeline)}>
              {showTimeline ? "Hide Timeline" : "Show Timeline"} ({timeline.length})
            </Button>
          </div>

          <TimelineSection entries={timeline as any[]} visible={showTimeline} />

          <div className="space-y-4">
            {comments.map((c: any) => (
              <CommentItem
                key={c.id}
                comment={c}
                onUpdate={(id, content) => updateComment.mutate({ workspaceId: wsId!, commentId: id, content })}
                onDelete={(id) => deleteComment.mutate({ workspaceId: wsId!, commentId: id })}
                onReaction={(emoji) => handleCommentReaction(c.id, emoji)}
              />
            ))}
          </div>

          <div className="space-y-2">
            <ContentEditor
              value={commentText}
              onChange={setCommentText}
              placeholder="Write a comment... (Cmd+Enter to send)"
              minHeight="80px"
              onSubmit={handleComment}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleComment}
                disabled={!commentText.trim() || createComment.isPending}
              >
                {createComment.isPending ? <Spinner size="sm" /> : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <aside className="w-64 shrink-0 space-y-4">
        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">🤖 Run with Agent</label>
            {agents.length > 0 ? (
              <>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={runAgentId}
                  onChange={(e) => setRunAgentId(e.target.value)}
                >
                  <option value="">Select an agent...</option>
                  {agents.map((a: any) => (
                    <option key={a.id} value={a.id}>🤖 {a.name}</option>
                  ))}
                </select>
                <Button
                  className="w-full"
                  size="sm"
                  disabled={!runAgentId || isRunning}
                  onClick={handleRunAgent}
                >
                  {isRunning ? <><Spinner size="sm" className="mr-1" /> Running...</> : "▶ Run Agent"}
                </Button>
              </>
            ) : (
              <div className="text-xs text-muted-foreground space-y-2">
                <p>No agents available in this workspace.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigation.navigate("/agents")}
                >
                  Create Agent
                </Button>
              </div>
            )}
          </div>
          {issueTasks.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Tasks ({issueTasks.length})</label>
                <div className="space-y-1.5">
                  {issueTasks.slice(0, 5).map((t) => (
                    <button
                      key={t.id}
                      className={`w-full text-left text-xs rounded-md border px-2 py-1.5 transition-colors ${
                        selectedTaskId === t.id
                          ? "bg-accent border-accent"
                          : "border-input hover:border-ring"
                      }`}
                      onClick={() => {
                        setSelectedTaskId(t.id);
                        if (wsId) {
                          listTaskMessages(wsId, t.id).then(setTaskMessages).catch(() => {});
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span>
                          {TASK_STATUS_ICONS[t.status] ?? "\u{1F4CB}"} {t.status}
                        </span>
                        <div className="flex items-center gap-1">
                          {(t.status === "queued" || t.status === "dispatched" || t.status === "running") && (
                            <span
                              className="text-red-400 hover:text-red-600 cursor-pointer text-[10px]"
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelTask(wsId!, t.id).then(() => {
                                  toast({ title: "Task cancelled" });
                                  loadIssueTasks();
                                }).catch((err) => toast({ title: "Cancel failed", description: String(err), variant: "destructive" }));
                              }}
                              title="Cancel task"
                            >
                              ✕
                            </span>
                          )}
                          <Badge className={`text-[10px] ${TASK_STATUS_COLORS[t.status] ?? ""}`}>
                            {t.id.slice(0, 4)}
                          </Badge>
                        </div>
                      </div>
                      {t.error && (
                        <div className="text-red-500 mt-0.5 truncate" title={t.error}>{t.error.slice(0, 40)}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              {selectedTaskId && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Task Messages</label>
                    <TaskMessagesPanel messages={taskMessages} />
                  </div>
                </>
              )}
            </>
          )}
          <Separator />
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={issue.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updateIssue.isPending}
            >
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Priority</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={issue.priority}
              onChange={(e) => handlePriorityChange(e.target.value)}
              disabled={updateIssue.isPending}
            >
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {issue.due_date && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Due Date</label>
              <p className="text-sm">{new Date(issue.due_date).toLocaleDateString()}</p>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Subscribers ({subscribers.length})</label>
            <button
              className={`w-full text-left text-sm rounded-md border px-3 py-2 transition-colors ${
                isSubscribed
                  ? "bg-accent border-accent text-accent-foreground"
                  : "border-input hover:border-ring"
              }`}
              onClick={handleSubscribe}
              disabled={subscribe.isPending || unsubscribe.isPending}
            >
              {isSubscribed ? "\u{1F514} Subscribed" : "\u{1F515} Subscribe"}
            </button>
            {subsLoading && <Spinner size="sm" />}
            {subscribers.length > 0 && (
              <div className="space-y-1 mt-2">
                {(subscribers as any[]).map((sub) => (
                  <div key={sub.id} className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary/30 shrink-0" />
                    <span className="truncate">{sub.user_id?.slice(0, 12) ?? "Unknown"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Details</label>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Created: {issue.created_at ? new Date(issue.created_at).toLocaleString() : "N/A"}</p>
              <p>Updated: {issue.updated_at ? new Date(issue.updated_at).toLocaleString() : "N/A"}</p>
              {issue.assignee_type && (
                <p>Assignee: {issue.assignee_type}/{issue.assignee_id?.slice(0, 8) ?? "N/A"}</p>
              )}
              {issue.project_id && <p>Project: {issue.project_id.slice(0, 8)}</p>}
            </div>
          </div>
        </Card>

        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => setDeleteOpen(true)}
          disabled={deleteIssue.isPending}
        >
          Delete Issue
        </Button>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Issue</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete &quot;{issue.title}&quot;? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteIssue.isPending}>
                {deleteIssue.isPending ? <Spinner size="sm" /> : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </aside>
    </div>
  );
}
