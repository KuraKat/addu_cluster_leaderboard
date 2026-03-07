import { Game, ClusterName, ALL_CLUSTERS, OverallScore, GrandFinalsMatch, Champion, UnifiedTeamGame } from "@/types/leaderboard";

export function calculateOverallScores(games: Game[], clusterTeamMatches: UnifiedTeamGame[]): OverallScore[] {
  const totals: Record<ClusterName, number> = {} as Record<ClusterName, number>;
  ALL_CLUSTERS.forEach((c) => (totals[c] = 0));
  
  // Add points from games
  games.forEach((game) => {
    ALL_CLUSTERS.forEach((c) => {
      totals[c] += game.scores[c] ?? 0;
    });
  });
  
  // Add points from team matches (both winning and losing points)
  clusterTeamMatches.forEach((match) => {
    // Only process versus matches that have a winner
    if (!match.isVersus) return;
    
    const winnerTeam = match.teams.find(t => t.isWinner);
    const loserTeam = match.teams.find(t => !t.isWinner);
    
    if (winnerTeam && loserTeam && match.pointsVersus) {
      // Add winning points to winner team clusters
      winnerTeam.clusters.forEach((cluster) => {
        totals[cluster as ClusterName] += match.pointsVersus.winner_points;
      });
      
      // Add losing points to loser team clusters
      loserTeam.clusters.forEach((cluster) => {
        totals[cluster as ClusterName] += match.pointsVersus.loser_points;
      });
    }
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
