import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiClient, getApiClient, configureApiClient, setToken, getToken, setWorkspaceId, getWorkspaceId, onUnauthorized } from "./client";

describe("ApiClient", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    setToken(null);
    setWorkspaceId(null);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    configureApiClient({});
  });

  it("should construct with default config", () => {
    const client = new ApiClient();
    expect(client.baseUrl).toBe("http://localhost:8080");
  });

  it("should use custom baseUrl from config", () => {
    const client = new ApiClient({ baseUrl: "https://api.example.com" });
    expect(client.baseUrl).toBe("https://api.example.com");
  });

  it("should send POST request with JSON body", async () => {
    const mockResponse = { id: "1", name: "test" };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const client = new ApiClient();
    const result = await client.call<{ id: string }>("/rpc/test", { key: "value" });

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/rpc/test",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ key: "value" }),
      }),
    );
  });

  it("should include Authorization header when token is set", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    const client = new ApiClient({ getToken: () => "test-token" });
    await client.call("/rpc/test");

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
  });

  it("should include X-Workspace-ID header when workspaceId is set", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    const client = new ApiClient({ getWorkspaceId: () => "ws-123" });
    await client.call("/rpc/test");

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Workspace-ID": "ws-123",
        }),
      }),
    );
  });

  it("should throw Unauthorized on 401 response", async () => {
    const unauthorizedCb = vi.fn();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    const client = new ApiClient({ onUnauthorized: unauthorizedCb });
    await expect(client.call("/rpc/test")).rejects.toThrow("Unauthorized");
  });

  it("should throw error with status and text on non-ok response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    });

    const client = new ApiClient();
    await expect(client.call("/rpc/test")).rejects.toThrow("RPC /rpc/test failed: 500 Internal Server Error");
  });
});

describe("Global API client helpers", () => {
  beforeEach(() => {
    setToken(null);
    setWorkspaceId(null);
    configureApiClient({});
  });

  it("setToken/getToken should manage global token", () => {
    expect(getToken()).toBeNull();
    setToken("abc123");
    expect(getToken()).toBe("abc123");
    setToken(null);
    expect(getToken()).toBeNull();
  });

  it("setWorkspaceId/getWorkspaceId should manage global workspace id", () => {
    expect(getWorkspaceId()).toBeNull();
    setWorkspaceId("ws-1");
    expect(getWorkspaceId()).toBe("ws-1");
    setWorkspaceId(null);
    expect(getWorkspaceId()).toBeNull();
  });

  it("getApiClient should return singleton client", () => {
    const a = getApiClient();
    const b = getApiClient();
    expect(a).toBe(b);
  });

  it("configureApiClient should create new client instance", () => {
    const a = getApiClient();
    configureApiClient({ baseUrl: "https://custom.api.com" });
    const b = getApiClient();
    expect(a).not.toBe(b);
    expect(b.baseUrl).toBe("https://custom.api.com");
  });

  it("onUnauthorized callback should be registered", () => {
    const cb = vi.fn();
    onUnauthorized(cb);
    expect(cb).not.toHaveBeenCalled();
  });
});
