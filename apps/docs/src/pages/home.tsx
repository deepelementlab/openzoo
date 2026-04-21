import { Layers, ArrowRight, BookOpen, Cpu, Terminal, Settings } from "lucide-react";

function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-2 font-bold text-lg">
            <Layers className="size-5 text-primary" />
            OpenZoo
          </a>
          <a href="https://github.com/openzoo/openzoo" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
            GitHub
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">OpenZoo Documentation</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Everything you need to know about building, deploying, and using OpenZoo — the open-source project management platform for human + agent teams.
        </p>
        <a
          href="/docs/introduction"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Get Started
          <ArrowRight className="size-4" />
        </a>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: BookOpen, title: "Getting Started", desc: "Install, configure, and launch your first workspace.", link: "/docs/quick-start" },
            { icon: Cpu, title: "Architecture", desc: "Understand the monorepo, three-tier backend, and Connect-RPC protocol.", link: "/docs/overview" },
            { icon: Terminal, title: "Guides", desc: "Deploy to production, integrate agents, and use the CLI.", link: "/docs/deployment" },
          ].map((card) => (
            <a
              key={card.title}
              href={card.link}
              className="group rounded-lg border border-border p-6 space-y-3 hover:border-primary/50 transition-colors"
            >
              <card.icon className="size-6 text-primary" />
              <h3 className="font-semibold group-hover:text-primary transition-colors">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.desc}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

export { HomePage };
