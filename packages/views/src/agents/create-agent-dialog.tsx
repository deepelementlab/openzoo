import React, { useState } from "react";
import { Button, Input, Textarea, Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@openzoo/ui";

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { name: string; description: string; instructions: string }) => void;
}

export function CreateAgentDialog({ open, onOpenChange, onCreate }: CreateAgentDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: description.trim(), instructions: instructions.trim() });
    setName("");
    setDescription("");
    setInstructions("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Agent</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Agent name" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Instructions</label>
            <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Agent instructions..." className="mt-1 min-h-[120px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
