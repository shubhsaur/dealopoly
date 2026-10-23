ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "user_email" text;
CREATE INDEX IF NOT EXISTS "players_user_email_idx" ON "players" ("user_email");
CREATE INDEX IF NOT EXISTS "players_user_id_idx" ON "players" ("user_id");

ALTER TABLE "leaderboard_entries" ADD COLUMN IF NOT EXISTS "user_email" text;
CREATE INDEX IF NOT EXISTS "leaderboard_user_email_idx" ON "leaderboard_entries" ("user_email");
