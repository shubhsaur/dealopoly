ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "config" jsonb;
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "is_private" boolean DEFAULT true NOT NULL;
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "room_seats" ADD COLUMN IF NOT EXISTS "difficulty" text;
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "game_type" text DEFAULT 'monodeal' NOT NULL;
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "game_type" text DEFAULT 'monodeal' NOT NULL;
