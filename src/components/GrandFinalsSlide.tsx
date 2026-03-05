import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords } from "lucide-react";
import { CLUSTER_CONFIG, GrandFinalsMatch } from "@/types/leaderboard";
import { useScoreStore } from "@/hooks/useScoreData";

const PHASE_DURATION_MS = 7000;

interface Props {
  match: GrandFinalsMatch;
  onComplete: () => void;
}

export default function GrandFinalsSlide({ match, onComplete }: Props) {
  const { addBet } = useScoreStore();
  const [phase, setPhase] = useState<"vs" | "vote">("vs");

  const configA = CLUSTER_CONFIG[match.clusterA];
  const configB = CLUSTER_CONFIG[match.clusterB];

  useEffect(() => {
    setPhase("vs");
    const t1 = setTimeout(() => setPhase("vote"), PHASE_DURATION_MS);
    const t2 = setTimeout(() => onComplete(), PHASE_DURATION_MS * 2);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [match.id, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 pb-16">
      <motion.h2
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="font-display text-3xl md:text-5xl font-black tracking-widest text-gradient-gold mb-8"
      >
        {match.eventTitle}
      </motion.h2>

      <div className="flex items-center justify-center gap-8 md:gap-16 w-full max-w-4xl">
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col items-center flex-1"
        >
          <div className={`w-36 h-36 md:w-48 md:h-48 rounded-full border-4 ${configA.borderColor} bg-card/60 flex items-center justify-center mb-4 overflow-hidden`}>
            <img src={`/assets/cluster_logos/${match.clusterA.toLowerCase()}.jpg`} alt={match.clusterA} className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
          <span className={`font-display text-xl md:text-2xl font-bold ${configA.color}`}>{match.clusterA}</span>
          <span className="font-display text-3xl font-black text-foreground mt-2">{match.betsA}</span>
          <span className="text-xs text-muted-foreground">votes</span>
        </motion.div>

        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }} className="flex flex-col items-center">
          <Swords className="w-12 h-12 md:w-16 md:h-16 text-gold" />
          <span className="font-display text-2xl md:text-4xl font-black text-foreground mt-2">VS</span>
        </motion.div>

        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col items-center flex-1"
        >
          <div className={`w-36 h-36 md:w-48 md:h-48 rounded-full border-4 ${configB.borderColor} bg-card/60 flex items-center justify-center mb-4 overflow-hidden`}>
            <img src={`/assets/cluster_logos/${match.clusterB.toLowerCase()}.jpg`} alt={match.clusterB} className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
          <span className={`font-display text-xl md:text-2xl font-bold ${configB.color}`}>{match.clusterB}</span>
          <span className="font-display text-3xl font-black text-foreground mt-2">{match.betsB}</span>
          <span className="text-xs text-muted-foreground">votes</span>
        </motion.div>
      </div>

      <AnimatePresence>
        {phase === "vote" && match.votingEnabled && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 mt-10">
            <div className="flex gap-6">
              <button onClick={() => addBet(match.id, "A")} className={`px-8 py-3 rounded-lg font-display font-bold text-lg border-2 ${configA.borderColor} ${configA.color} bg-card/60 hover:bg-card transition-colors`}>
                VOTE {match.clusterA.toUpperCase()}
              </button>
              <button onClick={() => addBet(match.id, "B")} className={`px-8 py-3 rounded-lg font-display font-bold text-lg border-2 ${configB.borderColor} ${configB.color} bg-card/60 hover:bg-card transition-colors`}>
                VOTE {match.clusterB.toUpperCase()}
              </button>
            </div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-display text-xl font-bold text-gold animate-pulse">
              VOTE NOW!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
