import { motion } from "framer-motion";
import { Game, CLUSTER_CONFIG } from "@/types/leaderboard";
import { getGameRanking } from "@/lib/scoring";

export default function GameLeaderboard({ game }: { game: Game }) {
  // Filter out clusters with 0 or undefined scores, then take top 5
  const ranking = getGameRanking(game)
    .filter((e) => e.score > 0)
    .slice(0, 5);

  if (ranking.length === 0) return null;
  const maxScore = ranking[0]?.score || 1;

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 pb-16 pt-12">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="font-display text-3xl md:text-4xl font-bold tracking-wide text-foreground mb-2"
      >
        {game.name.toUpperCase()}
      </motion.h2>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "12rem" }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="h-0.5 bg-primary/50 mb-10"
      />

      <div className="w-full max-w-3xl space-y-4">
        {ranking.map((entry, i) => {
          const config = CLUSTER_CONFIG[entry.cluster];
          return (
            <motion.div
              key={entry.cluster}
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
                    className={`absolute inset-y-0 left-0 rounded-lg ${config.bgColor}`}
                  />
                  <div className="relative z-10 flex items-center justify-between w-full px-5">
                    <div className="flex items-center gap-3">
                      <img
                        src={config.logo}
                        alt={entry.cluster}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span className={`font-body text-lg font-semibold ${
                        i === 0 ? "text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]" : "text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]"
                      }`}>
                        {entry.cluster}
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
