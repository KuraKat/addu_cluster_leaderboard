import { Game, OverallScore, ClusterName, ALL_CLUSTERS } from "@/types/leaderboard";

export function calculateOverallScores(games: Game[]): OverallScore[] {
  const totals: Record<ClusterName, number> = {} as Record<ClusterName, number>;
  ALL_CLUSTERS.forEach((c) => (totals[c] = 0));
  games.forEach((game) => {
    ALL_CLUSTERS.forEach((c) => {
      totals[c] += game.scores[c] ?? 0;
    });
  });
  return ALL_CLUSTERS.map((c) => ({ cluster: c, totalScore: totals[c] }));
}

export function sortScores<T extends { cluster: ClusterName }>(
  items: T[],
  getScore: (item: T) => number
): T[] {
  return [...items].sort((a, b) => {
    const diff = getScore(b) - getScore(a);
    if (diff !== 0) return diff;
    return a.cluster.localeCompare(b.cluster);
  });
}

export function getGameRanking(game: Game) {
  return sortScores(
    ALL_CLUSTERS.map((c) => ({ cluster: c, score: game.scores[c] })),
    (item) => item.score
  );
}
