import React, { useState } from "react";
import { useAuthStore, useWorkspaceStore } from "@openzoo/core";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@openzoo/ui";
import { AccountTab } from "./account-tab";
import { AppearanceTab } from "./appearance-tab";
import { TokensTab } from "./tokens-tab";
import { WorkspaceTab } from "./workspace-tab";
import { MembersTab } from "./members-tab";
import { RepositoriesTab } from "./repositories-tab";

const accountTabs = [
  { value: "profile", label: "Profile", icon: "\u{1F464}" },
  { value: "appearance", label: "Appearance", icon: "\u{1F3A8}" },
  { value: "tokens", label: "API Tokens", icon: "\u{1F511}" },
];

const workspaceTabs = [
  { value: "workspace", label: "General", icon: "\u2699\uFE0F" },
  { value: "members", label: "Members", icon: "\u{1F465}" },
  { value: "repositories", label: "Repositories", icon: "\u{1F4C1}" },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const workspaceName = useWorkspaceStore((s) => s.currentWorkspace?.name);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 gap-0 flex">
      <div className="w-52 shrink-0 border-r overflow-y-auto p-4">
        <h1 className="text-sm font-semibold mb-4 px-2">Settings</h1>
        <div className="flex flex-col items-stretch space-y-0.5">
          <span className="px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground">My Account</span>
          {accountTabs.map((tab) => (
            <TabsList key={tab.value} className="w-full">
              <TabsTrigger value={tab.value} className="w-full justify-start">
                <span className="mr-2 text-sm">{tab.icon}</span>
                {tab.label}
              </TabsTrigger>
            </TabsList>
          ))}
          <span className="px-2 pb-1 pt-4 text-xs font-medium text-muted-foreground truncate">{workspaceName ?? "Workspace"}</span>
          {workspaceTabs.map((tab) => (
            <TabsList key={tab.value} className="w-full">
              <TabsTrigger value={tab.value} className="w-full justify-start">
                <span className="mr-2 text-sm">{tab.icon}</span>
                {tab.label}
              </TabsTrigger>
            </TabsList>
          ))}
        </div>
      </div>
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto p-6">
          <TabsContent value="profile"><AccountTab /></TabsContent>
          <TabsContent value="appearance"><AppearanceTab /></TabsContent>
          <TabsContent value="tokens"><TokensTab /></TabsContent>
          <TabsContent value="workspace"><WorkspaceTab /></TabsContent>
          <TabsContent value="members"><MembersTab /></TabsContent>
          <TabsContent value="repositories"><RepositoriesTab /></TabsContent>
        </div>
      </div>
    </Tabs>
  );
}
