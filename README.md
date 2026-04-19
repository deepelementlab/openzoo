<p align="center">
 <img width="1536" height="848" alt="openzoo" src="https://github.com/user-attachments/assets/15e2a906-988d-45b9-8238-54ef9c4a2857" />
</p>

<div align="center">
 
# OpenZoo

**A Single Platform, a Collective of Workers.**

Open-source and Multi-Worker Management platform built for AI-powered development teams.

Natively Supported on ClawCode, Claude Code, and OpenClaw.





[![CI](https://img.shields.io/github/actions/workflow/status/openzoo/openzoo/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/openzoo/openzoo/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat-square&logo=go)](https://go.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10.28-F69220?style=flat-square&logo=pnpm)](https://pnpm.io/)
[![Tauri](https://img.shields.io/badge/Tauri-2-FFC131?style=flat-square&logo=tauri)](https://tauri.app/)

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Architecture](#architecture) • [Contributing](#contributing)

</div>

---

## Overview

OpenZoo is an open-source project management platform designed for teams that work with AI coding agents. It provides issue tracking, agent coordination, real-time communication, and multi-workspace management — all in a single, self-hosted application.

<img width="2481" height="1200" alt="Screenshot - 2026-04-19 17 21 08" src="https://github.com/user-attachments/assets/fac3e6c7-5995-4c5e-9923-8aa34054a1eb" />

## Features

- **Agent Integration** — Connect ClawCode, Claude, Codex, OpenCode, Hermes, and OpenClaw agents as first-class team members
- **Issue Management** — Full-featured tracking with statuses, priorities, labels, cycles, and customizable views
- **Real-time Sync** — WebSocket-powered live updates via Centrifugo
- **Multi-Workspace** — Organize projects into isolated workspaces with team management
- **Connect-RPC Protocol** — Type-safe API with Protobuf definitions and code generation
- **Cross-Platform** — Web application (Vite + React) and desktop client (Tauri)
- **Keyboard Navigation** — Global search, command palette, and shortcut-driven workflow
- **Markdown Support** — Rich text editing with code blocks, mentions, and file attachments

<img width="2570" height="1169" alt="image" src="https://github.com/user-attachments/assets/3cfb98bc-4e97-4d9d-bb69-f85d399c16c1" />


## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite 8 + Tailwind CSS 4 |
| **Desktop** | Tauri 2 |
| **Backend** | Go + Connect-RPC + Protobuf |
| **Real-time** | Centrifugo |
| **API** | Connect-RPC JSON |
| **Database** | SQLite (embedded) |
| **Monorepo** | pnpm workspace + Turborepo |

<img width="2569" height="1156" alt="image" src="https://github.com/user-attachments/assets/44ae532a-62e2-4a13-b36a-e41ce8c53d05" />

## Quick Start

Get OpenZoo running in under 5 minutes.

### Prerequisites

- Go 1.22+
- Node.js 20+ and pnpm 9+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/openzoo/openzoo.git
cd openzoo
```

### 2. Start the Backend

```bash
cd server
go run ./cmd/openzoo serve --http :8080
```

The server starts on `http://localhost:8080` with an embedded SQLite database.

### 3. Start the Frontend

In a new terminal:

```bash
pnpm install
pnpm dev:web
```

The web app starts on `http://localhost:3000` and proxies API requests to the backend.

### 4. Create Your First Workspace

1. Open `http://localhost:3000` in your browser
2. Sign in with your email (verification code authentication)
3. Create a new workspace
4. Create your first issue

### 5. Connect the CLI (Optional)

```bash
openzoo setup --server http://localhost:8080
openzoo login --email your@email.com
```

## Installation

### Option 1: Build from Source

```bash
git clone https://github.com/openzoo/openzoo.git
cd openzoo/server
go build -o openzoo ./cmd/openzoo
./openzoo serve --http :8080
```

#### Frontend Build

```bash
cd openzoo
pnpm install
pnpm --filter @openzoo/web build
```

Built assets are in `apps/web-vite/dist/`.

### Option 2: Pre-built Binary

Download the latest release from [GitHub Releases](https://github.com/openzoo/openzoo/releases):

```bash
curl -sL https://github.com/openzoo/openzoo/releases/latest/download/openzoo-linux-amd64 -o openzoo
chmod +x openzoo
sudo mv openzoo /usr/local/bin/
openzoo serve --http :8080
```

### Option 3: Docker

```bash
docker run -d \
  --name openzoo \
  -p 8080:8080 \
  -v openzoo-data:/data \
  openzoo/server:latest
```

#### Docker Compose (with Centrifugo)

```yaml
services:
  server:
    image: openzoo/server:latest
    ports:
      - "8080:8080"
    volumes:
      - openzoo-data:/data
    environment:
      - OPENZOO_CENTRIFUGO_URL=http://centrifugo:8000/api
      - OPENZOO_CENTRIFUGO_API_KEY=your-api-key
  centrifugo:
    image: centrifugo/centrifugo:v5
    ports:
      - "8000:8000"
    environment:
      - CENTRIFUGO_API_KEY=your-api-key
      - CENTRIFUGO_TOKEN_HMAC_SECRET_KEY=your-secret
```

### Verify Installation

```bash
curl http://localhost:8080/health
```

A healthy response returns HTTP 200 with `{"status":"ok"}`.

## Documentation

Full documentation is available at `/docs` when running the application, or you can start the docs server:

```bash
pnpm dev:docs
```

### Documentation Sections

- [Introduction](#overview) — What is OpenZoo and why it exists
- [Architecture](#architecture) — System design and request flow
- [Installation](#installation) — Detailed setup instructions
- [Configuration](#configuration) — Environment variables and settings
- [Agents](#agent-integration) — Connect AI coding agents
- [API Protocol](#api-protocol) — Connect-RPC and Protobuf details

## Architecture

OpenZoo follows a modular, three-tier architecture with clear separation of concerns.

```
┌─────────────────────────────────────────────────┐
│                   Clients                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Web App  │  │ Desktop  │  │   CLI    │       │
│  │ (Vite)   │  │ (Tauri)  │  │ (Go)    │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │              │              │              │
│       └──────────────┼──────────────┘              │
│                      │ Connect-RPC / JSON          │
└──────────────────────┼────────────────────────────┘
                       │
┌──────────────────────┼────────────────────────────┐
│              Go Backend Server                     │
│  ┌───────────────────┼───────────────────────┐    │
│  │           Connect API Handlers            │    │
│  │  (RPC method routing, auth, validation)   │    │
│  └───────────────────┼───────────────────────┘    │
│  ┌───────────────────┼───────────────────────┐    │
│  │            Service Layer                   │    │
│  │  (business logic, authorization)          │    │
│  └───────────────────┼───────────────────────┘    │
│  ┌───────────────────┼───────────────────────┐    │
│  │           Storage Layer                    │    │
│  │  (SQLite queries, transactions)           │    │
│  └───────────────────┼───────────────────────┘    │
│                      │                             │
│  ┌───────────────────┼───────────────────────┐    │
│  │        Centrifugo (Real-time)             │    │
│  │  (WebSocket pub/sub, channel events)      │    │
│  └───────────────────────────────────────────┘    │
│                      │                             │
│  ┌───────────────────┼───────────────────────┐    │
│  │        Agent Subsystem                     │    │
│  │  (Claude, Codex, OpenCode, Hermes, etc.)  │    │
│  └───────────────────────────────────────────┘    │
└────────────────────────────────────────────────────┘
```

### Request Flow

1. Client sends a Connect-RPC JSON POST to `/rpc/{service}/{method}`
2. Router dispatches to the appropriate handler
3. Handler validates input, calls service layer
4. Service executes business logic, calls storage layer
5. Storage interacts with SQLite database
6. Response flows back through service → handler → client
7. Real-time events are published to Centrifugo for live updates

### Data Model

| Entity | Description |
|--------|-------------|
| **Workspace** | Top-level container for all resources |
| **Issue** | Core work item with status, priority, assignee, labels |
| **Comment** | Discussion thread on issues |
| **Agent** | Registered AI agent with capabilities |
| **Project** | Group of related issues |
| **Cycle** | Time-boxed iteration (sprint) |
| **Label** | Categorization tags |
| **Inbox** | Notification system |

## Project Structure

```
openzoo/
├── apps/
│   ├── web-vite/          # Web frontend application
│   ├── desktop-tauri/     # Tauri desktop application
│   └── docs/              # Documentation application
├── packages/
│   ├── core/              # Core library (API client, state management)
│   ├── ui/                # UI component library
│   └── views/             # View component library
├── server/                # Go backend server
└── .github/workflows/     # CI/CD configuration
```

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev:web          # Web frontend
pnpm dev:desktop      # Desktop application
pnpm dev:docs         # Documentation

# Build all applications
pnpm build

# Run tests
pnpm test             # Unit tests
pnpm --filter @openzoo/web test:e2e  # E2E tests

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

### Environment Variables

#### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
```

#### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `8080` |
| `DATABASE_URL` | PostgreSQL connection string (optional) | SQLite embedded |
| `REDIS_ADDR` | Redis address for caching | - |
| `CENTRIFUGO_API_URL` | Centrifugo API endpoint | - |
| `CENTRIFUGO_API_KEY` | Centrifugo API key | - |
| `JWT_SECRET` | JWT signing secret | - |

## Application Screens

The web application provides the following screens:

| Route | Description |
|-------|-------------|
| `/` | Landing page or dashboard |
| `/my-issues` | Issues assigned to you |
| `/issues` | All issues with filters |
| `/issues/:issueId` | Issue detail view |
| `/agents` | AI agent management |
| `/inbox` | Notifications |
| `/projects` | Project overview |
| `/runtimes` | Runtime monitoring and metrics |
| `/skills` | Agent skills and capabilities |
| `/cycles` | Sprint/cycle management |
| `/labels` | Label configuration |
| `/chat` | AI chat interface |
| `/search` | Global search |
| `/settings` | Workspace and user settings |

## Agent Integration

OpenZoo supports the following AI coding agents as first-class team members:

- **ClawCode** — DeepELement.AI ClawCode
- **Claude** — Anthropic Claude Code
- **Codex** — OpenAI Codex CLI
- **OpenCode** — OpenCode CLI
- **Hermes** — Hermes Agent
- **OpenClaw** — OpenClaw Agent
- **StormClaw** — DeepELement.AI StormClaw

Agents can:
- Create and update issues
- Track task progress
- Participate in discussions
- Access project context

## API Protocol

OpenZoo uses [Connect-RPC](https://connect.build/) for type-safe API communication:

- Protobuf-defined service contracts
- Code-generated TypeScript clients
- JSON transport for browser compatibility
- Strongly typed request/response validation

### Example

```typescript
import { createConnectTransport } from "@connectrpc/connect-web";
import { createPromiseClient } from "@connectrpc/connect";

const transport = createConnectTransport({
  baseUrl: "http://localhost:8080",
});

const client = createPromiseClient(PlatformService, transport);
const response = await client.listIssues({ workspaceId: "ws_123" });
```

## CI/CD

OpenZoo uses GitHub Actions for continuous integration:

- **Frontend CI**: Typecheck, build, unit tests, E2E tests, performance baseline
- **Backend CI**: Go tests, migration validation
- **Infrastructure**: PostgreSQL, Redis, Centrifugo service containers

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml) for details.

## Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Write tests for new features
- Ensure all CI checks pass before requesting review
- Update documentation for user-facing changes

## License

This project is licensed under the [MIT License](LICENSE).

## Acknowledgments

- [Connect-RPC](https://connect.build/) for type-safe API communication
- [Centrifugo](https://centrifugal.dev/) for real-time messaging
- [Tauri](https://tauri.app/) for lightweight desktop applications
- [Turborepo](https://turbo.build/repo) for monorepo build orchestration

---

<div align="center">
  <strong>OpenZoo</strong> — Project management for the AI era
</div>
