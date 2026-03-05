import { motion } from "framer-motion";
import { TeamGame, CLUSTER_CONFIG } from "@/types/leaderboard";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";

export default function TeamGamesSlide({ teamGame }: { teamGame: TeamGame }) {
  const { getClusterLogoPath } = useLeaderboardData();
  
  // Create ranking from team scores
  const ranking = teamGame.teams
    .map(team => ({
      team,
      score: teamGame.scores[team] || 0
    }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score);

  // Apply top limits: showTop3 > show all
  const displayRanking = teamGame.top3 ? ranking.slice(0, 3) : ranking;

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

  // Get team config - use cluster config for teams that match cluster names
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

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 pb-16 pt-12">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="font-display text-3xl md:text-4xl font-bold tracking-wide text-foreground mb-2"
      >
        {teamGame.name.toUpperCase()}
      </motion.h2>
      
      {/* Team names display */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="text-lg md:text-xl text-muted-foreground mb-6 text-center"
      >
        {formatTeamNames(teamGame.teams)}
      </motion.div>
      
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "12rem" }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="h-px bg-primary/50 mb-8"
      />

      <div className="w-full max-w-3xl space-y-4">
        {displayRanking.map((entry, i) => {
          const config = getTeamConfig(entry.team);
          return (
            <motion.div
              key={entry.team}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              className="flex items-center gap-4"
            >
              <span className={`font-display text-2xl font-black w-10 text-right ${config.color}`}>
                {i + 1}
              </span>
              <div className="flex-1 relative">
                <div className={`relative h-14 flex items-center border-2 rounded-lg ${config.borderColor} ${
                  i === 0 
                    ? `shadow-[0_0_20px_rgba(var(--tw-shadow-color),0.5)]`
                    : ``
                }`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(entry.score / maxScore) * 100}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                    className={`absolute inset-y-0 left-0 ${config.bgColor} [clip-path:inset(0_round_0.5rem)]`}
                  />
                  <div className="relative z-10 flex items-center justify-between w-full px-5">
                    <div className="flex items-center gap-3">
                      {/* Use rounded cluster logo like GameLeaderboard */}
                      <motion.img
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: "easeOut" }}
                        src={getClusterLogoPath(entry.team)}
                        alt={entry.team}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span className={`font-body text-lg font-semibold ${
                        i === 0 ? "text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]" : "text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]"
                      }`}>
                        {entry.team}
                      </span>
                    </div>
                    <span className={`font-display text-xl font-bold ${
                      i === 0 ? "text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]" : "text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]"
                    }`}>
                      {entry.score}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
