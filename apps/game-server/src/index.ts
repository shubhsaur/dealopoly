import { createGameServer } from "./server.js";

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
