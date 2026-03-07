import { motion } from "framer-motion";
import { UnifiedTeamGame, CLUSTER_CONFIG, ClusterName } from "@/types/leaderboard";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";

export default function TeamGamesSlide({ teamGame }: { teamGame: UnifiedTeamGame }) {
  const { getClusterLogoPath } = useLeaderboardData();
  
  // Create ranking from team scores
  const ranking = teamGame.teams
    .map(team => ({
      team,
      score: team.points || 0
    }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score);

  // Apply top limits: show all (UnifiedTeamGame doesn't have top3 property)
  const displayRanking = ranking;

  if (ranking.length === 0) return null;
  const maxScore = ranking[0]?.score || 1;

  // Format team names display
  const formatTeamNames = (teams: string[]) => {
    if (teams.length === 1) {
      return teams[0];
    } else if (teams.length === 2) {
      return `${teams[0]} & ${teams[1]}`;
    } else {
      const allButLast = teams.slice(0, -1).join(', ');
      const last = teams[teams.length - 1];
      return `${allButLast}, & ${last}`;
    }
  };

  // Get mixed color for bar based on team clusters
  const getMixedBarColor = (clusters: ClusterName[]) => {
    if (clusters.length === 0) return "bg-blue-500";
    if (clusters.length === 1) {
      const config = CLUSTER_CONFIG[clusters[0]];
      return config?.bgColor || "bg-blue-500";
    }
    
    // For multiple clusters, create a gradient representation
    return "bg-gradient-to-r";
  };

  // Get gradient classes for multiple clusters
  const getGradientClasses = (clusters: ClusterName[]) => {
    if (clusters.length <= 1) return "";
    
    const colors = clusters.map(cluster => {
      const config = CLUSTER_CONFIG[cluster];
      return config?.bgColor?.replace('bg-', '') || 'blue-500';
    });
    
    return colors.join(' ');
  };

  // Get mixed border color for bar
  const getMixedBorderColor = (clusters: ClusterName[]) => {
    if (clusters.length === 0) return "border-blue-500";
    if (clusters.length === 1) {
      const config = CLUSTER_CONFIG[clusters[0]];
      return config?.borderColor || "border-blue-500";
    }
    
    // For multiple clusters, create gradient border using first cluster color
    const firstConfig = CLUSTER_CONFIG[clusters[0]];
    return firstConfig?.borderColor || "border-blue-500";
  };

  // Get rank color based on position
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-yellow-400"; // Gold
      case 2:
        return "text-gray-300"; // Silver
      case 3:
        return "text-orange-600"; // Bronze
      default:
        return "text-blue-500"; // Default blue for 4th+
    }
  };

  // Get team config - use clusters from team data
  const getTeamConfig = (teamName: string) => {
    // Try to find a matching cluster if team name matches a cluster
    const clusterMatch = Object.keys(CLUSTER_CONFIG).find(cluster => 
      teamName.toLowerCase().includes(cluster.toLowerCase())
    );
    
    if (clusterMatch) {
      return CLUSTER_CONFIG[clusterMatch as keyof typeof CLUSTER_CONFIG];
    }
    
    // Default config for teams that don't match clusters
    return { 
      color: "text-blue-500", 
      bgColor: "bg-blue-500", 
      borderColor: "border-blue-500", 
      logo: "/assets/cluster_logos/default.jpg" 
    };
  };

  // Get all clusters for a team (use team data directly)
  const getClustersForTeam = (teamName: string): ClusterName[] => {
    // Find the team in the teams array
    const team = teamGame.teams.find(t => t.name === teamName);
    if (team) {
      // Return the clusters directly from team data
      return team.clusters as ClusterName[];
    }
    
    // If no team found, check if team name is a valid cluster name
    if (Object.keys(CLUSTER_CONFIG).includes(teamName)) {
      return [teamName as ClusterName];
    }
    
    return [];
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 pb-16 pt-12">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="font-display text-3xl md:text-4xl font-bold tracking-wide text-foreground mb-2"
      >
        {teamGame.title.toUpperCase()}
      </motion.h2>
      
      
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "12rem" }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="h-px bg-primary/50 mb-8"
      />

      <div className="w-full max-w-3xl space-y-4">
        {displayRanking.map((entry, i) => {
          const teamClusters = getClustersForTeam(entry.team.name);
          const barColor = getMixedBarColor(teamClusters);
          const borderColor = "border-white"; // Always white border
          const rankColor = getRankColor(i + 1);
          
          return (
            <motion.div
              key={entry.team.name}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              className="flex items-center gap-4"
            >
              <span className={`font-display text-2xl font-black w-10 text-right ${rankColor}`}>
                {i + 1}
              </span>
              <div className="flex-1 relative">
                <div className={`relative h-24 flex flex-col items-start justify-start border-2 rounded-lg ${borderColor} ${
                  i === 0 
                    ? `shadow-[0_0_20px_rgba(255,255,255,0.3)]`
                    : ``
                }`}>
                  {/* Team Name at Top - Left aligned */}
                  <div className="w-full py-2 text-left border-b border-white/20 px-5">
                    <motion.span
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                      className="font-display text-xl font-bold text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]"
                    >
                      {entry.team.name}
                    </motion.span>
                  </div>
                  
                  {/* Full Width Color Bar with Cluster Sections */}
                  <div className="relative w-full h-full flex-1">
                    {teamClusters.length === 1 ? (
                      // Single cluster - solid color, full width
                      <div
                        className={`absolute bottom-0 left-0 h-full w-full ${barColor} [clip-path:inset(0_round_0.5rem)]`}
                      />
                    ) : (
                      // Multiple clusters - side-by-side sections, full width
                      <div className="absolute bottom-0 left-0 h-full w-full flex [clip-path:inset(0_round_0.5rem)]">
                        {teamClusters.map((cluster, clusterIdx) => {
                          const config = CLUSTER_CONFIG[cluster];
                          const clusterWidth = 100 / teamClusters.length; // Equal width for each cluster
                          return (
                            <div key={cluster} className="relative h-full flex items-center justify-center" style={{ width: `${clusterWidth}%` }}>
                              <div
                                className={`absolute inset-0 h-full ${config?.bgColor || 'bg-blue-500'}`}
                              />
                              
                              {/* Cluster Logo and Name - Inside colored section */}
                              <div className="relative z-10 flex items-center gap-2">
                                <motion.img
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                                  src={getClusterLogoPath(cluster)}
                                  alt={cluster}
                                  className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                                <motion.span
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                                  className={`font-display text-xs md:text-sm font-bold ${config?.color || 'text-blue-500'}`}
                                >
                                  {cluster}
                                </motion.span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Single cluster - logo and name inside colored section */}
                    {teamClusters.length === 1 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {teamClusters.map((cluster) => {
                          const config = CLUSTER_CONFIG[cluster];
                          return (
                            <div key={cluster} className="flex items-center gap-3">
                              <motion.img
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: "easeOut" }}
                                src={getClusterLogoPath(cluster)}
                                alt={cluster}
                                className="w-10 h-10 rounded-full object-cover border border-white/50"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                              <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + i * 0.08, duration: 0.5, ease: "easeOut" }}
                                className="font-body text-lg font-bold text-white drop-shadow-[0_0_6px_rgba(0,0,0,0.8)]"
                              >
                                {cluster}
                              </motion.span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Score Display - White text with "pts" inline */}
                <div className="absolute top-2 right-4 text-right">
                  <motion.span 
                    className="font-display text-2xl font-black text-white drop-shadow-[0_0_6px_rgba(0,0,0,0.8)]"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                  >
                    {entry.score} pts
                  </motion.span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
