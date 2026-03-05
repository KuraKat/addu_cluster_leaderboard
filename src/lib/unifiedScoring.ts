import { Game, OverallScore, ClusterName, ALL_CLUSTERS } from "@/types/leaderboard";
import { ClusterTeam, ClusterTeamMatch, TeamGame } from "@/types/leaderboard";

/**
 * Calculate unified overall scores including games, team games, and team matches
 * This ensures both Overall Standings slide and Tallied Points use the same scoring logic
 */
export function calculateUnifiedOverallScores(
  games: Game[], 
  clusterTeams: ClusterTeam[], 
  clusterTeamMatches: ClusterTeamMatch[],
  teamGames: TeamGame[] = []
): OverallScore[] {
  const totals: Record<ClusterName, number> = {} as Record<ClusterName, number>;
  ALL_CLUSTERS.forEach((c) => (totals[c] = 0));

  // Add points from games
  games.forEach((game) => {
    ALL_CLUSTERS.forEach((c) => {
      totals[c] += game.scores[c] ?? 0;
    });
  });

  // Add points from team games
  teamGames.forEach((teamGame) => {
    teamGame.teams.forEach((teamName) => {
      // Find the cluster team that matches this team name
      const clusterTeam = clusterTeams.find(ct => ct.name === teamName);
      if (clusterTeam) {
        // Add team score to all clusters in this team
        const teamScore = teamGame.scores[teamName] ?? 0;
        clusterTeam.clusters.forEach((cluster) => {
          totals[cluster] += teamScore;
        });
      }
    });
  });

  // Add points from team matches (both winning and losing points)
  clusterTeamMatches.forEach((match) => {
    if (!match.winner) return; // Only count completed matches
    
    const teamA = clusterTeams.find(t => t.id === match.teamA);
    const teamB = clusterTeams.find(t => t.id === match.teamB);
    
    if (teamA && teamB) {
      // Add winning points to winner team clusters
      const winnerTeam = match.winner === 'A' ? teamA : teamB;
      const loserTeam = match.winner === 'A' ? teamB : teamA;
      
      winnerTeam.clusters.forEach((cluster) => {
        totals[cluster] += match.winningPoints;
      });
      
      // Add losing points to loser team clusters
      loserTeam.clusters.forEach((cluster) => {
        totals[cluster] += match.losingPoints;
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
