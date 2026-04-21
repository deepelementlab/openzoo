export interface DocSection {
  title: string;
  items: DocItem[];
}

export interface DocItem {
  slug: string;
  title: string;
}

export const docsNav: DocSection[] = [
  {
    title: "Getting Started",
    items: [
      { slug: "introduction", title: "Introduction" },
      { slug: "quick-start", title: "Quick Start" },
      { slug: "installation", title: "Installation" },
    ],
  },
  {
    title: "Architecture",
    items: [
      { slug: "overview", title: "System Overview" },
      { slug: "monorepo", title: "Monorepo Structure" },
      { slug: "frontend", title: "Frontend Architecture" },
      { slug: "backend", title: "Backend Architecture" },
      { slug: "realtime", title: "Realtime Communication" },
      { slug: "api-protocol", title: "API Protocol (Connect-RPC)" },
    ],
  },
  {
    title: "Guides",
    items: [
      { slug: "deployment", title: "Deployment" },
      { slug: "configuration", title: "Configuration" },
      { slug: "agents", title: "Agent Integration" },
      { slug: "cli", title: "CLI Reference" },
    ],
  },
  {
    title: "Development",
    items: [
      { slug: "contributing", title: "Contributing" },
      { slug: "testing", title: "Testing" },
      { slug: "debugging", title: "Debugging" },
    ],
  },
];

export function getAllSlugs(): string[] {
  return docsNav.flatMap((s) => s.items.map((i) => i.slug));
}

export function getDocTitle(slug: string): string | undefined {
  for (const section of docsNav) {
    const item = section.items.find((i) => i.slug === slug);
    if (item) return item.title;
  }
  return undefined;
}
