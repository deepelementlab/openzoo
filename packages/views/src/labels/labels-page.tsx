import { useState } from "react";
import { useWorkspaceStore, useLabels, useCreateLabel, useDeleteLabel } from "@openzoo/core";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Spinner } from "@openzoo/ui";
import { Plus, Trash2 } from "lucide-react";

const defaultColors = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
];

export function LabelsPage() {
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const { data: labels = [], isLoading } = useLabels(workspaceId);
  const createLabel = useCreateLabel();
  const deleteLabel = useDeleteLabel();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(defaultColors[0]);

  const handleCreate = () => {
    if (!name.trim()) return;
    createLabel.mutate({
      workspace_id: workspaceId,
      name,
      description,
      color,
    }, {
      onSuccess: () => {
        setName("");
        setDescription("");
        setColor(defaultColors[0]);
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteLabel.mutate({ workspaceId, labelId: id });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Labels</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create Label</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Label name" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Color</label>
            <div className="flex gap-2 flex-wrap">
              {defaultColors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition ${color === c ? "border-primary scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <Button onClick={handleCreate} disabled={createLabel.isPending}>
            {createLabel.isPending ? <Spinner size="sm" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Label
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {labels.map((label: any) => (
          <Card key={label.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: label.color }} />
                <div>
                  <p className="font-medium">{label.name}</p>
                  {label.description && <p className="text-sm text-muted-foreground">{label.description}</p>}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(label.id)} disabled={deleteLabel.isPending}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
        {labels.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No labels yet. Create one above to get started.
          </div>
        )}
      </div>
    </div>
  );
}
