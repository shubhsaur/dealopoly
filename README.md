# Dealopoly

> Deal Your Way to Victory.

Dealopoly is a real-time, web-based property-card game. The initial release
supports standard two-to-five-player matches, playable with bots or friends
without requiring an account.

## Workspace

- `apps/web` — Next.js landing, lobby, and game-table experience.
- `apps/game-server` — authoritative real-time game service.
- `packages/game-engine` — deterministic game rules, independent of transport
  and UI.
- `packages/shared` — shared domain contracts and values.
- `packages/ui` — reusable interface primitives.

## Prerequisites

- Node.js 22 or later
- pnpm 9 or later
- Docker (optional, for the local PostgreSQL service)

## Local development

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres
pnpm dev
```

The web app runs on `http://localhost:3000` and the game-server health endpoint
is available at `http://localhost:3001/health`.

## Quality checks

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
