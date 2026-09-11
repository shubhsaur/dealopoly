const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_GAME_SERVER_URL ||
  "http://localhost:4000";

export interface CreateRoomResponse {
  roomCode: string;
  hostPlayerId: string;
  sessionToken: string;
  room: {
    code: string;
    hostPlayerId: string;
    status: string;
    maxSeats: number;
    seats: Array<{
      seatIndex: number;
      playerId: string;
      name: string;
      isBot: boolean;
      isConnected: boolean;
    }>;
  };
}

export interface JoinRoomResponse {
  roomCode: string;
  playerId: string;
  sessionToken: string;
  room: {
    code: string;
    hostPlayerId: string;
    status: string;
    maxSeats: number;
    seats: Array<{
      seatIndex: number;
      playerId: string;
      name: string;
      isBot: boolean;
      isConnected: boolean;
    }>;
  };
}

export interface SpectateRoomResponse {
  spectatorId: string;
  roomCode: string;
  room: {
    code: string;
    hostPlayerId: string;
    status: string;
    maxSeats: number;
    seats: Array<{
      seatIndex: number;
      playerId: string;
      name: string;
      isBot: boolean;
      isConnected: boolean;
    }>;
    spectatorCount: number;
  };
}

export async function createRoomApi(params: {
  hostName?: string;
  botCount?: number;
  botDifficulty?: string;
  userId?: string;
  gameType?: string;
  isPrivate?: boolean;
  name?: string;
  config?: Record<string, unknown>;
}): Promise<CreateRoomResponse> {
  const res = await fetch(`${API_BASE}/api/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hostName: params.hostName || "Host",
      botCount: params.botCount ?? 0,
      botDifficulty: params.botDifficulty,
      userId: params.userId,
      gameType: params.gameType || "monodeal",
      isPrivate: params.isPrivate,
      name: params.name,
      config: params.config,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create room (${res.status})`);
  }

  return res.json();
}

export async function joinRoomApi(params: {
  roomCode: string;
  playerName?: string;
  userId?: string;
}): Promise<JoinRoomResponse> {
  const res = await fetch(`${API_BASE}/api/rooms/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to join room (${res.status})`);
  }

  return res.json();
}

export async function spectateRoomApi(params: {
  roomCode: string;
  spectatorName?: string;
}): Promise<SpectateRoomResponse> {
  const res = await fetch(
    `${API_BASE}/api/rooms/${encodeURIComponent(params.roomCode)}/spectate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spectatorName: params.spectatorName }),
    },
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to spectate room (${res.status})`);
  }

  return res.json();
}

export async function fetchRoomApi(roomCode: string) {
  const res = await fetch(`${API_BASE}/api/rooms/${roomCode}`);
  if (!res.ok) {
    throw new Error(`Room ${roomCode} not found`);
  }
  return res.json();
}

export interface ServerStats {
  serversOnline: boolean;
  onlinePlayers: number;
  activeRooms: number;
  totalPlayers: number;
  totalGames: number;
}

export async function fetchStatsApi(): Promise<ServerStats> {
  try {
    const res = await fetch("/api/stats", { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback to direct game server
  }

  try {
    const res = await fetch(`${API_BASE}/api/stats`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return {
        serversOnline: true,
        onlinePlayers: data.onlinePlayers ?? 0,
        activeRooms: data.activeRooms ?? 0,
        totalPlayers: data.onlinePlayers ?? 0,
        totalGames: data.totalRooms ?? 0,
      };
    }
  } catch {
    // Both failed
  }

  return {
    serversOnline: false,
    onlinePlayers: 0,
    activeRooms: 0,
    totalPlayers: 0,
    totalGames: 0,
  };
}

export interface PublicLobby {
  code: string;
  name: string | null;
  gameType: string;
  hostName: string;
  playerCount: number;
  maxSeats: number;
}

export async function fetchLobbiesApi(
  game?: string,
): Promise<{ lobbies: PublicLobby[] }> {
  const query = game ? `?game=${encodeURIComponent(game)}` : "";
  const res = await fetch(`${API_BASE}/api/lobbies${query}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch public lobbies");
  }
  return res.json();
}

export async function updateRoomApi(params: {
  roomCode: string;
  sessionToken: string;
  name?: string;
  isPrivate?: boolean;
}): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/rooms/${encodeURIComponent(params.roomCode)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionToken: params.sessionToken,
        name: params.name,
        isPrivate: params.isPrivate,
      }),
    },
  );
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to update room (${res.status})`);
  }
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  displayName: string | null;
  image: string | null;
  matches: number;
  wins: number;
  avgFinish: number;
  completedSets: number;
  score: number;
}

export async function fetchLeaderboardApi(
  game: string,
): Promise<{ leaderboard: LeaderboardEntry[] }> {
  const res = await fetch(
    `${API_BASE}/api/leaderboard?game=${encodeURIComponent(game)}`,
    {
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error("Failed to fetch leaderboard");
  }
  return res.json();
}

export async function fetchLeaderboardProfileApi(
  game: string,
  userId?: string,
): Promise<{ entry: LeaderboardEntry | null }> {
  const headers: Record<string, string> = {};
  if (userId) {
    headers["x-user-id"] = userId;
  }

  const res = await fetch(
    `${API_BASE}/api/leaderboard/profile?game=${encodeURIComponent(game)}`,
    {
      cache: "no-store",
      headers,
    },
  );
  if (!res.ok) {
    throw new Error("Failed to fetch leaderboard profile");
  }
  return res.json();
}
