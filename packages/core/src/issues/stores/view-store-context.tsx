import { createContext, useContext, useRef, type ReactNode } from "react";
import type { StoreApi } from "zustand";
import { useStore } from "zustand";
import { useIssueViewStore, type IssueViewState } from "./view-store";

export const ViewStoreProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export function useViewStore<T>(selector: (s: IssueViewState) => T): T {
  return useStore(useIssueViewStore, selector);
}

export function useViewStoreApi(): StoreApi<IssueViewState> {
  return useIssueViewStore;
}
