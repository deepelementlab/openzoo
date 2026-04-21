'use strict';

var reactQuery = require('@tanstack/react-query');
var zustand = require('zustand');
var centrifuge = require('centrifuge');
var react = require('react');
var jsxRuntime = require('react/jsx-runtime');

var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/api/client.ts
function resolveBaseUrl() {
  try {
    const env = undefined;
    if (env?.VITE_API_URL) return env.VITE_API_URL;
    if (env?.VITE_OPENZOO_API_BASE_URL) return env.VITE_OPENZOO_API_BASE_URL;
  } catch {
  }
  if (typeof process !== "undefined" && process.env?.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  if (typeof process !== "undefined" && process.env?.VITE_OPENZOO_API_BASE_URL) {
    return process.env.VITE_OPENZOO_API_BASE_URL;
  }
  return "http://localhost:8080";
}
function getApiClient() {
  if (!_client) {
    _client = new ApiClient({
      getToken: () => _token,
      getWorkspaceId: () => _workspaceId,
      onUnauthorized: () => {
        _token = null;
        _onUnauthorized?.();
      }
    });
  }
  return _client;
}
function configureApiClient(config) {
  _client = new ApiClient(config);
}
function setToken(token) {
  _token = token;
}
function getToken() {
  return _token;
}
function setWorkspaceId(id) {
  _workspaceId = id;
}
function getWorkspaceId() {
  return _workspaceId;
}
function onUnauthorized(cb) {
  _onUnauthorized = cb;
}
var ApiClient, _token, _workspaceId, _onUnauthorized, _client;
var init_client = __esm({
  "src/api/client.ts"() {
    ApiClient = class {
      config;
      constructor(config) {
        this.config = config ?? {};
      }
      get baseUrl() {
        return this.config.baseUrl ?? resolveBaseUrl();
      }
      async call(route, body = {}) {
        const headers = { "Content-Type": "application/json" };
        const token = this.config.getToken?.() ?? _token;
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const wsId = this.config.getWorkspaceId?.() ?? _workspaceId;
        if (wsId) headers["X-Workspace-ID"] = wsId;
        const res = await fetch(`${this.baseUrl}${route}`, {
          method: "POST",
          headers,
          body: JSON.stringify(body)
        });
        if (res.status === 401) {
          _token = null;
          _onUnauthorized?.();
          throw new Error("Unauthorized");
        }
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`RPC ${route} failed: ${res.status} ${text}`);
        }
        return await res.json();
      }
    };
    _token = null;
    _workspaceId = null;
    _client = null;
  }
});

// src/api/connect-client.ts
var init_connect_client = __esm({
  "src/api/connect-client.ts"() {
    init_client();
  }
});

// src/workspace/queries.ts
var queries_exports = {};
__export(queries_exports, {
  createMember: () => createMember,
  createWorkspace: () => createWorkspace,
  deleteMember: () => deleteMember,
  deleteWorkspace: () => deleteWorkspace,
  getWorkspace: () => getWorkspace,
  listMembers: () => listMembers,
  listWorkspaces: () => listWorkspaces,
  updateMember: () => updateMember,
  updateWorkspace: () => updateWorkspace
});
async function listWorkspaces() {
  const res = await getApiClient().call("/rpc/workspace/list");
  return res.workspaces ?? [];
}
async function getWorkspace(workspaceId) {
  return getApiClient().call("/rpc/workspace/get", { workspace_id: workspaceId });
}
async function createWorkspace(data) {
  return getApiClient().call("/rpc/workspace/create", data);
}
async function updateWorkspace(workspaceId, data) {
  return getApiClient().call("/rpc/workspace/update", { workspace_id: workspaceId, ...data });
}
async function deleteWorkspace(workspaceId) {
  await getApiClient().call("/rpc/workspace/delete", { workspace_id: workspaceId });
}
async function listMembers(workspaceId) {
  const res = await getApiClient().call("/rpc/member/list", { workspace_id: workspaceId });
  return res.members ?? [];
}
async function createMember(workspaceId, email, role) {
  return getApiClient().call("/rpc/member/create", { workspace_id: workspaceId, email, role: role ?? "member" });
}
async function updateMember(workspaceId, memberId, role) {
  return getApiClient().call("/rpc/member/update", { workspace_id: workspaceId, member_id: memberId, role });
}
async function deleteMember(workspaceId, memberId) {
  await getApiClient().call("/rpc/member/delete", { workspace_id: workspaceId, member_id: memberId });
}
var init_queries = __esm({
  "src/workspace/queries.ts"() {
    init_connect_client();
  }
});

// src/index.ts
init_connect_client();
var queryClient = new reactQuery.QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1e3 * 60 * 5,
      gcTime: 1e3 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 0
    }
  }
});
function invalidateQuery(queryKey, workspaceId) {
  queryClient.invalidateQueries({ queryKey: workspaceId ? [queryKey, workspaceId] : queryKey });
}
function setQueryData(queryKey, data) {
  queryClient.setQueryData(queryKey, data);
}
function getQueryData(queryKey) {
  return queryClient.getQueryData(queryKey);
}

// src/auth/store.ts
init_connect_client();

// src/workspace/store.ts
init_connect_client();
var useWorkspaceStore = zustand.create((set, get) => ({
  currentWorkspace: null,
  workspaces: [],
  isLoading: false,
  setCurrentWorkspace: (ws) => {
    set({ currentWorkspace: ws });
    if (typeof localStorage !== "undefined" && ws) {
      localStorage.setItem("openzoo_workspace_id", ws.id);
    }
    setWorkspaceId(ws?.id ?? null);
  },
  setWorkspaces: (ws) => set({ workspaces: ws }),
  loadWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const { listWorkspaces: listWorkspaces2 } = await Promise.resolve().then(() => (init_queries(), queries_exports));
      const workspaces = await listWorkspaces2();
      set({ workspaces, isLoading: false });
      if (workspaces.length > 0) {
        const savedId = typeof localStorage !== "undefined" ? localStorage.getItem("openzoo_workspace_id") : null;
        const saved = savedId ? workspaces.find((w) => w.id === savedId) : null;
        if (saved) {
          set({ currentWorkspace: saved });
        } else if (!get().currentWorkspace) {
          set({ currentWorkspace: workspaces[0] });
        }
      }
    } catch {
      set({ isLoading: false });
    }
  }
}));

// src/auth/store.ts
init_queries();
var TOKEN_KEY = "openzoo_token";
var USER_KEY = "openzoo_user";
var useAuthStore = zustand.create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  setAuth: (user, token) => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ user, token, isAuthenticated: true, error: null });
  },
  clearAuth: () => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    setToken(null);
    set({ user: null, token: null, isAuthenticated: false });
  },
  loadFromStorage: () => {
    if (typeof localStorage === "undefined") return;
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setToken(token);
        set({ user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
  },
  sendCode: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await getApiClient().call("/rpc/auth/send-code", { email });
      set({ isLoading: false });
      return true;
    } catch (e) {
      set({ isLoading: false, error: e.message });
      return false;
    }
  },
  verifyCode: async (email, code) => {
    set({ isLoading: true, error: null });
    try {
      const res = await getApiClient().call("/rpc/auth/verify-code", { email, code });
      get().setAuth(res.user, res.token);
      setToken(res.token);
      const workspaces = await listWorkspaces();
      useWorkspaceStore.getState().setWorkspaces(workspaces);
      if (workspaces.length > 0) {
        useWorkspaceStore.getState().setCurrentWorkspace(workspaces[0]);
      }
    } catch (e) {
      set({ error: e.message });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },
  logout: () => {
    get().clearAuth();
    useWorkspaceStore.getState().setCurrentWorkspace(null);
    useWorkspaceStore.getState().setWorkspaces([]);
  }
}));

// src/auth/queries.ts
init_connect_client();
async function sendVerificationCode(email) {
  try {
    await getApiClient().call("/rpc/auth/send-code", { email });
    return true;
  } catch {
    return false;
  }
}
async function verifyCode(email, code) {
  return getApiClient().call("/rpc/auth/verify-code", { email, code });
}
async function getCurrentUser() {
  return getApiClient().call("/rpc/auth/me");
}
async function updateCurrentUser(data) {
  return getApiClient().call("/rpc/auth/update-me", data);
}

// src/index.ts
init_queries();

// src/workspace/hooks.ts
init_queries();
function useWorkspaces() {
  return reactQuery.useQuery({
    queryKey: ["workspaces"],
    queryFn: listWorkspaces,
    staleTime: 1e3 * 60 * 30
  });
}
function useWorkspace(workspaceId) {
  return reactQuery.useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: () => getWorkspace(workspaceId),
    enabled: !!workspaceId
  });
}
function useCreateWorkspace() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: createWorkspace,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspaces"] });
    }
  });
}
function useUpdateWorkspace() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, data }) => updateWorkspace(workspaceId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["workspaces"] });
      qc.invalidateQueries({ queryKey: ["workspace", vars.workspaceId] });
    }
  });
}
function useDeleteWorkspace() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspaces"] });
    }
  });
}
function useMembers(workspaceId) {
  return reactQuery.useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => listMembers(workspaceId),
    enabled: !!workspaceId
  });
}
function useCreateMember() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, email, role }) => createMember(workspaceId, email, role),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["members", vars.workspaceId] });
    }
  });
}
function useUpdateMember() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, memberId, role }) => updateMember(workspaceId, memberId, role),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["members", vars.workspaceId] });
    }
  });
}
function useDeleteMember() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, memberId }) => deleteMember(workspaceId, memberId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["members", vars.workspaceId] });
    }
  });
}

// src/issues/queries.ts
init_connect_client();
var issueKeys = {
  all: (wsId) => ["issues", wsId],
  list: (wsId, params) => ["issues", wsId, params],
  detail: (wsId, id) => ["issue", wsId, id],
  subscribers: (wsId, id) => ["issue-subscribers", wsId, id],
  reactions: (wsId, id) => ["issue-reactions", wsId, id],
  timeline: (wsId, id) => ["timeline", wsId, id],
  comments: (wsId, id) => ["comments", wsId, id]
};
async function listIssues(params) {
  return getApiClient().call("/rpc/issue/list", { ...params });
}
async function getIssue(workspaceId, issueId) {
  return getApiClient().call("/rpc/issue/get", { workspace_id: workspaceId, issue_id: issueId });
}
async function searchIssues(workspaceId, query, limit = 20) {
  return getApiClient().call("/rpc/search/issues", { workspace_id: workspaceId, query, limit });
}
async function listIssueSubscribers(workspaceId, issueId) {
  const res = await getApiClient().call("/rpc/issue/subscribers", { workspace_id: workspaceId, issue_id: issueId });
  return res.subscribers ?? [];
}

// src/issues/mutations.ts
init_connect_client();
async function createIssue(data) {
  return getApiClient().call("/rpc/issue/create", data);
}
async function updateIssue(workspaceId, issueId, data) {
  return getApiClient().call("/rpc/issue/update", { workspace_id: workspaceId, issue_id: issueId, ...data });
}
async function deleteIssue(workspaceId, issueId) {
  await getApiClient().call("/rpc/issue/delete", { workspace_id: workspaceId, issue_id: issueId });
}
async function batchUpdateIssues(workspaceId, issueIds, data) {
  return getApiClient().call("/rpc/issue/batch-update", { workspace_id: workspaceId, issue_ids: issueIds, ...data });
}
async function addIssueReaction(workspaceId, issueId, emoji) {
  return getApiClient().call("/rpc/issue/add-reaction", { workspace_id: workspaceId, issue_id: issueId, emoji });
}
async function removeIssueReaction(workspaceId, issueId, emoji) {
  await getApiClient().call("/rpc/issue/remove-reaction", { workspace_id: workspaceId, issue_id: issueId, emoji });
}
async function subscribeIssue(workspaceId, issueId, userId) {
  return getApiClient().call("/rpc/issue/subscribe", {
    workspace_id: workspaceId,
    issue_id: issueId,
    user_id: userId
  });
}
async function unsubscribeIssue(workspaceId, issueId, userId) {
  await getApiClient().call("/rpc/issue/unsubscribe", {
    workspace_id: workspaceId,
    issue_id: issueId,
    user_id: userId
  });
}
var defaultFilters = {
  status: null,
  priority: null,
  assignee_id: null,
  project_id: null,
  search: "",
  view_mode: "list"
};
var useIssueViewStore = zustand.create((set) => ({
  filters: { ...defaultFilters },
  selected_issue_id: null,
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  setSelectedIssueId: (id) => set({ selected_issue_id: id }),
  resetFilters: () => set({ filters: { ...defaultFilters } })
}));
function useIssues(workspaceId, params) {
  return reactQuery.useQuery({
    queryKey: issueKeys.list(workspaceId, params),
    queryFn: () => listIssues({ workspace_id: workspaceId, ...params }),
    enabled: !!workspaceId,
    select: (data) => ({ issues: data.issues ?? [], total: data.total ?? 0 })
  });
}
function useIssue(workspaceId, issueId) {
  return reactQuery.useQuery({
    queryKey: issueKeys.detail(workspaceId, issueId),
    queryFn: () => getIssue(workspaceId, issueId),
    enabled: !!workspaceId && !!issueId
  });
}
function useCreateIssue() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: createIssue,
    onSuccess: (newIssue, vars) => {
      const key = issueKeys.list(vars.workspace_id);
      qc.setQueryData(
        key,
        (old) => old && !old.issues.some((i) => i.id === newIssue.id) ? { ...old, issues: [...old.issues, newIssue], total: old.total + 1 } : old
      );
      if (newIssue.parent_issue_id) {
        qc.invalidateQueries({ queryKey: issueKeys.detail(vars.workspace_id, newIssue.parent_issue_id) });
      }
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: issueKeys.list(vars.workspace_id) });
    }
  });
}
function useUpdateIssue() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, issueId, data }) => updateIssue(workspaceId, issueId, data),
    onMutate: async ({ workspaceId, issueId, data }) => {
      const listKey = issueKeys.list(workspaceId);
      const detailKey = issueKeys.detail(workspaceId, issueId);
      qc.cancelQueries({ queryKey: listKey });
      const prevList = qc.getQueryData(listKey);
      const prevDetail = qc.getQueryData(detailKey);
      const parentId = prevDetail?.parent_issue_id ?? prevList?.issues.find((i) => i.id === issueId)?.parent_issue_id ?? null;
      if (prevList) {
        qc.setQueryData(listKey, {
          ...prevList,
          issues: prevList.issues.map(
            (i) => i.id === issueId ? { ...i, ...data } : i
          )
        });
      }
      if (prevDetail) {
        qc.setQueryData(detailKey, { ...prevDetail, ...data });
      }
      return { prevList, prevDetail, parentId };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.prevList) qc.setQueryData(issueKeys.list(vars.workspaceId), ctx.prevList);
      if (ctx?.prevDetail) qc.setQueryData(issueKeys.detail(vars.workspaceId, vars.issueId), ctx.prevDetail);
    },
    onSettled: (_, __, vars, ctx) => {
      qc.invalidateQueries({ queryKey: issueKeys.detail(vars.workspaceId, vars.issueId) });
      qc.invalidateQueries({ queryKey: issueKeys.list(vars.workspaceId) });
      if (ctx?.parentId) {
        qc.invalidateQueries({ queryKey: issueKeys.detail(vars.workspaceId, ctx.parentId) });
      }
    }
  });
}
function useDeleteIssue() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, issueId }) => deleteIssue(workspaceId, issueId),
    onMutate: async ({ workspaceId, issueId }) => {
      const listKey = issueKeys.list(workspaceId);
      await qc.cancelQueries({ queryKey: listKey });
      const prevList = qc.getQueryData(listKey);
      const deleted = prevList?.issues.find((i) => i.id === issueId);
      if (prevList) {
        qc.setQueryData(listKey, {
          ...prevList,
          issues: prevList.issues.filter((i) => i.id !== issueId),
          total: prevList.total - 1
        });
      }
      qc.removeQueries({ queryKey: issueKeys.detail(workspaceId, issueId) });
      return { prevList, parentIssueId: deleted?.parent_issue_id ?? null };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.prevList) qc.setQueryData(issueKeys.list(vars.workspaceId), ctx.prevList);
    },
    onSettled: (_, __, vars, ctx) => {
      qc.invalidateQueries({ queryKey: issueKeys.list(vars.workspaceId) });
      if (ctx?.parentIssueId) {
        qc.invalidateQueries({ queryKey: issueKeys.detail(vars.workspaceId, ctx.parentIssueId) });
      }
    }
  });
}
function useAddIssueReaction() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, issueId, emoji }) => addIssueReaction(workspaceId, issueId, emoji),
    onMutate: async ({ workspaceId, issueId, emoji }) => {
      const detailKey = issueKeys.detail(workspaceId, issueId);
      issueKeys.list(workspaceId);
      await qc.cancelQueries({ queryKey: detailKey });
      const prevDetail = qc.getQueryData(detailKey);
      if (prevDetail) {
        const tempReaction = {
          id: `temp-${Date.now()}`,
          issue_id: issueId,
          actor_type: "member",
          actor_id: "",
          emoji,
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        qc.setQueryData(detailKey, {
          ...prevDetail,
          reactions: [...prevDetail.reactions ?? [], tempReaction]
        });
      }
      return { prevDetail };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.prevDetail) qc.setQueryData(issueKeys.detail(vars.workspaceId, vars.issueId), ctx.prevDetail);
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: issueKeys.detail(vars.workspaceId, vars.issueId) });
      qc.invalidateQueries({ queryKey: issueKeys.list(vars.workspaceId) });
    }
  });
}
function useRemoveIssueReaction() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, issueId, emoji }) => removeIssueReaction(workspaceId, issueId, emoji),
    onMutate: async ({ workspaceId, issueId, emoji }) => {
      const detailKey = issueKeys.detail(workspaceId, issueId);
      await qc.cancelQueries({ queryKey: detailKey });
      const prevDetail = qc.getQueryData(detailKey);
      if (prevDetail) {
        qc.setQueryData(detailKey, {
          ...prevDetail,
          reactions: (prevDetail.reactions ?? []).filter((r) => r.emoji !== emoji)
        });
      }
      return { prevDetail };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.prevDetail) qc.setQueryData(issueKeys.detail(vars.workspaceId, vars.issueId), ctx.prevDetail);
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: issueKeys.detail(vars.workspaceId, vars.issueId) });
      qc.invalidateQueries({ queryKey: issueKeys.list(vars.workspaceId) });
    }
  });
}
function useIssueSubscribers(workspaceId, issueId) {
  return reactQuery.useQuery({
    queryKey: issueKeys.subscribers(workspaceId, issueId),
    queryFn: () => listIssueSubscribers(workspaceId, issueId),
    enabled: !!workspaceId && !!issueId
  });
}
function useSubscribeIssue() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, issueId, userId }) => subscribeIssue(workspaceId, issueId, userId),
    onMutate: async ({ workspaceId, issueId, userId }) => {
      const key = issueKeys.subscribers(workspaceId, issueId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData(key);
      const temp = {
        issue_id: issueId,
        user_type: "member",
        user_id: userId,
        reason: "manual",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (previous) {
        if (!previous.some((s) => s.user_id === userId)) {
          qc.setQueryData(key, [...previous, temp]);
        }
      } else {
        qc.setQueryData(key, [temp]);
      }
      return { previous };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(issueKeys.subscribers(vars.workspaceId, vars.issueId), ctx.previous);
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: issueKeys.subscribers(vars.workspaceId, vars.issueId) });
    }
  });
}
function useUnsubscribeIssue() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, issueId, userId }) => unsubscribeIssue(workspaceId, issueId, userId),
    onMutate: async ({ workspaceId, issueId, userId }) => {
      const key = issueKeys.subscribers(workspaceId, issueId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData(key);
      if (previous) {
        qc.setQueryData(key, previous.filter((s) => s.user_id !== userId));
      }
      return { previous };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(issueKeys.subscribers(vars.workspaceId, vars.issueId), ctx.previous);
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: issueKeys.subscribers(vars.workspaceId, vars.issueId) });
    }
  });
}

// src/agents/queries.ts
init_connect_client();
async function listAgents(workspaceId) {
  const res = await getApiClient().call("/rpc/agent/list", { workspace_id: workspaceId });
  return res.agents ?? [];
}
async function getAgent(workspaceId, agentId) {
  return getApiClient().call("/rpc/agent/get", { workspace_id: workspaceId, agent_id: agentId });
}
async function createAgent(data) {
  return getApiClient().call("/rpc/agent/create", data);
}
async function updateAgent(workspaceId, agentId, data) {
  return getApiClient().call("/rpc/agent/update", { workspace_id: workspaceId, agent_id: agentId, ...data });
}
async function archiveAgent(workspaceId, agentId) {
  return getApiClient().call("/rpc/agent/archive", { workspace_id: workspaceId, agent_id: agentId });
}
async function restoreAgent(workspaceId, agentId) {
  return getApiClient().call("/rpc/agent/restore", { workspace_id: workspaceId, agent_id: agentId });
}
async function setAgentSkills(workspaceId, agentId, skillIds) {
  return getApiClient().call("/rpc/agent/set-skills", { workspace_id: workspaceId, agent_id: agentId, skill_ids: skillIds });
}
async function listSkills(workspaceId) {
  const res = await getApiClient().call("/rpc/skill/list", { workspace_id: workspaceId });
  return res.skills ?? [];
}
async function createSkill(data) {
  return getApiClient().call("/rpc/skill/create", data);
}
async function updateSkill(workspaceId, skillId, data) {
  return getApiClient().call("/rpc/skill/update", { workspace_id: workspaceId, skill_id: skillId, ...data });
}
async function deleteSkill(workspaceId, skillId) {
  await getApiClient().call("/rpc/skill/delete", { workspace_id: workspaceId, skill_id: skillId });
}
function useAgents(workspaceId) {
  return reactQuery.useQuery({
    queryKey: ["agents", workspaceId],
    queryFn: () => listAgents(workspaceId),
    enabled: !!workspaceId
  });
}
function useAgent(workspaceId, agentId) {
  return reactQuery.useQuery({
    queryKey: ["agent", workspaceId, agentId],
    queryFn: () => getAgent(workspaceId, agentId),
    enabled: !!workspaceId && !!agentId
  });
}
function useCreateAgent() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: createAgent,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["agents", vars.workspace_id] });
    }
  });
}
function useUpdateAgent() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, agentId, data }) => updateAgent(workspaceId, agentId, data),
    onMutate: async ({ workspaceId, agentId, data }) => {
      await qc.cancelQueries({ queryKey: ["agents", workspaceId] });
      const previous = qc.getQueryData(["agents", workspaceId]);
      if (previous) {
        qc.setQueryData(["agents", workspaceId], previous.map((a) => a.id === agentId ? { ...a, ...data } : a));
      }
      return { previous };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(["agents", vars.workspaceId], ctx.previous);
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["agents", vars.workspaceId] });
      qc.invalidateQueries({ queryKey: ["agent", vars.workspaceId, vars.agentId] });
    }
  });
}
function useArchiveAgent() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, agentId }) => archiveAgent(workspaceId, agentId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["agents", vars.workspaceId] });
    }
  });
}
function useRestoreAgent() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, agentId }) => restoreAgent(workspaceId, agentId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["agents", vars.workspaceId] });
    }
  });
}
function useSkills(workspaceId) {
  return reactQuery.useQuery({
    queryKey: ["skills", workspaceId],
    queryFn: () => listSkills(workspaceId),
    enabled: !!workspaceId
  });
}
function useCreateSkill() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: createSkill,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["skills", vars.workspace_id] });
    }
  });
}
function useUpdateSkill() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, skillId, data }) => updateSkill(workspaceId, skillId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["skills", vars.workspaceId] });
    }
  });
}
function useDeleteSkill() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, skillId }) => deleteSkill(workspaceId, skillId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["skills", vars.workspaceId] });
    }
  });
}

// src/runtimes/queries.ts
init_connect_client();
async function listRuntimes(workspaceId) {
  const res = await getApiClient().call("/rpc/runtime/list", { workspace_id: workspaceId });
  return res.runtimes ?? [];
}
async function registerRuntime(data) {
  return getApiClient().call("/rpc/runtime/register", data);
}
async function getRuntime(workspaceId, runtimeId) {
  return getApiClient().call("/rpc/runtime/get", { workspace_id: workspaceId, runtime_id: runtimeId });
}
async function pingRuntime(workspaceId, runtimeId) {
  return getApiClient().call("/rpc/runtime/ping", { workspace_id: workspaceId, runtime_id: runtimeId });
}
async function listRuntimeUsage(workspaceId, runtimeId, days = 30) {
  const res = await getApiClient().call("/rpc/runtime/usage", { workspace_id: workspaceId, runtime_id: runtimeId, days });
  return res.usage ?? [];
}

// src/runtimes/mutations.ts
init_connect_client();
async function updateRuntime(data) {
  return getApiClient().call("/rpc/runtime/update", data);
}
async function deleteRuntime(workspaceId, runtimeId) {
  await getApiClient().call("/rpc/runtime/delete", { workspace_id: workspaceId, runtime_id: runtimeId });
}
function useRuntimes(workspaceId) {
  return reactQuery.useQuery({
    queryKey: ["runtimes", workspaceId],
    queryFn: () => listRuntimes(workspaceId),
    enabled: !!workspaceId
  });
}
function useRuntime(workspaceId, runtimeId) {
  return reactQuery.useQuery({
    queryKey: ["runtime", workspaceId, runtimeId],
    queryFn: () => getRuntime(workspaceId, runtimeId),
    enabled: !!workspaceId && !!runtimeId
  });
}
function useRegisterRuntime() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: (data) => registerRuntime(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["runtimes", vars.workspace_id] });
    }
  });
}
function useUpdateRuntime() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: (data) => updateRuntime(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["runtimes", vars.workspace_id] });
      qc.invalidateQueries({ queryKey: ["runtime", vars.workspace_id, vars.runtime_id] });
    }
  });
}
function useDeleteRuntime() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, runtimeId }) => deleteRuntime(workspaceId, runtimeId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["runtimes", vars.workspaceId] });
    }
  });
}
function useRuntimeUsage(workspaceId, runtimeId, days = 30) {
  return reactQuery.useQuery({
    queryKey: ["runtime-usage", workspaceId, runtimeId, days],
    queryFn: () => listRuntimeUsage(workspaceId, runtimeId, days),
    enabled: !!workspaceId && !!runtimeId
  });
}
function usePingRuntime() {
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, runtimeId }) => pingRuntime(workspaceId, runtimeId)
  });
}

// src/tasks/queries.ts
init_connect_client();
async function createTask(data) {
  return getApiClient().call("/rpc/task/create", data);
}
async function getTask(workspaceId, taskId) {
  return getApiClient().call("/rpc/task/get", { workspace_id: workspaceId, task_id: taskId });
}
async function listTasks(params) {
  return getApiClient().call("/rpc/task/list", params);
}
async function updateTaskStatus(workspaceId, taskId, status, data) {
  return getApiClient().call("/rpc/task/update-status", { workspace_id: workspaceId, task_id: taskId, status, ...data });
}
async function cancelTask(workspaceId, taskId) {
  return getApiClient().call("/rpc/task/cancel", { workspace_id: workspaceId, task_id: taskId });
}
async function listTaskMessages(workspaceId, taskId, limit = 100, offset = 0) {
  const res = await getApiClient().call("/rpc/task/messages", {
    workspace_id: workspaceId,
    task_id: taskId,
    limit,
    offset
  });
  return res.messages ?? [];
}

// src/chat/queries.ts
init_connect_client();
async function listChatSessions(params) {
  return getApiClient().call("/rpc/chat/sessions", params);
}
async function getChatSession(workspaceId, sessionId) {
  return getApiClient().call("/rpc/chat/get-session", { workspace_id: workspaceId, session_id: sessionId });
}
async function createChatSession(data) {
  return getApiClient().call("/rpc/chat/create-session", data);
}
async function archiveChatSession(workspaceId, sessionId) {
  return getApiClient().call("/rpc/chat/archive-session", { workspace_id: workspaceId, session_id: sessionId });
}
async function listChatMessages(params) {
  return getApiClient().call("/rpc/chat/messages", params);
}
async function sendChatMessage(data) {
  return getApiClient().call("/rpc/chat/send", data);
}
function useChatSessions(workspaceId) {
  return reactQuery.useQuery({
    queryKey: ["chat-sessions", workspaceId],
    queryFn: () => listChatSessions({ workspace_id: workspaceId }),
    enabled: !!workspaceId
  });
}
function useChatSession(workspaceId, sessionId) {
  return reactQuery.useQuery({
    queryKey: ["chat-session", workspaceId, sessionId],
    queryFn: () => getChatSession(workspaceId, sessionId),
    enabled: !!workspaceId && !!sessionId
  });
}
function useChatMessages(workspaceId, sessionId) {
  return reactQuery.useQuery({
    queryKey: ["chat-messages", workspaceId, sessionId],
    queryFn: () => listChatMessages({ workspace_id: workspaceId, session_id: sessionId }),
    enabled: !!workspaceId && !!sessionId
  });
}
function useCreateChatSession() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: createChatSession,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["chat-sessions", vars.workspace_id] });
    }
  });
}
function useSendChatMessage() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspace_id, session_id, content }) => sendChatMessage({ workspace_id, session_id, content }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["chat-messages", vars.workspace_id, vars.session_id] });
    }
  });
}

// src/comments/queries.ts
init_connect_client();
async function listComments(workspaceId, issueId, limit = 50, offset = 0) {
  const res = await getApiClient().call("/rpc/comment/list", {
    workspace_id: workspaceId,
    issue_id: issueId,
    limit,
    offset
  });
  return res.comments ?? [];
}
async function createComment(data) {
  return getApiClient().call("/rpc/comment/create", data);
}
async function updateComment(workspaceId, commentId, content) {
  return getApiClient().call("/rpc/comment/update", { workspace_id: workspaceId, comment_id: commentId, content });
}
async function deleteComment(workspaceId, commentId) {
  await getApiClient().call("/rpc/comment/delete", { workspace_id: workspaceId, comment_id: commentId });
}
async function addReaction(workspaceId, commentId, emoji) {
  return getApiClient().call("/rpc/comment/add-reaction", { workspace_id: workspaceId, comment_id: commentId, emoji });
}
async function removeReaction(workspaceId, commentId, emoji) {
  await getApiClient().call("/rpc/comment/remove-reaction", { workspace_id: workspaceId, comment_id: commentId, emoji });
}
async function listTimeline(workspaceId, issueId, limit = 50, offset = 0) {
  const res = await getApiClient().call("/rpc/comment/timeline", {
    workspace_id: workspaceId,
    issue_id: issueId,
    limit,
    offset
  });
  return res.entries ?? [];
}
async function uploadAttachment(file, opts) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("workspace_id", opts.workspace_id);
  formData.append("issue_id", opts.issue_id);
  if (opts.comment_id) formData.append("comment_id", opts.comment_id);
  const baseUrl = getApiClient().baseUrl;
  const res = await fetch(`${baseUrl}/rpc/comment/upload`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error ?? `Upload failed: ${res.status}`);
  }
  return await res.json();
}
async function deleteAttachment(workspaceId, attachmentId) {
  await getApiClient().call("/rpc/comment/delete-attachment", { workspace_id: workspaceId, attachment_id: attachmentId });
}
function useComments(workspaceId, issueId) {
  return reactQuery.useQuery({
    queryKey: issueKeys.comments(workspaceId, issueId),
    queryFn: () => listComments(workspaceId, issueId),
    enabled: !!workspaceId && !!issueId
  });
}
function useCreateComment() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: createComment,
    onMutate: async (vars) => {
      const key = issueKeys.comments(vars.workspace_id, vars.issue_id);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData(key);
      if (previous) {
        const optimistic = {
          id: `temp-${Date.now()}`,
          issue_id: vars.issue_id,
          author_type: "member",
          author_id: "",
          content: vars.content,
          type: "comment",
          parent_id: vars.parent_id ?? null,
          reactions: [],
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        qc.setQueryData(key, [...previous, optimistic]);
      }
      const prevTimeline = qc.getQueryData(issueKeys.timeline(vars.workspace_id, vars.issue_id));
      return { previous, prevTimeline };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(issueKeys.comments(vars.workspace_id, vars.issue_id), ctx.previous);
      if (ctx?.prevTimeline) qc.setQueryData(issueKeys.timeline(vars.workspace_id, vars.issue_id), ctx.prevTimeline);
    },
    onSuccess: (newComment, vars) => {
      const timelineKey = issueKeys.timeline(vars.workspace_id, vars.issue_id);
      qc.setQueryData(timelineKey, (old) => {
        if (!old) return old;
        const entry = {
          id: newComment.id,
          type: "comment",
          content: newComment.content,
          author_type: newComment.author_type,
          author_id: newComment.author_id,
          parent_id: newComment.parent_id ?? void 0,
          reactions: newComment.reactions,
          created_at: newComment.created_at
        };
        if (old.some((e) => e.id === newComment.id)) return old;
        return [...old, entry];
      });
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: issueKeys.comments(vars.workspace_id, vars.issue_id) });
      qc.invalidateQueries({ queryKey: issueKeys.timeline(vars.workspace_id, vars.issue_id) });
    }
  });
}
function useUpdateComment() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, commentId, content }) => updateComment(workspaceId, commentId, content),
    onMutate: async ({ workspaceId, commentId, content }) => {
      issueKeys.comments(workspaceId, "");
      await qc.cancelQueries({ queryKey: ["comments", workspaceId] });
      const previous = qc.getQueryData(["comments", workspaceId]);
      if (previous) {
        qc.setQueryData(["comments", workspaceId], previous.map(
          (c) => c.id === commentId ? { ...c, content } : c
        ));
      }
      return { previous };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["comments", vars.workspaceId], ctx.previous);
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", vars.workspaceId] });
    }
  });
}
function useDeleteComment() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, commentId }) => deleteComment(workspaceId, commentId),
    onMutate: async ({ workspaceId, commentId }) => {
      const key = ["comments", workspaceId];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData(key);
      if (previous) {
        const toRemove = /* @__PURE__ */ new Set([commentId]);
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
        qc.setQueryData(key, previous.filter((c) => !toRemove.has(c.id)));
      }
      return { previous };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["comments", vars.workspaceId], ctx.previous);
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", vars.workspaceId] });
    }
  });
}
function useAddReaction() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, commentId, emoji }) => addReaction(workspaceId, commentId, emoji),
    onMutate: async ({ workspaceId, commentId, emoji }) => {
      const key = ["comments", workspaceId];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData(key);
      if (previous) {
        qc.setQueryData(key, previous.map((c) => {
          if (c.id !== commentId) return c;
          const tempReaction = {
            id: `temp-${Date.now()}`,
            comment_id: commentId,
            actor_type: "member",
            actor_id: "",
            emoji,
            created_at: (/* @__PURE__ */ new Date()).toISOString()
          };
          return { ...c, reactions: [...c.reactions ?? [], tempReaction] };
        }));
      }
      return { previous };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["comments", vars.workspaceId], ctx.previous);
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", vars.workspaceId] });
    }
  });
}
function useRemoveReaction() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, commentId, emoji }) => removeReaction(workspaceId, commentId, emoji),
    onMutate: async ({ workspaceId, commentId, emoji }) => {
      const key = ["comments", workspaceId];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData(key);
      if (previous) {
        qc.setQueryData(key, previous.map((c) => {
          if (c.id !== commentId) return c;
          return { ...c, reactions: (c.reactions ?? []).filter((r) => !(r.emoji === emoji)) };
        }));
      }
      return { previous };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["comments", vars.workspaceId], ctx.previous);
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", vars.workspaceId] });
    }
  });
}
function useTimeline(workspaceId, issueId) {
  return reactQuery.useQuery({
    queryKey: issueKeys.timeline(workspaceId, issueId),
    queryFn: () => listTimeline(workspaceId, issueId),
    enabled: !!workspaceId && !!issueId
  });
}

// src/inbox/queries.ts
init_connect_client();
async function listInbox(params) {
  return getApiClient().call("/rpc/inbox/list", params);
}
async function markInboxRead(workspaceId, itemIds) {
  await getApiClient().call("/rpc/inbox/mark-read", { workspace_id: workspaceId, item_ids: itemIds });
}
async function markInboxArchived(workspaceId, itemIds) {
  await getApiClient().call("/rpc/inbox/mark-archived", { workspace_id: workspaceId, item_ids: itemIds });
}
async function markAllInboxRead(workspaceId) {
  await getApiClient().call("/rpc/inbox/mark-all-read", { workspace_id: workspaceId });
}
function useInbox(workspaceId, params) {
  return reactQuery.useQuery({
    queryKey: ["inbox", workspaceId, params],
    queryFn: () => listInbox({ workspace_id: workspaceId, ...params }),
    enabled: !!workspaceId
  });
}
function useMarkInboxRead() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, inboxId }) => markInboxRead(workspaceId, [inboxId]),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["inbox", vars.workspaceId] });
    }
  });
}
function useMarkInboxArchived() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, inboxId }) => markInboxArchived(workspaceId, [inboxId]),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["inbox", vars.workspaceId] });
    }
  });
}
function useMarkAllInboxRead() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: (workspaceId) => markAllInboxRead(workspaceId),
    onSuccess: (_, workspaceId) => {
      qc.invalidateQueries({ queryKey: ["inbox", workspaceId] });
    }
  });
}

// src/projects/queries.ts
init_connect_client();
async function listProjects(params) {
  return getApiClient().call("/rpc/project/list", params);
}
async function getProject(workspaceId, projectId) {
  return getApiClient().call("/rpc/project/get", { workspace_id: workspaceId, project_id: projectId });
}
async function createProject(data) {
  return getApiClient().call("/rpc/project/create", data);
}
async function updateProject(workspaceId, projectId, data) {
  return getApiClient().call("/rpc/project/update", { workspace_id: workspaceId, project_id: projectId, ...data });
}
async function deleteProject(workspaceId, projectId) {
  await getApiClient().call("/rpc/project/delete", { workspace_id: workspaceId, project_id: projectId });
}
async function searchProjects(workspaceId, query, limit = 20) {
  return getApiClient().call("/rpc/search/projects", { workspace_id: workspaceId, query, limit });
}
async function listPins(workspaceId) {
  const res = await getApiClient().call("/rpc/pin/list", { workspace_id: workspaceId });
  return res.items ?? [];
}
async function createPin(workspaceId, itemType, itemId) {
  return getApiClient().call("/rpc/pin/create", { workspace_id: workspaceId, item_type: itemType, item_id: itemId });
}
async function deletePin(workspaceId, pinId) {
  await getApiClient().call("/rpc/pin/delete", { workspace_id: workspaceId, pin_id: pinId });
}
async function reorderPins(workspaceId, items) {
  await getApiClient().call("/rpc/pin/reorder", { workspace_id: workspaceId, items });
}
function useProjects(workspaceId) {
  return reactQuery.useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => listProjects({ workspace_id: workspaceId }),
    enabled: !!workspaceId,
    select: (data) => ({ projects: data.projects ?? [], total: data.total ?? 0 })
  });
}
function useProject(workspaceId, projectId) {
  return reactQuery.useQuery({
    queryKey: ["project", workspaceId, projectId],
    queryFn: () => getProject(workspaceId, projectId),
    enabled: !!workspaceId && !!projectId
  });
}
function useCreateProject() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: createProject,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["projects", vars.workspace_id] });
    }
  });
}
function useUpdateProject() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, projectId, data }) => updateProject(workspaceId, projectId, data),
    onMutate: async ({ workspaceId, projectId, data }) => {
      await qc.cancelQueries({ queryKey: ["projects", workspaceId] });
      const previous = qc.getQueryData(["projects", workspaceId]);
      if (previous) {
        qc.setQueryData(["projects", workspaceId], {
          ...previous,
          projects: previous.projects.map((p) => p.id === projectId ? { ...p, ...data } : p)
        });
      }
      return { previous };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(["projects", vars.workspaceId], ctx.previous);
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["projects", vars.workspaceId] });
      qc.invalidateQueries({ queryKey: ["project", vars.workspaceId, vars.projectId] });
    }
  });
}
function useDeleteProject() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, projectId }) => deleteProject(workspaceId, projectId),
    onMutate: async ({ workspaceId, projectId }) => {
      await qc.cancelQueries({ queryKey: ["projects", workspaceId] });
      const previous = qc.getQueryData(["projects", workspaceId]);
      if (previous) {
        qc.setQueryData(["projects", workspaceId], {
          ...previous,
          projects: previous.projects.filter((p) => p.id !== projectId)
        });
      }
      return { previous };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(["projects", vars.workspaceId], ctx.previous);
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["projects", vars.workspaceId] });
    }
  });
}
var globalClient = null;
var globalSubscriptions = /* @__PURE__ */ new Map();
var isConnected = false;
var currentWorkspaceId = null;
var reconnectCallbacks = /* @__PURE__ */ new Set();
function centrifugoWsUrl() {
  if (typeof window !== "undefined") {
    return window.__VITE_OPENZOO_CENTRIFUGO_WS || "ws://localhost:8000/connection/websocket";
  }
  return "ws://localhost:8000/connection/websocket";
}
function connectGlobal(workspaceId) {
  if (globalClient && isConnected && currentWorkspaceId === workspaceId) return;
  if (globalClient && currentWorkspaceId !== workspaceId) {
    disconnectGlobal();
  }
  currentWorkspaceId = workspaceId;
  globalClient = new centrifuge.Centrifuge(centrifugoWsUrl());
  globalClient.on("error", (ctx) => {
    console.error("[Centrifugo] error:", ctx);
  });
  globalClient.on("disconnected", (ctx) => {
    console.warn("[Centrifugo] disconnected, will auto-reconnect:", ctx.reason);
    isConnected = false;
  });
  globalClient.on("connected", () => {
    const wasReconnect = !isConnected;
    isConnected = true;
    if (wasReconnect && reconnectCallbacks.size > 0) {
      reconnectCallbacks.forEach((cb) => cb());
    }
  });
  const channel = `workspace:${workspaceId}`;
  const sub = globalClient.newSubscription(channel);
  sub.on("publication", (ctx) => {
    const data = ctx.data;
    const handlers = globalSubscriptions.get(channel);
    if (handlers) {
      handlers.forEach((h) => h(data));
    }
  });
  sub.subscribe();
  globalClient.connect();
  isConnected = true;
}
function onReconnect(callback) {
  reconnectCallbacks.add(callback);
  return () => {
    reconnectCallbacks.delete(callback);
  };
}
function subscribeGlobal(workspaceId, handler) {
  const channel = `workspace:${workspaceId}`;
  if (!globalSubscriptions.has(channel)) {
    globalSubscriptions.set(channel, /* @__PURE__ */ new Set());
  }
  globalSubscriptions.get(channel).add(handler);
  connectGlobal(workspaceId);
  return () => {
    globalSubscriptions.get(channel)?.delete(handler);
  };
}
function disconnectGlobal() {
  if (globalClient) {
    globalClient.disconnect();
    globalClient = null;
    isConnected = false;
    currentWorkspaceId = null;
    globalSubscriptions.clear();
  }
}
var OpenZooRealtimeClient = class {
  workspaceId;
  unsub = null;
  constructor(workspaceId) {
    this.workspaceId = workspaceId;
  }
  subscribe(channel, handler) {
    this.unsub = subscribeGlobal(this.workspaceId, handler);
    return this.unsub;
  }
  connect() {
    connectGlobal(this.workspaceId);
  }
  disconnect() {
    this.unsub?.();
  }
};
var wsEventListeners = /* @__PURE__ */ new Map();
function useWSEvent(eventType, handler) {
  if (!wsEventListeners.has(eventType)) {
    wsEventListeners.set(eventType, /* @__PURE__ */ new Set());
  }
  const typedHandler = handler;
  wsEventListeners.get(eventType).add(typedHandler);
  return () => {
    wsEventListeners.get(eventType)?.delete(typedHandler);
  };
}
function dispatchWSEvent(event) {
  const handlers = wsEventListeners.get(event.type);
  if (handlers) {
    handlers.forEach((h) => h(event));
  }
}

// src/realtime/use-realtime-sync.ts
var pendingRefetch = /* @__PURE__ */ new Map();
var DEBOUNCE_MS = 100;
function debouncedRefetch(key, fn) {
  if (pendingRefetch.has(key)) {
    clearTimeout(pendingRefetch.get(key));
  }
  pendingRefetch.set(key, setTimeout(() => {
    pendingRefetch.delete(key);
    fn();
  }, DEBOUNCE_MS));
}
function applyOptimisticIssueUpdate(event) {
  const payload = event.payload ?? event;
  const wsId = payload.workspace_id ?? "";
  if (!wsId) return;
  const queryKey = ["issues", wsId];
  const current = queryClient.getQueryData(queryKey);
  if (!current?.issues) return;
  const type = event.type;
  if (type === "issue:created" && payload.id) {
    const exists = current.issues.some((i) => i.id === payload.id);
    if (!exists) {
      queryClient.setQueryData(queryKey, {
        ...current,
        issues: [payload, ...current.issues],
        total: current.total + 1
      });
    }
    return;
  }
  if (type === "issue:updated" && payload.id) {
    queryClient.setQueryData(queryKey, {
      ...current,
      issues: current.issues.map(
        (i) => i.id === payload.id ? { ...i, ...payload } : i
      )
    });
    queryClient.setQueryData(
      ["issue", wsId, payload.id],
      (old) => old ? { ...old, ...payload } : old
    );
    return;
  }
  if (type === "issue:deleted" && payload.issue_id) {
    queryClient.setQueryData(queryKey, {
      ...current,
      issues: current.issues.filter((i) => i.id !== payload.issue_id),
      total: Math.max(0, current.total - 1)
    });
    queryClient.removeQueries({ queryKey: ["issue", wsId, payload.issue_id] });
    return;
  }
}
function applyOptimisticTaskUpdate(event) {
  const payload = event.payload ?? event;
  const wsId = payload.workspace_id ?? "";
  if (!wsId) return;
  const type = event.type;
  if (type === "task:message" && payload.task_id) {
    queryClient.invalidateQueries({
      queryKey: ["task-messages", payload.task_id]
    });
    return;
  }
  queryClient.invalidateQueries({ queryKey: ["tasks", wsId] });
  if (payload.task_id) {
    queryClient.invalidateQueries({
      queryKey: ["task", payload.task_id]
    });
  }
}
function applyOptimisticAgentUpdate(event) {
  const payload = event.payload ?? event;
  const wsId = payload.workspace_id ?? "";
  if (!wsId || !payload.id) return;
  const queryKey = ["agents", wsId];
  const current = queryClient.getQueryData(queryKey);
  if (!current) return;
  const type = event.type;
  if (type === "agent:status") {
    queryClient.setQueryData(queryKey, current.map(
      (a) => a.id === payload.id ? { ...a, ...payload } : a
    ));
    queryClient.setQueryData(
      ["agent", wsId, payload.id],
      (old) => old ? { ...old, ...payload } : old
    );
  }
}
function attachRealtimeSync(workspaceId, callbacks) {
  if (!workspaceId) return () => {
  };
  const client = new OpenZooRealtimeClient(workspaceId);
  client.subscribe(`workspace:${workspaceId}`, (event) => {
    const type = event.type ?? "";
    const typedEvent = event;
    dispatchWSEvent(typedEvent);
    if (type.startsWith("issue:") || type.startsWith("issue_reaction:")) {
      applyOptimisticIssueUpdate(typedEvent);
      debouncedRefetch("issues", () => callbacks.onIssueChanged?.());
      return;
    }
    if (type.startsWith("comment:") || type.startsWith("reaction:")) {
      const issueId = String(event.issue_id ?? event.payload?.issue_id ?? "");
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

// src/cycles/queries.ts
init_connect_client();
async function listCycles(workspaceId) {
  return getApiClient().call("/rpc/cycle/list", { workspace_id: workspaceId });
}
async function getCycle(workspaceId, cycleId) {
  return getApiClient().call("/rpc/cycle/get", { workspace_id: workspaceId, cycle_id: cycleId });
}
async function createCycle(data) {
  return getApiClient().call("/rpc/cycle/create", data);
}
async function updateCycle(workspaceId, cycleId, data) {
  return getApiClient().call("/rpc/cycle/update", { workspace_id: workspaceId, cycle_id: cycleId, ...data });
}
async function deleteCycle(workspaceId, cycleId) {
  await getApiClient().call("/rpc/cycle/delete", { workspace_id: workspaceId, cycle_id: cycleId });
}
async function addIssueToCycle(workspaceId, cycleId, issueId) {
  await getApiClient().call("/rpc/cycle/add-issue", { workspace_id: workspaceId, cycle_id: cycleId, issue_id: issueId });
}
async function removeIssueFromCycle(workspaceId, cycleId, issueId) {
  await getApiClient().call("/rpc/cycle/remove-issue", { workspace_id: workspaceId, cycle_id: cycleId, issue_id: issueId });
}

// src/cycles/hooks.ts
function useCycles(workspaceId) {
  return reactQuery.useQuery({
    queryKey: ["cycles", workspaceId],
    queryFn: () => listCycles(workspaceId),
    enabled: !!workspaceId,
    select: (data) => data.cycles ?? []
  });
}
function useCycle(workspaceId, cycleId) {
  return reactQuery.useQuery({
    queryKey: ["cycle", workspaceId, cycleId],
    queryFn: () => getCycle(workspaceId, cycleId),
    enabled: !!workspaceId && !!cycleId
  });
}
function useCreateCycle() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: createCycle,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["cycles", vars.workspace_id] });
    }
  });
}
function useUpdateCycle() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, cycleId, data }) => updateCycle(workspaceId, cycleId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["cycles", vars.workspaceId] });
      qc.invalidateQueries({ queryKey: ["cycle", vars.workspaceId, vars.cycleId] });
    }
  });
}
function useDeleteCycle() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, cycleId }) => deleteCycle(workspaceId, cycleId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["cycles", vars.workspaceId] });
    }
  });
}
function useAddIssueToCycle() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, cycleId, issueId }) => addIssueToCycle(workspaceId, cycleId, issueId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["cycle", vars.workspaceId, vars.cycleId] });
    }
  });
}
function useRemoveIssueFromCycle() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, cycleId, issueId }) => removeIssueFromCycle(workspaceId, cycleId, issueId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["cycle", vars.workspaceId, vars.cycleId] });
    }
  });
}

// src/labels/queries.ts
init_connect_client();
async function listLabels(workspaceId) {
  return getApiClient().call("/rpc/label/list", { workspace_id: workspaceId });
}
async function createLabel(data) {
  return getApiClient().call("/rpc/label/create", data);
}
async function updateLabel(workspaceId, labelId, data) {
  return getApiClient().call("/rpc/label/update", { workspace_id: workspaceId, label_id: labelId, ...data });
}
async function deleteLabel(workspaceId, labelId) {
  await getApiClient().call("/rpc/label/delete", { workspace_id: workspaceId, label_id: labelId });
}
async function addLabelToIssue(workspaceId, issueId, labelId) {
  await getApiClient().call("/rpc/label/add-to-issue", { workspace_id: workspaceId, issue_id: issueId, label_id: labelId });
}
async function removeLabelFromIssue(workspaceId, issueId, labelId) {
  await getApiClient().call("/rpc/label/remove-from-issue", { workspace_id: workspaceId, issue_id: issueId, label_id: labelId });
}
async function getIssueLabels(workspaceId, issueId) {
  return getApiClient().call("/rpc/label/issue-labels", { workspace_id: workspaceId, issue_id: issueId });
}

// src/labels/hooks.ts
function useLabels(workspaceId) {
  return reactQuery.useQuery({
    queryKey: ["labels", workspaceId],
    queryFn: () => listLabels(workspaceId),
    enabled: !!workspaceId,
    select: (data) => data.labels ?? []
  });
}
function useIssueLabels(workspaceId, issueId) {
  return reactQuery.useQuery({
    queryKey: ["issue-labels", workspaceId, issueId],
    queryFn: () => getIssueLabels(workspaceId, issueId),
    enabled: !!workspaceId && !!issueId,
    select: (data) => data.labels ?? []
  });
}
function useCreateLabel() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: createLabel,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["labels", vars.workspace_id] });
    }
  });
}
function useUpdateLabel() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, labelId, data }) => updateLabel(workspaceId, labelId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["labels", vars.workspaceId] });
    }
  });
}
function useDeleteLabel() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, labelId }) => deleteLabel(workspaceId, labelId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["labels", vars.workspaceId] });
    }
  });
}
function useAddLabelToIssue() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, issueId, labelId }) => addLabelToIssue(workspaceId, issueId, labelId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["issue-labels", vars.workspaceId, vars.issueId] });
    }
  });
}
function useRemoveLabelFromIssue() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, issueId, labelId }) => removeLabelFromIssue(workspaceId, issueId, labelId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["issue-labels", vars.workspaceId, vars.issueId] });
    }
  });
}

// src/views/queries.ts
init_connect_client();
async function listViews(workspaceId) {
  return getApiClient().call("/rpc/view/list", { workspace_id: workspaceId });
}
async function getView(workspaceId, viewId) {
  return getApiClient().call("/rpc/view/get", { workspace_id: workspaceId, view_id: viewId });
}
async function createView(data) {
  return getApiClient().call("/rpc/view/create", data);
}
async function updateView(workspaceId, viewId, data) {
  return getApiClient().call("/rpc/view/update", { workspace_id: workspaceId, view_id: viewId, ...data });
}
async function deleteView(workspaceId, viewId) {
  await getApiClient().call("/rpc/view/delete", { workspace_id: workspaceId, view_id: viewId });
}

// src/views/hooks.ts
function useViews(workspaceId) {
  return reactQuery.useQuery({
    queryKey: ["views", workspaceId],
    queryFn: () => listViews(workspaceId),
    enabled: !!workspaceId,
    select: (data) => data.views ?? []
  });
}
function useView(workspaceId, viewId) {
  return reactQuery.useQuery({
    queryKey: ["view", workspaceId, viewId],
    queryFn: () => getView(workspaceId, viewId),
    enabled: !!workspaceId && !!viewId
  });
}
function useCreateView() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: createView,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["views", vars.workspace_id] });
    }
  });
}
function useUpdateView() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, viewId, data }) => updateView(workspaceId, viewId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["views", vars.workspaceId] });
      qc.invalidateQueries({ queryKey: ["view", vars.workspaceId, vars.viewId] });
    }
  });
}
function useDeleteView() {
  const qc = reactQuery.useQueryClient();
  return reactQuery.useMutation({
    mutationFn: ({ workspaceId, viewId }) => deleteView(workspaceId, viewId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["views", vars.workspaceId] });
    }
  });
}
init_connect_client();
var AuthInitializer = ({ children, onUnauthorized: onUnauthorized2 }) => {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace);
  react.useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);
  react.useEffect(() => {
    if (isAuthenticated && token) {
      setToken(token);
      loadWorkspaces();
    }
  }, [isAuthenticated, token, loadWorkspaces]);
  react.useEffect(() => {
    if (currentWorkspace) {
      setWorkspaceId(currentWorkspace.id);
    }
  }, [currentWorkspace]);
  return /* @__PURE__ */ jsxRuntime.jsx(jsxRuntime.Fragment, { children });
};

// src/platform/core-provider.tsx
init_connect_client();
var CoreProvider = ({ children, navigation: _navigation, onUnauthorized: onUnauth }) => {
  if (onUnauth) {
    onUnauthorized(onUnauth);
  }
  return /* @__PURE__ */ jsxRuntime.jsx(reactQuery.QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntime.jsx(AuthInitializer, { onUnauthorized: onUnauth, children }) });
};

// src/navigation/types.ts
var NAV_PATHS = {
  HOME: "/",
  ISSUES: "/issues",
  MY_ISSUES: "/issues?filter=my",
  AGENTS: "/agents",
  RUNTIMES: "/runtimes",
  PROJECTS: "/projects",
  INBOX: "/inbox",
  CHAT: "/chat",
  SEARCH: "/search",
  SETTINGS: "/settings",
  LOGIN: "/login"
};

exports.AuthInitializer = AuthInitializer;
exports.CoreProvider = CoreProvider;
exports.NAV_PATHS = NAV_PATHS;
exports.OpenZooRealtimeClient = OpenZooRealtimeClient;
exports.addIssueReaction = addIssueReaction;
exports.addReaction = addReaction;
exports.archiveAgent = archiveAgent;
exports.archiveChatSession = archiveChatSession;
exports.attachRealtimeSync = attachRealtimeSync;
exports.batchUpdateIssues = batchUpdateIssues;
exports.cancelTask = cancelTask;
exports.configureApiClient = configureApiClient;
exports.connectGlobal = connectGlobal;
exports.createAgent = createAgent;
exports.createChatSession = createChatSession;
exports.createComment = createComment;
exports.createIssue = createIssue;
exports.createMember = createMember;
exports.createPin = createPin;
exports.createProject = createProject;
exports.createSkill = createSkill;
exports.createTask = createTask;
exports.createWorkspace = createWorkspace;
exports.deleteAttachment = deleteAttachment;
exports.deleteComment = deleteComment;
exports.deleteIssue = deleteIssue;
exports.deleteMember = deleteMember;
exports.deletePin = deletePin;
exports.deleteProject = deleteProject;
exports.deleteRuntime = deleteRuntime;
exports.deleteSkill = deleteSkill;
exports.deleteWorkspace = deleteWorkspace;
exports.disconnectGlobal = disconnectGlobal;
exports.getAgent = getAgent;
exports.getApiClient = getApiClient;
exports.getChatSession = getChatSession;
exports.getCurrentUser = getCurrentUser;
exports.getIssue = getIssue;
exports.getProject = getProject;
exports.getQueryData = getQueryData;
exports.getRuntime = getRuntime;
exports.getTask = getTask;
exports.getToken = getToken;
exports.getWorkspace = getWorkspace;
exports.getWorkspaceId = getWorkspaceId;
exports.invalidateQuery = invalidateQuery;
exports.issueKeys = issueKeys;
exports.listAgents = listAgents;
exports.listChatMessages = listChatMessages;
exports.listChatSessions = listChatSessions;
exports.listComments = listComments;
exports.listInbox = listInbox;
exports.listIssueSubscribers = listIssueSubscribers;
exports.listIssues = listIssues;
exports.listMembers = listMembers;
exports.listPins = listPins;
exports.listProjects = listProjects;
exports.listRuntimeUsage = listRuntimeUsage;
exports.listRuntimes = listRuntimes;
exports.listSkills = listSkills;
exports.listTaskMessages = listTaskMessages;
exports.listTasks = listTasks;
exports.listTimeline = listTimeline;
exports.listWorkspaces = listWorkspaces;
exports.markAllInboxRead = markAllInboxRead;
exports.markInboxArchived = markInboxArchived;
exports.markInboxRead = markInboxRead;
exports.onUnauthorized = onUnauthorized;
exports.pingRuntime = pingRuntime;
exports.queryClient = queryClient;
exports.registerRuntime = registerRuntime;
exports.removeIssueReaction = removeIssueReaction;
exports.removeReaction = removeReaction;
exports.reorderPins = reorderPins;
exports.restoreAgent = restoreAgent;
exports.searchIssues = searchIssues;
exports.searchProjects = searchProjects;
exports.sendChatMessage = sendChatMessage;
exports.sendVerificationCode = sendVerificationCode;
exports.setAgentSkills = setAgentSkills;
exports.setQueryData = setQueryData;
exports.setToken = setToken;
exports.setWorkspaceId = setWorkspaceId;
exports.subscribeIssue = subscribeIssue;
exports.unsubscribeIssue = unsubscribeIssue;
exports.updateAgent = updateAgent;
exports.updateComment = updateComment;
exports.updateCurrentUser = updateCurrentUser;
exports.updateIssue = updateIssue;
exports.updateMember = updateMember;
exports.updateProject = updateProject;
exports.updateRuntime = updateRuntime;
exports.updateSkill = updateSkill;
exports.updateTaskStatus = updateTaskStatus;
exports.updateWorkspace = updateWorkspace;
exports.uploadAttachment = uploadAttachment;
exports.useAddIssueReaction = useAddIssueReaction;
exports.useAddIssueToCycle = useAddIssueToCycle;
exports.useAddLabelToIssue = useAddLabelToIssue;
exports.useAddReaction = useAddReaction;
exports.useAgent = useAgent;
exports.useAgents = useAgents;
exports.useArchiveAgent = useArchiveAgent;
exports.useAuthStore = useAuthStore;
exports.useChatMessages = useChatMessages;
exports.useChatSession = useChatSession;
exports.useChatSessions = useChatSessions;
exports.useComments = useComments;
exports.useCreateAgent = useCreateAgent;
exports.useCreateChatSession = useCreateChatSession;
exports.useCreateComment = useCreateComment;
exports.useCreateCycle = useCreateCycle;
exports.useCreateIssue = useCreateIssue;
exports.useCreateLabel = useCreateLabel;
exports.useCreateMember = useCreateMember;
exports.useCreateProject = useCreateProject;
exports.useCreateSkill = useCreateSkill;
exports.useCreateView = useCreateView;
exports.useCreateWorkspace = useCreateWorkspace;
exports.useCycle = useCycle;
exports.useCycles = useCycles;
exports.useDeleteComment = useDeleteComment;
exports.useDeleteCycle = useDeleteCycle;
exports.useDeleteIssue = useDeleteIssue;
exports.useDeleteLabel = useDeleteLabel;
exports.useDeleteMember = useDeleteMember;
exports.useDeleteProject = useDeleteProject;
exports.useDeleteRuntime = useDeleteRuntime;
exports.useDeleteSkill = useDeleteSkill;
exports.useDeleteView = useDeleteView;
exports.useDeleteWorkspace = useDeleteWorkspace;
exports.useInbox = useInbox;
exports.useIssue = useIssue;
exports.useIssueLabels = useIssueLabels;
exports.useIssueSubscribers = useIssueSubscribers;
exports.useIssueViewStore = useIssueViewStore;
exports.useIssues = useIssues;
exports.useLabels = useLabels;
exports.useMarkAllInboxRead = useMarkAllInboxRead;
exports.useMarkInboxArchived = useMarkInboxArchived;
exports.useMarkInboxRead = useMarkInboxRead;
exports.useMembers = useMembers;
exports.usePingRuntime = usePingRuntime;
exports.useProject = useProject;
exports.useProjects = useProjects;
exports.useRegisterRuntime = useRegisterRuntime;
exports.useRemoveIssueFromCycle = useRemoveIssueFromCycle;
exports.useRemoveIssueReaction = useRemoveIssueReaction;
exports.useRemoveLabelFromIssue = useRemoveLabelFromIssue;
exports.useRemoveReaction = useRemoveReaction;
exports.useRestoreAgent = useRestoreAgent;
exports.useRuntime = useRuntime;
exports.useRuntimeUsage = useRuntimeUsage;
exports.useRuntimes = useRuntimes;
exports.useSendChatMessage = useSendChatMessage;
exports.useSkills = useSkills;
exports.useSubscribeIssue = useSubscribeIssue;
exports.useTimeline = useTimeline;
exports.useUnsubscribeIssue = useUnsubscribeIssue;
exports.useUpdateAgent = useUpdateAgent;
exports.useUpdateComment = useUpdateComment;
exports.useUpdateCycle = useUpdateCycle;
exports.useUpdateIssue = useUpdateIssue;
exports.useUpdateLabel = useUpdateLabel;
exports.useUpdateMember = useUpdateMember;
exports.useUpdateProject = useUpdateProject;
exports.useUpdateRuntime = useUpdateRuntime;
exports.useUpdateSkill = useUpdateSkill;
exports.useUpdateView = useUpdateView;
exports.useUpdateWorkspace = useUpdateWorkspace;
exports.useView = useView;
exports.useViews = useViews;
exports.useWSEvent = useWSEvent;
exports.useWorkspace = useWorkspace;
exports.useWorkspaceStore = useWorkspaceStore;
exports.useWorkspaces = useWorkspaces;
exports.verifyCode = verifyCode;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map