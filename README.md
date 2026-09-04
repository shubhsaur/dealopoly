# Dealopoly Arcade 🃏🎯

> Real-Time Multiplayer Card Gaming Platform.

Dealopoly Arcade is a modern, web-based multiplayer card platform built for speed, strategy, and competitive fun. Play real-time card games with friends via private room codes or challenge heuristic AI bots across multiple difficulty levels—playable instantly as a guest or with persistent profile stats.

---

## 🎮 Featured Games

### 🃏 1. Monodeal (Property Trading Strategy)

A fast-paced, cutthroat property-trading card game inspired by Monopoly Deal.

- **Objective**: Be the first player to assemble **3 full property sets** of different color categories.
- **Mechanics**:
  - Draw 2 cards per turn (or 5 if your hand is empty).
  - Play up to 3 cards per turn to your **Property Zone**, **Bank**, or as **Action Cards**.
  - Collect rent with Multi-Color & Standard Rent cards, amplified by Houses and Hotels.
  - Sabotage opponents with high-impact action cards: **Deal Breakers** (steal full sets), **Sly Deals** (steal single cards), **Forced Deals** (swap properties), and counter with **Just Say No**!
- **Players**: 2–5 players (human or AI bots).

### 🎯 2. Least Count / Lowdeck (Bluff & Deduction)

A classic Indian card game of tactical discards, hand reduction, and high-stakes declarations.

- **Objective**: Minimize the total point value of your hand and declare when your count is **7 points or lower**.
- **Scoring System**:
  - **Kings**: `0` points (the ultimate low-count card!)
  - **Aces**: `1` point
  - **Number Cards (2–10)**: Face value (`2`–`10` points)
  - **Jacks & Queens**: `10` points (Custom variant: Queens can score `12`)
- **Mechanics**:
  - Drop single high cards, matched pairs/triples, or suited consecutive sequences (e.g., `4♠-5♠-6♠`) into the discard stack.
  - Draw from the face-down Draw Pile or retrieve the top card from the Discard Stack.
  - Call **"Show" / Declare** when your hand count is $\le 7$. If you hold the strictly lowest count, you win! If an opponent holds an equal or lower count, you suffer a punishing **40-point wrong-show penalty**!
- **Players**: 2–5 players (human or AI bots).

---

## ✨ Platform Features

- **Multi-Game Hub**: Easily launch, join, and switch between Monodeal and Least Count tables from a unified arcade lobby.
- **Intelligent AI Bots**: Built-in deterministic bots with 3 distinct difficulty tiers:
  - **Easy**: Casual, randomized card drops for relaxed play.
  - **Medium**: Balanced decision-making, basic rent collection, and low-risk declarations.
  - **Hard**: Aggressive property hoarding, tactical "Just Say No" retention, card tracking, and risk-calculated declarations.
- **Real-Time Multiplayer**:
  - Powered by Fastify WebSockets for sub-100ms move replication.
  - Server-authoritative game state validation and disconnect recovery.
  - Redis Pub/Sub support for horizontal scaling across multiple server instances.
- **Polished Presentation**:
  - Authentic 3D embossed cards with custom textures, foil finishes, and responsive drag/click controls.
  - Horizontal-scrolling property racks with dedicated navigation buttons for multi-card sets.
  - Floating toast action reel to announce player moves without center-stage layout shifts.
  - Dynamic **Recent Rooms** memory to instantly reconnect to your last visited game lobbies.
- **Flexible Authentication**:
  - **Guest Play**: Instant access without registration.
  - **User Accounts**: NextAuth.js authentication for persistent match history, win/loss records, and stats.

---

## 🏗️ Workspace Architecture

This monorepo is managed with [Turborepo](https://turbo.build/) and [pnpm](https://pnpm.io/):

```
dealopoly/
├── apps/
│   ├── web/               # Next.js 16 (App Router, Turbopack, Tailwind CSS, Framer Motion)
│   └── game-server/       # Authoritative Fastify + WebSocket game server
├── packages/
│   ├── game-engine/       # Deterministic rules, state machines & bots for Monodeal & Least Count
│   ├── db/                # Drizzle ORM schema, Postgres database connection & migrations
│   ├── redis/             # Upstash Redis state cache, disconnect timers & Pub/Sub messaging
│   ├── shared/            # Shared types, card definitions, bot difficulties & validation
│   └── ui/                # Shared UI primitives and design components
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `20.0.0` or later
- **pnpm**: `9.0.0` or later
- **Docker**: (Optional) For running local PostgreSQL

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/shubhamsaurabh/dealopoly.git
   cd dealopoly
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Configure environment variables**:

   ```bash
   cp .env.example .env
   ```

   Configure your database and redis connection details in `.env` (or run in memory-only mode for local development).

4. **Start local database (Optional)**:

   ```bash
   docker compose up -d postgres
   ```

5. **Run local development servers**:
   ```bash
   pnpm dev
   ```

- **Web Application**: [`http://localhost:3000`](http://localhost:3000)
- **Game Server**: [`http://localhost:4000`](http://localhost:4000) (Health check: `http://localhost:4000/health`)

---

## 🧪 Quality Checks & Testing

Run verification commands across all packages using Turbo:

```bash
# Run unit tests across all packages (game engines, server, web)
pnpm test

# Type-check TypeScript in all apps and packages
pnpm typecheck

# Run linter
pnpm lint

# Check code formatting
pnpm format:check

# Create production builds
pnpm build
<<<<<<< Updated upstream
=======
```

---

## 📄 License

MIT © [Dealopoly](https://github.com/shubhamsaurabh/dealopoly)
>>>>>>> Stashed changes
