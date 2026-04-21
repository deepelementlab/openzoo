import React, { type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../query-client";
import { AuthInitializer } from "./auth-initializer";
import type { NavigationAdapter } from "../navigation/types";
import { onUnauthorized } from "../api/connect-client";

export interface CoreProviderProps {
  children: ReactNode;
  navigation?: NavigationAdapter;
  onUnauthorized?: () => void;
}

export const CoreProvider: React.FC<CoreProviderProps> = ({ children, navigation: _navigation, onUnauthorized: onUnauth }) => {
  if (onUnauth) {
    onUnauthorized(onUnauth);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer onUnauthorized={onUnauth}>
        {children}
      </AuthInitializer>
    </QueryClientProvider>
  );
};
