import { useState } from "react";
import { useWorkspaceStore, useViews, useCreateView, useDeleteView } from "@openzoo/core";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge, Spinner } from "@openzoo/ui";
import { Plus, Eye, Share2, Trash2, Filter } from "lucide-react";

export function ViewsPage() {
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const { data: views = [], isLoading } = useViews(workspaceId);
  const createView = useCreateView();
  const deleteView = useDeleteView();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterValue, setFilterValue] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    const filters: Record<string, any> = {};
    if (filterType && filterValue) {
      filters[filterType] = filterValue;
    }
    createView.mutate({
      workspace_id: workspaceId,
      name,
      description,
      filters,
      is_shared: isShared,
    }, {
      onSuccess: () => {
        setName("");
        setDescription("");
        setFilterType("");
        setFilterValue("");
        setIsShared(false);
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteView.mutate({ workspaceId, viewId: id });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Views</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Create View
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="View name" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </label>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-md border px-3 py-2 text-sm bg-background"
              >
                <option value="">Select field</option>
                <option value="status">Status</option>
                <option value="priority">Priority</option>
                <option value="assignee_id">Assignee</option>
                <option value="project_id">Project</option>
              </select>
              <Input
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder="Filter value"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is-shared"
              checked={isShared}
              onChange={(e) => setIsShared(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="is-shared" className="text-sm flex items-center gap-1">
              <Share2 className="w-3 h-3" />
              Share with workspace
            </label>
          </div>

          <Button onClick={handleCreate} disabled={createView.isPending}>
            {createView.isPending ? <Spinner size="sm" /> : <Plus className="w-4 h-4 mr-2" />}
            Create View
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {views.map((view: any) => (
          <Card key={view.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{view.name}</span>
                  {view.is_shared && (
                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                      Shared
                    </Badge>
                  )}
                </div>
                {view.description && <p className="text-sm text-muted-foreground">{view.description}</p>}
                {Object.keys(view.filters || {}).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(view.filters).map(([key, value]) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key}: {String(value)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(view.id)} disabled={deleteView.isPending}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
        {views.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No views yet. Create one above to get started.
          </div>
        )}
      </div>
    </div>
  );
}
