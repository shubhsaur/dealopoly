# Dealopoly Arcade 🃏🎯

> Real-Time Multiplayer Card Gaming Platform.

Dealopoly Arcade is a modern, web-based multiplayer card platform built for speed, strategy, and competitive fun. Play real-time card games with friends via private room codes or public lobbies, or challenge heuristic AI bots across multiple difficulty levels—playable instantly as a guest or with persistent accounts and global leaderboard rankings.

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
  - Concurrent multi-player payment resolution with interactive reaction timers and JSN counter-chains.
- **Rules & Cards**: Explore the interactive [Monodeal Rules](/monodeal/rules) and [Card Catalogue](/monodeal/cards).
- **Players**: 2–5 players (human or AI bots).

### 🎯 2. Lowdeck / Least Count (Bluff & Deduction)

A classic card game of tactical discards, hand reduction, and high-stakes declarations played with a luxury 52-card deck.

- **Objective**: Minimize the total point value of your hand and declare when your count is **7 points or lower**.
- **Scoring System**:
  - **Kings**: `0` points (the ultimate low-count card!)
  - **Aces**: `1` point
  - **Number Cards (2–10)**: Face value (`2`–`10` points)
  - **Jacks & Queens**: `10` points
- **Mechanics**:
  - Drop single high cards, matched pairs/triples, or suited consecutive sequences (e.g., `4♠-5♠-6♠`) into the discard stack.
  - Draw from the face-down Draw Pile or retrieve the top card from the Discard Stack.
  - Call **"Show" / Declare** when your hand count is $\le 7$. If you hold the strictly lowest count, you win! If an opponent holds an equal or lower count, you suffer a punishing **40-point wrong-show penalty**!
- **Rules & Cards**: Explore the interactive [Lowdeck Rules](/lowdeck/rules) and [Card Catalogue](/lowdeck/cards).
- **Players**: 2–5 players (human or AI bots).

---

## ✨ Platform Features

- **Multi-Game Hub & Public Lobbies**:
  - Launch, browse, and join public or private rooms across games from `/browse-games` and `/lobbies`.
  - Filter rooms by game type, status, and player counts with real-time seat availability.
- **Global Leaderboards & Stats**:
  - Competitive leaderboards at `/leaderboard` tracking wins, win rate, total matches, win streaks, and rating scores.
  - Guarded bot vs. PvP match statistics and persistent player profile histories at `/profile` and `/history`.
- **Intelligent AI Bots**:
  - Heuristic deterministic bots with 3 distinct difficulty tiers:
    - **Easy**: Casual, randomized card drops for relaxed play.
    - **Medium**: Balanced decision-making, basic rent collection, and low-risk declarations.
    - **Hard**: Aggressive property hoarding, tactical "Just Say No" retention, card tracking, and risk-calculated declarations.
  - Automatic bot takeover if a player disconnects during a live match.
- **Real-Time Multiplayer Architecture**:
  - Powered by Fastify WebSockets for sub-100ms move replication.
  - Server-authoritative game state validation and disconnect recovery.
  - Redis Pub/Sub support for distributed game event propagation.
- **Polished Card Design & Table Presentation**:
  - Custom 3D foil finishes, embossed textures, and Art-Deco court card illustrations.
  - Smooth card animations (flying draw animations, fanned hands, interactive discard selection).
  - Floating toast action reel to announce player moves without disrupting table layout.
  - Audio sound effects for turns, reaction timer warnings, and victory celebrations.
- **Flexible Authentication**:
  - **Guest Play**: Instant access with seamless anonymous sessions.
  - **User Accounts**: NextAuth.js authentication for persistent match history, profile avatars, and stats tracking.

---

## 🏗️ Workspace Architecture

This monorepo is managed with [Turborepo](https://turbo.build/) and [pnpm](https://pnpm.io/):

```
dealopoly/
├── apps/
│   ├── web/               # Next.js 16 (App Router, Turbopack, Tailwind CSS, Framer Motion)
│   └── game-server/       # Authoritative Fastify + WebSocket real-time game server
├── packages/
│   ├── game-engine/       # Deterministic rules, state machines & bots for Monodeal & Lowdeck
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
- **Docker**: (Optional) For running local PostgreSQL and Redis

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/shubhsaur/dealopoly.git
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

4. **Start local services with Docker (Optional)**:

   ```bash
   docker compose up -d postgres redis
   ```

5. **Run database migrations (if using PostgreSQL)**:

   ```bash
   pnpm db:push
   ```

6. **Run local development servers**:

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
```

---

## 📄 License

MIT © [Dealopoly](https://github.com/shubhamsaurabh/dealopoly)
