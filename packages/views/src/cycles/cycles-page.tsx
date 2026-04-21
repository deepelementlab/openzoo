import { useState } from "react";
import { useWorkspaceStore, useCycles, useCreateCycle, useDeleteCycle } from "@openzoo/core";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge, Spinner } from "@openzoo/ui";
import { Plus, Calendar, ArrowRight } from "lucide-react";

const statusColors: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  current: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  canceled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function CyclesPage() {
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const { data: cycles = [], isLoading } = useCycles(workspaceId);
  const createCycle = useCreateCycle();
  const deleteCycle = useDeleteCycle();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [autoCreateNext, setAutoCreateNext] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) return;
    createCycle.mutate({
      workspace_id: workspaceId,
      name,
      description,
      start_date: startDate,
      end_date: endDate,
      auto_create_next: autoCreateNext,
    }, {
      onSuccess: () => {
        setName("");
        setDescription("");
        setStartDate("");
        setEndDate("");
        setAutoCreateNext(false);
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteCycle.mutate({ workspaceId, cycleId: id });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Cycles</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Create Cycle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cycle name" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto-create"
              checked={autoCreateNext}
              onChange={(e) => setAutoCreateNext(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="auto-create" className="text-sm">Auto-create next cycle</label>
          </div>
          <Button onClick={handleCreate} disabled={createCycle.isPending}>
            {createCycle.isPending ? <Spinner size="sm" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Cycle
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {cycles.map((cycle: any) => (
          <Card key={cycle.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{cycle.name}</span>
                  <Badge className={statusColors[cycle.status] ?? ""}>{cycle.status}</Badge>
                </div>
                {cycle.description && <p className="text-sm text-muted-foreground">{cycle.description}</p>}
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <span>#{cycle.number}</span>
                  {cycle.start_date && (
                    <>
                      <ArrowRight className="w-3 h-3" />
                      <span>{cycle.start_date} → {cycle.end_date}</span>
                    </>
                  )}
                  {cycle.auto_create_next && (
                    <Badge variant="outline" className="ml-2">Auto-create</Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(cycle.id)} disabled={deleteCycle.isPending}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
        {cycles.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No cycles yet. Create one above to get started.
          </div>
        )}
      </div>
    </div>
  );
}
