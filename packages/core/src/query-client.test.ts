import { describe, it, expect } from "vitest";
import { queryClient, invalidateQuery, setQueryData, getQueryData } from "./query-client";

describe("queryClient", () => {
  it("should be a QueryClient instance", () => {
    expect(queryClient).toBeDefined();
    expect(queryClient.getDefaultOptions()).toBeDefined();
  });

  it("should have correct default query options", () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(1000 * 60 * 5);
    expect(defaults.queries?.gcTime).toBe(1000 * 60 * 10);
    expect(defaults.queries?.retry).toBe(1);
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
  });

  it("should have correct default mutation options", () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.mutations?.retry).toBe(0);
  });
});

describe("query helpers", () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it("setQueryData / getQueryData should work together", () => {
    const key = ["test", "data"];
    setQueryData(key, { name: "hello" });
    expect(getQueryData(key)).toEqual({ name: "hello" });
  });

  it("getQueryData should return undefined for unset key", () => {
    expect(getQueryData(["nonexistent"])).toBeUndefined();
  });

  it("setQueryData should support updater function", () => {
    const key = ["test", "counter"];
    setQueryData(key, { count: 0 });
    setQueryData<{ count: number }>(key, (old) => ({ count: (old?.count ?? 0) + 1 }));
    expect(getQueryData<{ count: number }>(key)).toEqual({ count: 1 });
  });

  it("invalidateQuery should mark query as stale", async () => {
    const key = ["test", "stale"];
    setQueryData(key, { value: 1 });
    await invalidateQuery(key);
    const state = queryClient.getQueryState(key);
    expect(state?.isInvalidated).toBe(true);
  });
});
