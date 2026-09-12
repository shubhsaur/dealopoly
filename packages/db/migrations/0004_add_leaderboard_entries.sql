CREATE TABLE IF NOT EXISTS "leaderboard_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "game_type" text NOT NULL,
  "matches" integer DEFAULT 0 NOT NULL,
  "wins" integer DEFAULT 0 NOT NULL,
  "avg_finish" real DEFAULT 0 NOT NULL,
  "completed_sets" integer DEFAULT 0 NOT NULL,
  "score" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "leaderboard_user_game_idx" UNIQUE("user_id", "game_type")
);

CREATE INDEX IF NOT EXISTS "leaderboard_game_score_idx" ON "leaderboard_entries" ("game_type", "score" DESC);
