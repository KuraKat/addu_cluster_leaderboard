import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { CLUSTER_CONFIG, ALL_CLUSTERS, ClusterName } from "@/types/leaderboard";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";

export default function ChampionsSlide() {
  const { slideData, getClusterLogoPath } = useLeaderboardData();

  // Calculate champions from games (highest scoring cluster per game)
  const champions = slideData.games.map(game => {
    // Find all clusters with the highest score for this game
    const maxScore = Math.max(...ALL_CLUSTERS.map(cluster => game.scores[cluster] || 0));
    const topClusters = ALL_CLUSTERS.filter(cluster => (game.scores[cluster] || 0) === maxScore);

    return {
      id: game.id,
      gameId: game.id,
      gameName: game.name,
      clusters: topClusters, // Store all tied clusters
      score: maxScore,
      timestamp: Date.now() // Use current time for sorting
    };
  })
  .sort((a, b) => b.score - a.score); // Sort by highest score

  const sorted = [...champions];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 pb-16 pt-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-4 mb-8"
      >
        <Crown className="w-8 h-8 text-gold" />
        <h2 className="font-display text-3xl md:text-4xl font-bold tracking-wide text-gradient-gold">
          HALL OF CHAMPIONS
        </h2>
        <Crown className="w-8 h-8 text-gold" />
      </motion.div>

      {sorted.length === 0 ? (
        <p className="text-muted-foreground font-body text-lg">No champions recorded yet</p>
      ) : (
        <div className="w-full max-w-3xl space-y-3 overflow-y-auto max-h-[60vh]">
          {sorted.map((champ, i) => {
            // Display each tied cluster with its own color and styling
            return (
              <motion.div
                key={champ.gameId}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                className="glass-surface rounded-lg px-6 py-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {champ.clusters.map((cluster, clusterIndex) => {
                      const config = CLUSTER_CONFIG[cluster];
                      return (
                        <div key={cluster} className="flex items-center gap-2">
                          <img
                            src={getClusterLogoPath(cluster)}
                            alt={cluster}
                            className="w-10 h-10 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                          <div>
                            <span className={`font-display text-sm text-white tracking-wider`}>
                              {champ.gameName}
                            </span>
                            <p className={`font-display text-lg font-bold ${config.color}`}>
                              {cluster}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-right">
                    <span className="font-display text-2xl font-black text-foreground">{champ.score}</span>
                    <p className="text-xs text-muted-foreground">pts</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
