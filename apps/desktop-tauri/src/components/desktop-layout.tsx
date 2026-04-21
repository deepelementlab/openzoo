import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { TabBar } from "./tab-bar";
import { TabContent } from "./tab-content";
import { useDocumentTitle } from "../hooks/use-document-title";
import { useTabRouterSync } from "../hooks/use-tab-router-sync";

function DesktopLayout() {
  useDocumentTitle();
  useTabRouterSync();

  return (
    <div className="flex h-screen flex-col bg-background">
      <div
        className="flex items-center h-10 border-b border-border px-2 gap-1 bg-muted/20"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div className="flex items-center gap-0.5" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded p-1 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => window.history.forward()}
            className="rounded p-1 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="size-4" />
          </button>
        </div>
        <TabBar />
      </div>
      <TabContent />
      <DesktopStatusBar />
    </div>
  );
}

function DesktopStatusBar() {
  const [daemonStatus, setDaemonStatus] = React.useState<string>("unknown");

  const checkDaemon = async () => {
    try {
      const result = await invoke<string>("daemon_status");
      setDaemonStatus(result);
    } catch {
      setDaemonStatus("unavailable");
    }
  };

  React.useEffect(() => {
    checkDaemon();
    const iv = setInterval(checkDaemon, 30000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex items-center h-6 border-t border-border px-3 text-[11px] text-muted-foreground bg-muted/20">
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${daemonStatus === "running" ? "bg-green-500" : daemonStatus === "stopped" ? "bg-red-500" : "bg-gray-400"}`} />
        <span>Daemon: {daemonStatus}</span>
      </div>
      <div className="ml-auto">OpenZoo v0.1.0</div>
    </div>
  );
}

export { DesktopLayout };
