import React from "react";
import { useWorkspaceStore, searchIssues } from "@openzoo/core";
import { Input, Spinner, Card } from "@openzoo/ui";
import { useNavigation } from "../navigation";
import type { Issue } from "@openzoo/core";

export function SearchPage() {
  const wsId = useWorkspaceStore((s) => s.currentWorkspace?.id);
  const navigation = useNavigation();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Issue[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(false);

  const doSearch = React.useCallback(async () => {
    if (!wsId || !query.trim()) return;
    setLoading(true);
    try {
      const res: any = await searchIssues(wsId, query);
      setResults(res.results ?? []);
    } finally {
      setSearched(true);
      setLoading(false);
    }
  }, [wsId, query]);

  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      void doSearch();
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Search</h2>
      <div className="flex gap-2">
        <Input
          placeholder="Search issues by title..."
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          onKeyDown={onEnter}
        />
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Spinner size="sm" /> Searching...
        </div>
      )}
      {!loading && searched && results.length === 0 && (
        <div className="text-sm text-muted-foreground">No results found.</div>
      )}
      <div className="space-y-2">
        {results.map((issue) => (
          <Card
            key={issue.id}
            className="p-3 cursor-pointer hover:bg-muted/40"
            onClick={() => navigation.navigate(`/issues/${issue.id}`)}
          >
            <div className="text-xs text-muted-foreground">{issue.identifier}</div>
            <div className="font-medium">{issue.title}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
