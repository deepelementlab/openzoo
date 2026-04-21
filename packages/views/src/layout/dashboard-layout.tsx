import React from "react";
import { AppSidebar } from "./app-sidebar";
import { WorkspacePicker } from "../workspace";
import { ModalProvider, CreateIssueModal, CreateWorkspaceModal } from "../modals";
import { GlobalSearchTrigger } from "../search/use-global-search";

const DEFAULT_MODALS = [
  { id: "create-issue", component: CreateIssueModal },
  { id: "create-workspace", component: CreateWorkspaceModal },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModalProvider modals={DEFAULT_MODALS}>
      <div className="flex h-screen bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="border-b px-4 py-2 flex items-center justify-between">
            <WorkspacePicker />
            <div className="text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">⌘K</kbd> Search
            </div>
          </div>
          <div className="p-6">{children}</div>
        </main>
      </div>
      <GlobalSearchTrigger />
    </ModalProvider>
  );
}
