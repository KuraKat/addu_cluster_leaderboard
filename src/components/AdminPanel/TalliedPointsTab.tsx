import { TrendingUp } from "lucide-react";
import { ALL_CLUSTERS, ClusterName } from "@/types/leaderboard";
import { calculateUnifiedOverallScores } from "@/lib/unifiedScoring";

interface TalliedPointsTabProps {
  games: any;
  teamGames: any;
  grandFinals: any;
  clusterTeams: any;
  getClusterLogoPath: (cluster: string) => string;
}

export default function TalliedPointsTab({
  games,
  teamGames,
  grandFinals,
  clusterTeams,
  getClusterLogoPath
}: TalliedPointsTabProps) {
  return (
    <div className="space-y-6">
      <div className="glass-surface rounded-lg p-4 space-y-3">
        <h3 className="font-body text-sm font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Detailed Points Breakdown
        </h3>
        
        <div className="space-y-6">
          {ALL_CLUSTERS.map((cluster) => {
            // Calculate unified scores using same function as Overall Standings
            const unifiedScores = calculateUnifiedOverallScores(games.all, teamGames.all, teamGames.all);
            const clusterTotalScore = unifiedScores.find((score: any) => score.cluster === cluster)?.totalScore || 0;
            
            // Get detailed game information (include archived games)
            const gameDetails = games.all
              .filter((game: any) => game.scores[cluster] > 0)
              .map((game: any) => ({
                name: game.name,
                points: game.scores[cluster],
                showTop5: game.showTop5 || false,
                showTop3: game.showTop3 || false
              }));

            // Get detailed team game information (include archived team games)
            const teamGameDetails = teamGames.all
              .filter((teamGame: any) => {
                // Check if any team in this team game contains the current cluster
                return teamGame.teams.some((team: any) => {
                  return team.clusters.includes(cluster);
                });
              })
              .map((teamGame: any) => {
                // Find which teams contain this cluster and sum their points
                let totalPoints = 0;
                const participatingTeams = [];
                
                teamGame.teams.forEach((team: any) => {
                  if (team.clusters.includes(cluster)) {
                    totalPoints += team.points || 0;
                    participatingTeams.push(team.name);
                  }
                });
                
                return {
                  name: `${teamGame.title} ${participatingTeams.join(' & ')}`,
                  points: totalPoints,
                  showTop5: teamGame.showTop5 || false,
                  showTop3: teamGame.showTop3 || false
                };
              })
              .filter((detail: any) => detail.points > 0);

            // Get detailed grand finals information (include archived finals)
            const grandFinalsDetails = grandFinals.all
              .filter((final: any) => {
                return (final.clusterA === cluster && final.betsA > 0) || 
                       (final.clusterB === cluster && final.betsB > 0);
              })
              .map((final: any) => {
                const isClusterA = final.clusterA === cluster;
                return {
                  name: final.eventTitle,
                  points: isClusterA ? final.betsA : final.betsB,
                  side: isClusterA ? 'A' : 'B'
                };
              });

            // Get detailed team match information (include archived matches)
            const teamMatchDetails = teamGames.all
              .filter((match: any) => {
                // Only include versus matches that have a winner
                if (!match.isVersus) return false;
                const hasWinner = match.teams.some((team: any) => team.isWinner);
                if (!hasWinner) return false;
                
                // Check if current cluster is in either team
                return match.teams.some((team: any) => {
                  return team.clusters.includes(cluster);
                });
              })
              .map((match: any) => {
                const winnerTeam = match.teams.find((team: any) => team.isWinner);
                const loserTeam = match.teams.find((team: any) => !team.isWinner);
                
                // Find which team contains the current cluster
                const teamWithCluster = match.teams.find((team: any) => {
                  return team.clusters.includes(cluster);
                });
                
                // Calculate points based on whether this cluster's team won or lost
                const winningPoints = match.pointsVersus?.winner_points || 10;
                const losingPoints = match.pointsVersus?.loser_points || 5;
                const isWinner = teamWithCluster?.isWinner || false;
                const points = isWinner ? winningPoints : losingPoints;
                
                return {
                  name: `${match.title}: ${winnerTeam?.name || 'Unknown'} vs ${loserTeam?.name || 'Unknown'}`,
                  points: points,
                  result: isWinner ? 'Win' : 'Loss',
                  winnerTeam: winnerTeam?.name || 'Unknown',
                  loserTeam: loserTeam?.name || 'Unknown'
                };
              });

            // Use unified total instead of calculating separately
            const totalPoints = clusterTotalScore;

            const config = {
              Salamanca: { color: 'text-green-400', borderColor: 'border-green-400', bgColor: 'bg-green-400/20' },
              Barcelona: { color: 'text-blue-400', borderColor: 'border-blue-400', bgColor: 'bg-blue-400/20' },
              Madrid: { color: 'text-red-400', borderColor: 'border-red-400', bgColor: 'bg-red-400/20' },
              Valencia: { color: 'text-orange-400', borderColor: 'border-orange-400', bgColor: 'bg-orange-400/20' },
              Sevilla: { color: 'text-purple-400', borderColor: 'border-purple-400', bgColor: 'bg-purple-400/20' },
              Bilbao: { color: 'text-pink-400', borderColor: 'border-pink-400', bgColor: 'bg-pink-400/20' }
            }[cluster] || { color: 'text-gray-400', borderColor: 'border-gray-400', bgColor: 'bg-gray-400/20' };

            return (
              <div key={cluster} className="glass-surface rounded-lg p-6 space-y-4">
                {/* Cluster Header with Logo */}
                <div className="flex items-center gap-4 pb-4 border-b border-border">
                  <div className={`w-12 h-12 rounded-full border-2 ${config.borderColor} ${config.bgColor} flex items-center justify-center overflow-hidden`}>
                    <img 
                      src={getClusterLogoPath(cluster)}
                      alt={cluster}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <h4 className={`font-bold text-xl ${config.color}`}>{cluster}</h4>
                    <div className="text-sm text-muted-foreground">Total Points: <span className="font-bold text-lg text-primary">{totalPoints}</span></div>
                  </div>
                </div>

                {/* Games Section */}
                {gameDetails.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-semibold text-sm text-blue-400 mb-2">Games ({gameDetails.length})</h5>
                    {gameDetails.map((game: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-1 px-2 bg-blue-400/10 rounded">
                        <span className="text-sm text-foreground">{game.name}</span>
                        <span className="font-medium text-blue-400">+{game.points}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Team Games Section */}
                {(teamGameDetails.length > 0 || teamMatchDetails.length > 0) && (
                  <div className="space-y-2">
                    <h5 className="font-semibold text-sm text-cyan-400 mb-2">
                      Team Games ({teamGameDetails.length + teamMatchDetails.length})
                    </h5>
                    {/* Team Games */}
                    {teamGameDetails.map((teamGame: any, idx: number) => (
                      <div key={`team-game-${idx}`} className="flex justify-between items-center py-1 px-2 bg-cyan-400/10 rounded">
                        <span className="text-sm text-foreground">{teamGame.name}</span>
                        <span className="font-medium text-cyan-400">+{teamGame.points}</span>
                      </div>
                    ))}
                    {/* Team Matches */}
                    {teamMatchDetails.map((team: any, idx: number) => (
                      <div key={`team-match-${idx}`} className="flex justify-between items-center py-1 px-2 bg-purple-400/10 rounded">
                        <span className="text-sm text-foreground">{team.name}</span>
                        <span className="font-medium text-purple-400">+{team.points}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Grand Finals Section */}
                {grandFinalsDetails.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-semibold text-sm text-green-400 mb-2">Grand Finals ({grandFinalsDetails.length})</h5>
                    {grandFinalsDetails.map((final: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-1 px-2 bg-green-400/10 rounded">
                        <span className="text-sm text-foreground">{final.name} (Side {final.side})</span>
                        <span className="font-medium text-green-400">+{final.points}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {gameDetails.length === 0 && teamGameDetails.length === 0 && grandFinalsDetails.length === 0 && teamMatchDetails.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No points recorded for this cluster yet
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
