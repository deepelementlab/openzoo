import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function invalidateQuery(queryKey: string[], workspaceId?: string) {
  queryClient.invalidateQueries({ queryKey: workspaceId ? [queryKey, workspaceId] : queryKey });
}

export function setQueryData<T>(queryKey: string[], data: T | ((old: T | undefined) => T)) {
  queryClient.setQueryData(queryKey, data);
}

export function getQueryData<T>(queryKey: string[]): T | undefined {
  return queryClient.getQueryData<T>(queryKey);
}
