import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { CLUSTER_CONFIG, Champion } from "@/types/leaderboard";
import { useScoreStore } from "@/hooks/useScoreData";

export default function ChampionsSlide() {
  const { champions } = useScoreStore();

  const sorted = [...champions].sort((a, b) => b.timestamp - a.timestamp);

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
            const config = CLUSTER_CONFIG[champ.cluster];
            return (
              <motion.div
                key={champ.gameId}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                className={`glass-surface rounded-lg px-6 py-4 flex items-center justify-between border-l-4 ${config.borderColor}`}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={config.logo}
                    alt={champ.cluster}
                    className="w-10 h-10 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div>
                    <span className="font-display text-sm text-white tracking-wider">
                      {champ.gameName}
                    </span>
                    <p className={`font-display text-lg font-bold ${config.color}`}>
                      {champ.cluster}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-display text-2xl font-black text-foreground">{champ.score}</span>
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
