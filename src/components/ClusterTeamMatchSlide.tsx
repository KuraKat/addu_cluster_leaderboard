import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClusterTeamMatch, ClusterTeam } from '@/types/leaderboard';
import { CLUSTER_CONFIG, ALL_CLUSTERS } from '@/types/leaderboard';
import { Trophy, Users, Swords } from 'lucide-react';
import { useLeaderboardData } from '@/hooks/useLeaderboardData';

interface ClusterTeamMatchSlideProps {
  match: ClusterTeamMatch;
  teamA: ClusterTeam;
  teamB: ClusterTeam;
  onComplete?: () => void;
  isAdmin?: boolean;
  onSetWinner?: (matchId: string, winner: "A" | "B") => void;
  onUndoWinner?: (matchId: string) => void;
}

export default function ClusterTeamMatchSlide({ 
  match, 
  teamA, 
  teamB, 
  onComplete, 
  isAdmin = false,
  onSetWinner,
  onUndoWinner 
}: ClusterTeamMatchSlideProps) {
  const { getClusterLogoPath } = useLeaderboardData();
  const [showWinner, setShowWinner] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (match.winner) {
      const timer = setTimeout(() => {
        setShowWinner(true);
        setIsAnimating(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowWinner(false);
      setIsAnimating(false);
    }
  }, [match.winner]);

  const handleSetWinner = (winner: "A" | "B") => {
    if (onSetWinner) {
      onSetWinner(match.id, winner);
    }
  };

  const handleUndoWinner = () => {
    if (onUndoWinner) {
      onUndoWinner(match.id);
    }
  };

  const getTeamClustersDisplay = (clusters: string[]) => {
    return clusters.map(cluster => {
      const config = CLUSTER_CONFIG[cluster];
      return (
        <div key={cluster} className="flex flex-col items-center gap-2">
          <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-4 ${config.borderColor} bg-card/60 flex items-center justify-center overflow-hidden`}>
            <img 
              src={getClusterLogoPath(cluster)}
              alt={cluster}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <span className={`font-display text-xl md:text-2xl font-bold ${config.color}`}>{cluster}</span>
        </div>
      );
    });
  };

  const getWinnerTeam = () => {
    if (!match.winner) return null;
    return match.winner === "A" ? teamA : teamB;
  };

  const getLoserTeam = () => {
    if (!match.winner) return null;
    return match.winner === "A" ? teamB : teamA;
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="font-display text-6xl font-bold text-foreground mb-4">{match.eventTitle}</h1>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="h-px bg-primary/50"
        />
      </motion.div>

      {/* Teams Display */}
      <div className="flex items-center justify-center gap-8 w-full max-w-6xl">
        {/* Team A */}
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ 
            opacity: showWinner && match.winner === "B" ? 0.3 : 1, 
            x: showWinner && match.winner === "B" ? -50 : 0,
            scale: showWinner && match.winner === "A" ? 1.1 : 1
          }}
          transition={{ 
            duration: 0.3,
            ease: "easeInOut"
          }}
          className={`flex-1 text-center p-8 rounded-2xl border-2 ${
            showWinner && match.winner === "A" 
              ? 'border-yellow-400 bg-yellow-400/10 shadow-2xl shadow-yellow-400/20 transform scale-105' 
              : 'border-white/20 bg-white/5'
          }`}
        >
          <h3 className="font-display text-2xl font-semibold text-blue-400 mb-6">{teamA.name}</h3>
          
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            {getTeamClustersDisplay(teamA.clusters)}
          </div>
        </motion.div>

        {/* VS Divider */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: showWinner ? (match.winner === "A" ? 30 : -30) : 0
          }}
          transition={{ 
            duration: 0.3,
            ease: "easeInOut"
          }}
          className="text-center flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{
              rotate: showWinner ? (match.winner === "A" ? -15 : 15) : 0
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <Swords className="w-12 h-12 md:w-16 md:h-16 text-gold" />
          </motion.div>
          <motion.div
            animate={{
              x: showWinner ? (match.winner === "A" ? 20 : -20) : 0
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="font-display text-4xl font-bold text-muted-foreground"
          >
            VS
          </motion.div>
        </motion.div>

        {/* Team B */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ 
            opacity: showWinner && match.winner === "A" ? 0.3 : 1, 
            x: showWinner && match.winner === "A" ? 50 : 0,
            scale: showWinner && match.winner === "B" ? 1.1 : 1
          }}
          transition={{ 
            duration: 0.3,
            ease: "easeInOut"
          }}
          className={`flex-1 text-center p-8 rounded-2xl border-2 ${
            showWinner && match.winner === "B" 
              ? 'border-yellow-400 bg-yellow-400/10 shadow-2xl shadow-yellow-400/20 transform scale-105' 
              : 'border-white/20 bg-white/5'
          }`}
        >
          <h3 className="font-display text-2xl font-semibold text-red-400 mb-6">{teamB.name}</h3>
          
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            {getTeamClustersDisplay(teamB.clusters)}
          </div>
        </motion.div>
      </div>

      {/* Winner Display */}
      <AnimatePresence>
        {showWinner && match.winner && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1.05 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ 
              scale: { duration: 0.6, ease: "easeOut" },
              opacity: { duration: 0.4 },
              y: { duration: 0.5, ease: "easeOut" }
            }}
            className="mt-12 text-center"
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1.05],
              }}
              transition={{ 
                duration: 1.5, 
                ease: "easeInOut",
                times: [0, 0.5, 1]
              }}
              className="inline-block"
            >
              <div className="flex items-center justify-center gap-4 mb-4">
                <Trophy className="w-12 h-12 text-yellow-400" />
                <h2 className="font-display text-4xl font-bold text-yellow-400">
                  {getWinnerTeam()?.name} Wins!
                </h2>
                <Trophy className="w-12 h-12 text-yellow-400" />
              </div>
              <div className="font-body text-xl text-muted-foreground">
              
              </div>
            </motion.div>
            
            {/* Admin Undo Winner Button - Below Winner Display */}
            {isAdmin && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleUndoWinner}
                  className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-body font-medium hover:bg-yellow-600 transition-colors"
                >
                  Undo Winner
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Admin Win Buttons - Below Teams (only if no winner yet) */}
      {isAdmin && !match.winner && (
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => handleSetWinner("A")}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-body font-medium hover:bg-blue-600 transition-colors"
          >
            {teamA.name} Wins
          </button>
          <button
            onClick={() => handleSetWinner("B")}
            className="px-6 py-3 bg-red-500 text-white rounded-lg font-body font-medium hover:bg-red-600 transition-colors"
          >
            {teamB.name} Wins
          </button>
        </div>
      )}
    </div>
  );
}
