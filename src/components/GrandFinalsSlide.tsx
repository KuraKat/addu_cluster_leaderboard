import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords } from "lucide-react";
import { CLUSTER_CONFIG, GrandFinalsMatch } from "@/types/leaderboard";
import { useFirestoreData } from "@/hooks/useFirestoreData";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";

interface GrandFinalsSlideProps {
  match: GrandFinalsMatch;
  onComplete: () => void;
  isAdmin?: boolean;
}

export default function GrandFinalsSlide({ match, onComplete, isAdmin = false }: GrandFinalsSlideProps) {
  const { addBet, slideDuration, advancedSlideTiming } = useFirestoreData();
  const { getClusterLogoPath } = useLeaderboardData();
  const [phase, setPhase] = useState<"vs" | "vote">("vs");
  const [progress, setProgress] = useState(0);

  const configA = CLUSTER_CONFIG[match.clusterA];
  const configB = CLUSTER_CONFIG[match.clusterB];
  
  // Use advanced timing for grand finals if enabled, otherwise use basic timing
  const currentSlideDuration = advancedSlideTiming.useAdvanced ? advancedSlideTiming.grandFinals : slideDuration;
  const PHASE_DURATION_MS = currentSlideDuration * 1000;

  useEffect(() => {
    setPhase("vs");
    setProgress(0);
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const totalDuration = currentSlideDuration * 1000 * 2; // Use dynamic slideDuration
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(newProgress);
      
      if (elapsed >= currentSlideDuration * 1000 && phase === "vs") {
        setPhase("vote");
      }
      if (elapsed >= totalDuration) {
        clearInterval(interval);
        onComplete();
      }
    }, 50);
    
    return () => { clearInterval(interval); };
  }, [match.id, onComplete, currentSlideDuration]); // Add currentSlideDuration to dependencies

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 sm:px-6 md:px-8 pb-8 sm:pb-12 md:pb-16">
      <motion.h2
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="font-display text-2xl sm:text-3xl md:text-5xl font-black tracking-widest text-gradient-gold mb-4 sm:mb-6 md:mb-8"
      >
        {match.eventTitle}
      </motion.h2>

      <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-16 w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl">
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col items-center flex-1"
        >
          <div className={`w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full border-2 sm:border-4 ${configA.borderColor} bg-card/60 flex items-center justify-center mb-2 sm:mb-4 overflow-hidden`}>
            <img src={getClusterLogoPath(match.clusterA)} alt={match.clusterA} className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
          <span className={`font-display text-lg sm:text-xl md:text-2xl font-bold ${configA.color}`}>{match.clusterA}</span>
          {match.votingEnabled && (
            <>
              <span className="font-display text-2xl sm:text-3xl font-black text-foreground mt-1 sm:mt-2">{match.betsA}</span>
              <span className="text-xs sm:text-sm text-muted-foreground">votes</span>
            </>
          )}
        </motion.div>

        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }} className="flex flex-col items-center">
          <Swords className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 text-gold" />
          <span className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-foreground mt-1 sm:mt-2">VS</span>
        </motion.div>

        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col items-center flex-1"
        >
          <div className={`w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full border-2 sm:border-4 ${configB.borderColor} bg-card/60 flex items-center justify-center mb-2 sm:mb-4 overflow-hidden`}>
            <img src={getClusterLogoPath(match.clusterB)} alt={match.clusterB} className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
          <span className={`font-display text-lg sm:text-xl md:text-2xl font-bold ${configB.color}`}>{match.clusterB}</span>
          {match.votingEnabled && (
            <>
              <span className="font-display text-2xl sm:text-3xl font-black text-foreground mt-1 sm:mt-2">{match.betsB}</span>
              <span className="text-xs sm:text-sm text-muted-foreground">votes</span>
            </>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {phase === "vote" && match.votingEnabled && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2 sm:gap-4 mt-6 sm:mt-10">
            <div className="flex gap-3 sm:gap-4 md:gap-6">
              <button onClick={() => addBet(match.id, "A")} className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-display font-bold text-sm sm:text-lg border-2 sm:border-4 ${configA.borderColor} ${configA.color} bg-card/60 hover:bg-card transition-colors`}>
                VOTE {match.clusterA.toUpperCase()}
              </button>
              <button onClick={() => addBet(match.id, "B")} className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-display font-bold text-sm sm:text-lg border-2 sm:border-4 ${configB.borderColor} ${configB.color} bg-card/60 hover:bg-card transition-colors`}>
                VOTE {match.clusterB.toUpperCase()}
              </button>
            </div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-display text-lg sm:text-xl font-bold text-gold animate-pulse">
              VOTE NOW!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Progress Bar */}
      <div className="absolute bottom-8 sm:bottom-10 md:bottom-12 left-0 w-full h-1 bg-muted/30">
        <div 
          className="h-full bg-primary transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
