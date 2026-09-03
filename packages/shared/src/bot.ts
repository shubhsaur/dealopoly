export type BotDifficulty = "easy" | "medium" | "hard" | "expert";

export const BOT_DIFFICULTIES: readonly BotDifficulty[] = [
  "easy",
  "medium",
  "hard",
  "expert",
] as const;

export const DEFAULT_BOT_DIFFICULTY: BotDifficulty = "medium";

export function parseBotDifficulty(value: unknown): BotDifficulty {
  if (value === "easy" || value === "medium" || value === "hard" || value === "expert") {
    return value;
  }
  return DEFAULT_BOT_DIFFICULTY;
}
