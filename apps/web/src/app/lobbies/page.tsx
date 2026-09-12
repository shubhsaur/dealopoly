"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppShell } from "../_components/app-shell";
import { fetchLobbiesApi, type PublicLobby } from "../../lib/api";
import { getStoredProfile } from "../../lib/session";

const GAME_LABELS: Record<string, string> = {
  monodeal: "Monodeal",
  least_count: "Lowdeck",
};

export default function LobbiesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [lobbies, setLobbies] = useState<PublicLobby[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const game = filter === "all" ? undefined : filter;
      const data = await fetchLobbiesApi(game);
      setLobbies(data.lobbies);
      setError(null);
    } catch (err) {
      setError("Failed to load public lobbies.");
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [filter]);

  const handleJoin = (lobby: PublicLobby) => {
    const profile = getStoredProfile();
    const playerName = session?.user?.name || profile.name || "Player";
    router.push(
      `/lobby?room=${encodeURIComponent(lobby.code)}&player=${encodeURIComponent(playerName)}&game=${encodeURIComponent(lobby.gameType)}`,
    );
  };

  return (
    <AppShell active="play">
      <div className="shell" style={{ padding: "24px 16px 56px" }}>
        <div
          className="section-header"
          style={{ textAlign: "center", marginBottom: "32px" }}
        >
          <p className="kicker">PUBLIC LOBBIES</p>
          <h1 style={{ fontSize: "2rem", fontWeight: 900 }}>Join a Game</h1>
          <p style={{ color: "#94a3b8", maxWidth: "600px", margin: "0 auto" }}>
            Browse open rooms and jump into a live match.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "24px",
          }}
        >
          {["all", "monodeal", "least_count"].map((key) => (
            <button
              key={key}
              type="button"
              className={`button ${filter === key ? "button--primary" : "button--secondary"}`}
              onClick={() => setFilter(key)}
            >
              {key === "all" ? "All Games" : (GAME_LABELS[key] ?? key)}
            </button>
          ))}
        </div>

        {error && (
          <div className="u-text-center u-mb-4" style={{ color: "#f87171" }}>
            {error}
          </div>
        )}

        {lobbies.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 24px",
              border: "1px dashed rgba(255,255,255,0.15)",
              borderRadius: "16px",
              color: "#94a3b8",
            }}
          >
            No public lobbies right now. Create one and invite others!
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {lobbies.map((lobby) => (
              <div
                key={lobby.code}
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--primary)",
                    }}
                  >
                    {GAME_LABELS[lobby.gameType] ?? lobby.gameType}
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "#34d399",
                    }}
                  >
                    Open
                  </span>
                </div>

                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>
                    {lobby.name || `Room ${lobby.code}`}
                  </h3>
                  <p
                    style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#94a3b8" }}
                  >
                    Host: {lobby.hostName}
                  </p>
                </div>

                <div style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
                  Players: {lobby.playerCount} / {lobby.maxSeats}
                </div>

                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => handleJoin(lobby)}
                >
                  Join Room
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
