import * as React from "react";
import { ArrowRight, Bot, Zap, Globe, Layers, Github, MessageSquare } from "lucide-react";

interface LandingPageProps {
  onGetStarted?: () => void;
  onLogin?: () => void;
  onGoToDocs?: () => void;
}

function LandingPage({ onGetStarted, onLogin, onGoToDocs }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <Layers className="size-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">OpenZoo</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <button type="button" onClick={onGoToDocs} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </button>
            <a href="https://github.com/openzoo/openzoo" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              GitHub
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onLogin} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground">
            <Zap className="size-3.5" />
            Open-source project management for human + agent teams
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Turn coding agents into{" "}
            <span className="text-primary">real teammates</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Manage issues, coordinate agents, and ship faster with AI-powered workflows.
            Built for teams that work with Claude, Codex, OpenCode, and more.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started Free
              <ArrowRight className="size-4" />
            </button>
            <a
              href="https://github.com/openzoo/openzoo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-3 text-sm font-medium bg-background hover:bg-secondary transition-colors"
            >
              <Github className="size-4" />
              Star on GitHub
            </a>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-2xl font-bold">Core Features</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Bot,
                title: "Agent Integration",
                description: "Connect Claude, Codex, OpenCode, Hermes, and OpenClaw agents. Assign issues and track progress in real-time.",
              },
              {
                icon: MessageSquare,
                title: "Issue Management",
                description: "Full-featured issue tracking with statuses, priorities, labels, cycles, and customizable views.",
              },
              {
                icon: Zap,
                title: "Real-time Sync",
                description: "WebSocket-powered live updates. See changes instantly across all connected clients.",
              },
              {
                icon: Globe,
                title: "Multi-Workspace",
                description: "Organize projects into workspaces. Switch contexts without losing your place.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-border bg-background p-6 space-y-3"
              >
                <div className="flex size-10 items-center justify-center rounded-md bg-primary/10">
                  <feature.icon className="size-5 text-primary" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-2xl font-bold">Architecture</h2>
          <div className="mx-auto max-w-3xl rounded-lg border border-border bg-muted/30 p-8">
            <div className="space-y-4 text-sm font-mono">
              <div className="rounded-md bg-background p-4 border border-border">
                <p className="text-muted-foreground mb-2">Frontend (React 19 + Vite)</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">@openzoo/core</span>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">@openzoo/ui</span>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">@openzoo/views</span>
                </div>
              </div>
              <div className="flex justify-center text-muted-foreground">↓ Connect-RPC / JSON ↓</div>
              <div className="rounded-md bg-background p-4 border border-border">
                <p className="text-muted-foreground mb-2">Backend (Go)</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="rounded bg-green-500/10 px-2 py-0.5 text-green-600">handler → service → storage</span>
                  <span className="rounded bg-green-500/10 px-2 py-0.5 text-green-600">Centrifugo</span>
                </div>
              </div>
              <div className="flex justify-center text-muted-foreground">↓ ↓ ↓</div>
              <div className="rounded-md bg-background p-4 border border-border">
                <p className="text-muted-foreground mb-2">Agents</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="rounded bg-blue-500/10 px-2 py-0.5 text-blue-600">Claude</span>
                  <span className="rounded bg-blue-500/10 px-2 py-0.5 text-blue-600">Codex</span>
                  <span className="rounded bg-blue-500/10 px-2 py-0.5 text-blue-600">OpenCode</span>
                  <span className="rounded bg-blue-500/10 px-2 py-0.5 text-blue-600">Hermes</span>
                  <span className="rounded bg-blue-500/10 px-2 py-0.5 text-blue-600">OpenClaw</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Layers className="size-4" />
            <span>OpenZoo v0.1.0</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/openzoo/openzoo" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              GitHub
            </a>
            <button type="button" onClick={onGoToDocs} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Documentation
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export { LandingPage };
