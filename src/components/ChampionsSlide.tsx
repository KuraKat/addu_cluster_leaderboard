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
            return (
              <motion.div
                key={champ.gameId}
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.5, ease: "easeOut" }}
                className="glass-surface rounded-lg px-6 py-4 flex flex-col items-start justify-center relative"
              >
                <h3 className="font-display text-xl md:text-2xl font-bold text-white tracking-wider mb-4 text-left">
                  {champ.gameName}
                </h3>
                <div className="flex flex-wrap justify-start items-center gap-6">
                  {champ.clusters.map((cluster) => {
                    const config = CLUSTER_CONFIG[cluster];
                    return (
                      <div key={cluster} className="flex items-center gap-3">
                        <motion.img
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: "easeOut" }}
                          src={getClusterLogoPath(cluster)}
                          alt={cluster}
                          className="w-12 h-12 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.08, duration: 0.5, ease: "easeOut" }}
                          className={`font-display text-lg font-bold ${config.color}`}
                        >
                          {cluster}
                        </motion.span>
                      </div>
                    );
                  })}
                </div>
                <div className="absolute top-4 right-4 text-right">
                  <span className="font-display text-3xl font-black text-foreground">{champ.score}</span>
                  <p className="text-xs text-muted-foreground">pts</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
