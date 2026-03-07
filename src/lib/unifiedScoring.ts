import { Game, ClusterName, ALL_CLUSTERS, OverallScore, GrandFinalsMatch, Champion, UnifiedTeamGame } from "@/types/leaderboard";

/**
 * Calculate unified overall scores including games, team games, and team matches
 * This ensures both Overall Standings slide and Tallied Points use the same scoring logic
 */
export function calculateUnifiedOverallScores(
  games: Game[], 
  clusterTeamMatches: UnifiedTeamGame[],
  teamGames: UnifiedTeamGame[] = []
): OverallScore[] {
  const totals: Record<ClusterName, number> = {} as Record<ClusterName, number>;
  ALL_CLUSTERS.forEach((c) => (totals[c] = 0));

  // Add points from games
  games.forEach((game) => {
    ALL_CLUSTERS.forEach((c) => {
      totals[c] += game.scores[c] ?? 0;
    });
  });

  // Add points from team games - work directly with unified data
  teamGames.forEach((teamGame) => {
    if (!teamGame.isTeamGame) return; // Only process team games
    
    teamGame.teams.forEach((team) => {
      // Add team score directly to all clusters listed for this team
      const teamScore = team.points ?? 0;
      
      team.clusters.forEach((clusterName) => {
        if (ALL_CLUSTERS.includes(clusterName as ClusterName)) {
          totals[clusterName as ClusterName] += teamScore;
        }
      });
    });
  });

  // Add points from team matches (versus games) - using UnifiedTeamGame interface
  clusterTeamMatches.forEach((match) => {
    if (!match.isVersus) return; // Only process versus matches
    
    // Check if match has a winner
    const hasWinner = match.teams.some(team => team.isWinner);
    if (!hasWinner) return; // Only count completed matches
    
    const teamA = match.teams[0];
    const teamB = match.teams[1];
    
    if (teamA && teamB) {
      // Determine winner and loser
      const winnerTeam = teamA.isWinner ? teamA : teamB;
      const loserTeam = teamA.isWinner ? teamB : teamA;
      
      const winningPoints = match.pointsVersus?.winner_points || 10;
      const losingPoints = match.pointsVersus?.loser_points || 5;
      
      // Add winning points to winner team clusters
      winnerTeam.clusters.forEach((clusterName) => {
        if (ALL_CLUSTERS.includes(clusterName as ClusterName)) {
          totals[clusterName as ClusterName] += winningPoints;
        }
      });
      
      // Add losing points to loser team clusters
      loserTeam.clusters.forEach((clusterName) => {
        if (ALL_CLUSTERS.includes(clusterName as ClusterName)) {
          totals[clusterName as ClusterName] += losingPoints;
        }
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
