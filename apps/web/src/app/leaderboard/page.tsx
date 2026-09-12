import { AppShell } from "../_components/app-shell";
import {
  fetchLeaderboardApi,
  fetchLeaderboardProfileApi,
  type LeaderboardEntry,
} from "../../lib/api";
import { auth } from "@/lib/auth";

const GAME_LABELS: Record<string, string> = {
  monodeal: "Monodeal",
  least_count: "Lowdeck",
};

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  profileEntry: LeaderboardEntry | null;
}

function LeaderboardTable({ entries, profileEntry }: LeaderboardTableProps) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        overflow: "hidden",
        background: "rgba(15, 23, 42, 0.6)",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "rgba(255,255,255,0.03)" }}>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--muted)",
                width: "80px",
              }}
            >
              Rank
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "left",
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--muted)",
              }}
            >
              Player
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "center",
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--muted)",
                width: "100px",
              }}
            >
              Matches
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "center",
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--muted)",
                width: "80px",
              }}
            >
              Wins
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "center",
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--muted)",
                width: "100px",
              }}
            >
              Avg Finish
            </th>
            <th
              style={{
                padding: "12px 16px",
                textAlign: "right",
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--muted)",
                width: "100px",
              }}
            >
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const isProfile = profileEntry?.userId === entry.userId;
            return (
              <tr
                key={entry.id}
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  background: isProfile ? "rgba(102, 223, 117, 0.08)" : undefined,
                }}
              >
                <td
                  style={{
                    padding: "14px 16px",
                    fontWeight: 700,
                    fontFamily: "var(--mono)",
                  }}
                >
                  {index + 1}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {entry.image ? (
                      <img
                        src={entry.image}
                        alt={entry.displayName ?? "Player"}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "var(--primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        {(entry.displayName ?? "P").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        {entry.displayName ?? "Unknown"}
                      </div>
                      {isProfile && (
                        <div style={{ fontSize: "0.7rem", color: "var(--green)" }}>
                          You
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    textAlign: "center",
                    fontFamily: "var(--mono)",
                  }}
                >
                  {formatNumber(entry.matches)}
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    textAlign: "center",
                    fontFamily: "var(--mono)",
                  }}
                >
                  {formatNumber(entry.wins)}
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    textAlign: "center",
                    fontFamily: "var(--mono)",
                  }}
                >
                  {entry.avgFinish.toFixed(2)}
                </td>
                <td
                  style={{
                    padding: "14px 16px",
                    textAlign: "right",
                    fontWeight: 800,
                    fontFamily: "var(--mono)",
                    color: "var(--primary)",
                  }}
                >
                  {formatNumber(entry.score)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {entries.length === 0 && (
        <div
          style={{ padding: "40px 24px", textAlign: "center", color: "var(--muted)" }}
        >
          No leaderboard entries yet. Be the first to play!
        </div>
      )}
    </div>
  );
}

interface LeaderboardPageProps {
  searchParams:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const params = await searchParams;
  const rawGame = typeof params.game === "string" ? params.game : "monodeal";
  const game = rawGame === "least_count" ? "least_count" : "monodeal";

  const session = await auth();
  const [leaderboardData, profileData] = await Promise.all([
    fetchLeaderboardApi(game),
    session?.user?.id
      ? fetchLeaderboardProfileApi(game, session.user.id)
      : Promise.resolve({ entry: null }),
  ]);

  return (
    <AppShell active="play">
      <div className="shell" style={{ padding: "24px 16px 56px" }}>
        <div
          className="section-header"
          style={{ textAlign: "center", marginBottom: "32px" }}
        >
          <p className="kicker">LEADERBOARD</p>
          <h1 style={{ fontSize: "2rem", fontWeight: 900 }}>Top Players</h1>
          <p style={{ color: "#94a3b8", maxWidth: "600px", margin: "0 auto" }}>
            See who dominates the board in {GAME_LABELS[game] ?? game}.
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
          {["monodeal", "least_count"].map((key) => (
            <a
              key={key}
              href={`/leaderboard?game=${key}`}
              className={`button ${game === key ? "button--primary" : "button--secondary"}`}
            >
              {GAME_LABELS[key] ?? key}
            </a>
          ))}
        </div>

        <LeaderboardTable
          entries={leaderboardData.leaderboard}
          profileEntry={profileData.entry}
        />
      </div>
    </AppShell>
  );
}
