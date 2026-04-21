import React, { useState } from "react";
import { useCreateWorkspace, useWorkspaceStore } from "@openzoo/core";
import { Button, Input, Spinner, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Textarea } from "@openzoo/ui";

interface CreateWorkspaceModalProps {
  onClose: () => void;
}

export function CreateWorkspaceModal({ onClose }: CreateWorkspaceModalProps) {
  const createWorkspace = useCreateWorkspace();
  const { loadWorkspaces, setCurrentWorkspace } = useWorkspaceStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      const ws = await createWorkspace.mutateAsync({ name: name.trim(), description: description.trim() || undefined });
      await loadWorkspaces();
      if (ws?.id) {
        setCurrentWorkspace(ws);
      }
      onClose();
    } catch (err) {
      console.error("Failed to create workspace:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  const isSubmitting = createWorkspace.isPending;
  const canSubmit = name.trim() !== "" && !isSubmitting;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
        </DialogHeader>

        <div className="space-y-4" onKeyDown={handleKeyDown}>
          <div className="space-y-1">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="My Workspace"
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="What is this workspace for?"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? <Spinner size="sm" /> : "Create Workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
