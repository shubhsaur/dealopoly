import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createGameServer } from "./server.js";

// Automatically load .env if available
if (typeof process.loadEnvFile === "function") {
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

const port = Number.parseInt(
  process.env.PORT ?? process.env.GAME_SERVER_PORT ?? "4000",
  10
);

async function start() {
  try {
    const server = await createGameServer();
    await server.listen({ host: "0.0.0.0", port });
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

void start();
