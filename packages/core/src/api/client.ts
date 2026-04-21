export interface ApiClientConfig {
  baseUrl?: string;
  getToken?: () => string | null;
  getWorkspaceId?: () => string | null;
  onUnauthorized?: () => void;
}

function resolveBaseUrl(): string {
  try {
    const env = (import.meta as unknown as Record<string, Record<string, string>>)?.env;
    if (env?.VITE_API_URL) return env.VITE_API_URL;
    if (env?.VITE_OPENZOO_API_BASE_URL) return env.VITE_OPENZOO_API_BASE_URL;
  } catch {}
  if (typeof process !== "undefined" && process.env?.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  if (typeof process !== "undefined" && process.env?.VITE_OPENZOO_API_BASE_URL) {
    return process.env.VITE_OPENZOO_API_BASE_URL;
  }
  return "http://localhost:8080";
}

export class ApiClient {
  private config: ApiClientConfig;

  constructor(config?: ApiClientConfig) {
    this.config = config ?? {};
  }

  get baseUrl(): string {
    return this.config.baseUrl ?? resolveBaseUrl();
  }

  async call<TResp = unknown>(route: string, body: Record<string, unknown> = {}): Promise<TResp> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    const token = this.config.getToken?.() ?? _token;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const wsId = this.config.getWorkspaceId?.() ?? _workspaceId;
    if (wsId) headers["X-Workspace-ID"] = wsId;

    const res = await fetch(`${this.baseUrl}${route}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
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

    return (await res.json()) as TResp;
  }
}

let _token: string | null = null;
let _workspaceId: string | null = null;
let _onUnauthorized: (() => void) | undefined;
let _client: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (!_client) {
    _client = new ApiClient({
      getToken: () => _token,
      getWorkspaceId: () => _workspaceId,
      onUnauthorized: () => { _token = null; _onUnauthorized?.(); },
    });
  }
  return _client;
}

export function configureApiClient(config: ApiClientConfig): void {
  _client = new ApiClient(config);
}

export function setToken(token: string | null): void { _token = token; }
export function getToken(): string | null { return _token; }
export function setWorkspaceId(id: string | null): void { _workspaceId = id; }
export function getWorkspaceId(): string | null { return _workspaceId; }
export function onUnauthorized(cb: () => void): void { _onUnauthorized = cb; }
