import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { Game, CLUSTER_CONFIG } from "@/types/leaderboard";
import { getGameRanking } from "@/lib/scoring";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import { calculateUnifiedOverallScores, sortScores } from "@/lib/unifiedScoring";
import { useFirestoreData } from "@/hooks/useFirestoreData";
import { useState, useEffect, useRef } from "react";

const MEDAL_STYLES = [
  { label: "1ST", colorClass: "text-gold", borderClass: "border-gold/60", glowClass: "glow-gold", size: "text-5xl" },
  { label: "2ND", colorClass: "text-silver", borderClass: "border-silver/60", glowClass: "glow-silver", size: "text-4xl" },
  { label: "3RD", colorClass: "text-bronze", borderClass: "border-bronze/60", glowClass: "glow-bronze", size: "text-3xl" },
];

// Display order: 2nd (left), 1st (center), 3rd (right)
const PODIUM_ORDER = [1, 0, 2];
// Heights indexed by RANK: 1st=tallest, 2nd=medium, 3rd=shortest
const PODIUM_HEIGHTS = ["h-64", "h-48", "h-40"];

export default function OverallLeaderboard() {
  const { slideData, getClusterLogoPath, adminData } = useLeaderboardData();
  
  // Use all games (including archived) for scoring to match AdminPanel tallied points
  const overall = sortScores(calculateUnifiedOverallScores(adminData.games.all, adminData.clusterTeams, adminData.clusterTeamMatches.all, adminData.teamGames.all), (i) => i.totalScore);
  const top3 = overall.slice(0, 3);

  // Track previous scores for animations
  const [previousScores, setPreviousScores] = useState<Record<string, number>>({});
  const [animatingScores, setAnimatingScores] = useState<Set<string>>(new Set());
  const previousScoresRef = useRef(previousScores);

  useEffect(() => {
    const currentScores: Record<string, number> = {};
    overall.forEach(entry => {
      currentScores[entry.cluster] = entry.totalScore;
    });

    // Check for score changes
    const changedClusters = new Set<string>();
    Object.keys(currentScores).forEach(cluster => {
      if (previousScoresRef.current[cluster] !== currentScores[cluster]) {
        changedClusters.add(cluster);
      }
    });

    // Trigger animations for changed scores
    if (changedClusters.size > 0) {
      setAnimatingScores(changedClusters);
      setTimeout(() => {
        setAnimatingScores(new Set());
      }, 1000); // Animation duration
    }

    setPreviousScores(currentScores);
    previousScoresRef.current = currentScores;
  }, [overall]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 pb-16 pt-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-4 mb-6"
      >
        <img 
          src="/assets/logos/AdDU Logo.png" 
          alt="AdDU Logo" 
          className="h-16 w-auto object-contain"
        />
        <img 
          src="/assets/logos/SHS Logo.png" 
          alt="SHS Logo" 
          className="h-16 w-auto object-contain"
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex items-center gap-4 mb-10"
      >
        <Trophy className="w-10 h-10 text-gold" />
        <h2 className="font-display text-4xl md:text-5xl font-bold tracking-wide text-gradient-gold">
          OVERALL STANDINGS
        </h2>
        <Trophy className="w-10 h-10 text-gold" />
      </motion.div>

      <div className="flex items-end justify-center gap-6 md:gap-10 w-full max-w-5xl">
        {PODIUM_ORDER.map((rankIdx) => {
          const entry = top3[rankIdx];
          if (!entry) return null;
          const style = MEDAL_STYLES[rankIdx];
          const podiumH = PODIUM_HEIGHTS[rankIdx];
          const config = CLUSTER_CONFIG[entry.cluster];
          const isAnimating = animatingScores.has(entry.cluster);

          return (
            <motion.div
              key={entry.cluster}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + rankIdx * 0.2, duration: 0.7 }}
              className="flex flex-col items-center flex-1 max-w-xs"
            >
              {/* Logo */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + rankIdx * 0.2, duration: 0.5, type: "spring" }}
                className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-2 ${style.borderClass} ${style.glowClass} bg-card/80 flex items-center justify-center mb-3 overflow-hidden`}
              >
                <img
                  src={getClusterLogoPath(entry.cluster)}
                  alt={entry.cluster}
                  className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </motion.div>

              {/* Rank label */}
              <span className={`font-display font-black ${style.size} ${style.colorClass} mb-2`}>
                {style.label}
              </span>

              {/* Podium card */}
              <div
                className={`w-full rounded-t-xl border ${style.borderClass} ${style.glowClass} bg-card/70 backdrop-blur-sm ${podiumH} flex flex-col items-center justify-center p-4`}
              >
                <span className={`font-display text-lg md:text-2xl font-bold ${style.colorClass} text-center`}>
                  {entry.cluster}
                </span>
                <motion.span 
                  className="font-display text-3xl md:text-4xl font-black text-foreground mt-2"
                  animate={isAnimating ? {
                    scale: [1, 1.2, 1],
                    color: ["#fff", "#fbbf24", "#fff"]
                  } : {}}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  {entry.totalScore}
                </motion.span>
                <span className="text-sm text-muted-foreground mt-1">points</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
