import * as React from "react";
import { cn } from "../lib/utils";

interface DirectionProviderProps {
  dir?: "ltr" | "rtl";
  children: React.ReactNode;
}

const DirectionContext = React.createContext<"ltr" | "rtl">("ltr");

function DirectionProvider({ dir = "ltr", children }: DirectionProviderProps) {
  return (
    <DirectionContext.Provider value={dir}>
      {children}
    </DirectionContext.Provider>
  );
}

function useDirection() {
  return React.useContext(DirectionContext);
}

export { DirectionProvider, useDirection };
