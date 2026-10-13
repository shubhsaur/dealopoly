import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { AccessToken } from "livekit-server-sdk";

// Automatically load .env if not already set
if ((!process.env.LIVEKIT_URL || !process.env.LIVEKIT_API_KEY) && typeof process.loadEnvFile === "function") {
  const envCandidates = [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../../.env"),
    resolve(process.cwd(), "../.env"),
  ];
  for (const envPath of envCandidates) {
    if (existsSync(envPath)) {
      try {
        process.loadEnvFile(envPath);
      } catch {}
    }
  }
}

/**
 * Returns true if all required LiveKit environment variables are configured.
 */
export function isLiveKitConfigured(): boolean {
  return Boolean(
    process.env.LIVEKIT_URL &&
      process.env.LIVEKIT_API_KEY &&
      process.env.LIVEKIT_API_SECRET,
  );
}

/**
 * Returns the public LiveKit WebSockets URL (e.g. wss://dealopoly-xxx.livekit.cloud).
 */
export function getLiveKitUrl(): string | undefined {
  return process.env.LIVEKIT_URL;
}

/**
 * Generates a signed LiveKit JWT access token allowing a seated player to
 * publish microphone audio and subscribe to room participants.
 */
export async function generateLiveKitVoiceToken(
  roomCode: string,
  playerId: string,
  playerName: string,
): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit credentials (LIVEKIT_API_KEY / LIVEKIT_API_SECRET) not configured");
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: playerId,
    name: playerName,
    ttl: "4h",
  });

  at.addGrant({
    roomJoin: true,
    room: `dealopoly_${roomCode}`,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return await at.toJwt();
}
