import React, { useState, useEffect, useCallback } from "react";
import { listSkills, useWorkspaceStore } from "@openzoo/core";
import type { Skill } from "@openzoo/core";
import { Button, Card, Spinner, EmptyState } from "@openzoo/ui";
import { FileTree } from "./file-tree";
import { FileViewer } from "./file-viewer";

export function SkillsPage() {
  const wsId = useWorkspaceStore((s) => s.currentWorkspace?.id);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<string>("");

  const loadData = useCallback(() => {
    if (!wsId) return;
    setLoading(true);
    listSkills(wsId)
      .then((data) => { setSkills(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [wsId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  if (skills.length === 0) {
    return <EmptyState title="No Skills" description="Skills will appear here when agents are configured." />;
  }

  const files = skills.map((s) => ({
    name: s.name,
    type: "file" as const,
    content: s.content || "",
  }));

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      <div className="w-64 border rounded-lg overflow-y-auto">
        <div className="p-3 border-b">
          <h3 className="text-sm font-semibold">Skills</h3>
        </div>
        <FileTree files={files} selectedFile={selectedFile} onSelectFile={(name, content) => { setSelectedFile(name); setSelectedContent(content); }} />
      </div>
      <div className="flex-1 border rounded-lg overflow-y-auto">
        {selectedFile ? (
          <FileViewer filename={selectedFile} content={selectedContent} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Select a skill file to view
          </div>
        )}
      </div>
    </div>
  );
}
