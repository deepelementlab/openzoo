import * as React from "react";
import { Menu, X, Layers, Github, Sun, Moon } from "lucide-react";
import { docsNav, type DocSection } from "../docs-nav";

function DocsLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [dark, setDark] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  const toggleTheme = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      document.documentElement.classList.toggle("light", !next);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden rounded p-1.5 hover:bg-secondary"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <a href="/" className="flex items-center gap-2 font-bold text-lg">
              <Layers className="size-5 text-primary" />
              OpenZoo
            </a>
            <span className="text-sm text-muted-foreground hidden sm:inline">Documentation</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleTheme} className="rounded p-2 hover:bg-secondary transition-colors">
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <a href="https://github.com/openzoo/openzoo" target="_blank" rel="noopener noreferrer" className="rounded p-2 hover:bg-secondary transition-colors">
              <Github className="size-4" />
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl flex">
        <aside className={`${sidebarOpen ? "block" : "hidden"} md:block w-64 shrink-0 border-r border-border`}>
          <nav className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto p-4 space-y-6">
            {docsNav.map((section) => (
              <SidebarSection key={section.title} section={section} onCloseMobile={() => setSidebarOpen(false)} />
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 px-6 py-8 md:px-12">
          <div className="mx-auto max-w-3xl prose prose-neutral dark:prose-invert">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarSection({ section, onCloseMobile }: { section: DocSection; onCloseMobile: () => void }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {section.title}
      </h3>
      <ul className="space-y-1">
        {section.items.map((item) => (
          <li key={item.slug}>
            <a
              href={`/docs/${item.slug}`}
              onClick={onCloseMobile}
              className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { DocsLayout };
