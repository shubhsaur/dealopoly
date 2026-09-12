export interface MonodealLeaderboardStats {
  wins: number;
  gamesPlayed: number;
  avgFinish: number;
  completedSets: number;
}

export interface LowdeckLeaderboardStats {
  wins: number;
  gamesPlayed: number;
  avgFinish: number;
}

const AVG_FINISH_TABLE = [
  { avg: 1.0, bonus: 100 },
  { avg: 1.5, bonus: 75 },
  { avg: 2.0, bonus: 50 },
  { avg: 2.5, bonus: 25 },
  { avg: 3.0, bonus: 10 },
  { avg: 3.5, bonus: 0 },
  { avg: 4.0, bonus: -25 },
];

export function interpolateAvgFinishBonus(avgFinish: number): number {
  const sorted = [...AVG_FINISH_TABLE].sort((a, b) => a.avg - b.avg);

  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;

  if (avgFinish <= first.avg) return first.bonus;
  if (avgFinish >= last.avg) return last.bonus;

  for (let i = 0; i < sorted.length - 1; i++) {
    const lower = sorted[i]!;
    const upper = sorted[i + 1]!;
    if (avgFinish >= lower.avg && avgFinish <= upper.avg) {
      const t = (avgFinish - lower.avg) / (upper.avg - lower.avg);
      return lower.bonus + t * (upper.bonus - lower.bonus);
    }
  }

  return 0;
}

export function calculateMonodealScore(stats: MonodealLeaderboardStats): number {
  const { wins, gamesPlayed, avgFinish, completedSets } = stats;

  if (gamesPlayed <= 0) {
    return 0;
  }

  const winRate = wins / gamesPlayed;
  const avgFinishBonus = interpolateAvgFinishBonus(avgFinish);

  const score =
    wins * 100 +
    winRate * 200 +
    avgFinishBonus * 20 +
    Math.sqrt(gamesPlayed) * 20 +
    completedSets * 5;

  return Math.round(score);
}

export function calculateLowdeckScore(stats: LowdeckLeaderboardStats): number {
  const { wins, gamesPlayed, avgFinish } = stats;

  if (gamesPlayed <= 0) {
    return 0;
  }

  const winRate = wins / gamesPlayed;
  const avgFinishBonus = interpolateAvgFinishBonus(avgFinish);

  const score =
    wins * 100 + winRate * 200 + avgFinishBonus * 20 + Math.sqrt(gamesPlayed) * 20;

  return Math.round(score);
}
