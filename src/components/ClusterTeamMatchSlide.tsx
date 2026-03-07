import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, RotateCcw, Crown, Swords } from "lucide-react";
import { CLUSTER_CONFIG, ALL_CLUSTERS, ClusterName, UnifiedTeamGame } from "@/types/leaderboard";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";

interface ClusterTeamMatchSlideProps {
  match: UnifiedTeamGame;
  isAdmin?: boolean;
  onSetWinner?: (matchId: string, winnerTeamName: string) => void;
  onUndoWinner?: (matchId: string) => void;
}

export default function ClusterTeamMatchSlide({ 
  match, 
  isAdmin = false,
  onSetWinner,
  onUndoWinner 
}: ClusterTeamMatchSlideProps) {
  const { getClusterLogoPath } = useLeaderboardData();
  const [showWinner, setShowWinner] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Helper function to get cluster logos for a team name
  const getTeamClusterLogos = (teamName: string) => {
    // Find the team in the match
    const team = match.teams.find(t => t.name === teamName);
    if (!team || !team.clusters) return [];
    
    // Return all clusters for this team with their logos and colors
    return team.clusters.map((clusterName) => {
      const config = CLUSTER_CONFIG[clusterName as ClusterName];
      return {
        name: clusterName,
        logo: getClusterLogoPath(clusterName),
        color: config?.color || 'text-gray-400',
        borderColor: config?.borderColor || 'border-gray-400',
        bgColor: config?.bgColor || 'bg-gray-400/20'
      };
    });
  };

  // Helper function to determine winner
  const getWinner = () => {
    const winningTeam = match.teams.find(team => team.isWinner);
    return winningTeam ? winningTeam.name : null;
  };

  const winner = getWinner();

  useEffect(() => {
    if (winner) {
      const timer = setTimeout(() => {
        setShowWinner(true);
        setIsAnimating(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowWinner(false);
      setIsAnimating(false);
    }
  }, [winner]);

  const handleSetWinner = (teamName: string) => {
    if (onSetWinner) {
      onSetWinner(match.id, teamName);
    }
  };

  const handleUndoWinner = () => {
    if (onUndoWinner) {
      onUndoWinner(match.id);
    }
  };

  const teamA = match.teams[0];
  const teamB = match.teams[1];

  if (!teamA || !teamB) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Invalid match data</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <motion.h2
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="font-display text-2xl sm:text-3xl md:text-5xl font-black tracking-widest text-gradient-gold mb-4 sm:mb-6 md:mb-8"
        >
          {match.title}
        </motion.h2>
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
            opacity: showWinner && winner === teamA.name ? 0.3 : 1, 
            x: showWinner && winner === teamA.name ? -50 : 0,
            scale: showWinner && winner === teamA.name ? 1.1 : 1
          }}
          transition={{ 
            duration: 0.3,
            ease: "easeInOut"
          }}
          className={`flex-1 text-center p-8 rounded-2xl border-2 ${
            showWinner && winner === teamA.name 
              ? 'border-yellow-400 bg-yellow-400/10 shadow-2xl shadow-yellow-400/20 transform scale-105' 
              : 'border-white/20 bg-white/5'
          }`}
        >
          <h3 className="font-display text-2xl font-semibold text-blue-400 mb-6">{teamA.name}</h3>
          
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            {getTeamClusterLogos(teamA.name).map((cluster, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-4 ${cluster.borderColor} ${cluster.bgColor} flex items-center justify-center overflow-hidden`}>
                  <img 
                    src={cluster.logo}
                    alt={cluster.name}
                    className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <span className={`font-display text-sm md:text-base font-bold ${cluster.color}`}>{cluster.name}</span>
              </div>
            ))}
            {getTeamClusterLogos(teamA.name).length === 0 && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-blue-500 bg-card/60 flex items-center justify-center">
                  <span className="font-display text-lg font-bold text-blue-400">
                    {teamA.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <span className="font-display text-sm md:text-base font-bold text-blue-400">{teamA.name}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* VS Divider */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: showWinner ? (winner === teamA.name ? 30 : -30) : 0
          }}
          transition={{ 
            duration: 0.3,
            ease: "easeInOut"
          }}
          className="text-center flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{
              rotate: showWinner ? (winner === teamA.name ? -15 : 15) : 0
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <Swords className="w-12 h-12 md:w-16 md:h-16 text-gold" />
          </motion.div>
          <motion.div
            animate={{
              x: showWinner ? (winner === teamA.name ? 20 : -20) : 0
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
            opacity: showWinner && winner === teamB.name ? 0.3 : 1, 
            x: showWinner && winner === teamB.name ? 50 : 0,
            scale: showWinner && winner === teamB.name ? 1.1 : 1
          }}
          transition={{ 
            duration: 0.3,
            ease: "easeInOut"
          }}
          className={`flex-1 text-center p-8 rounded-2xl border-2 ${
            showWinner && winner === teamB.name 
              ? 'border-yellow-400 bg-yellow-400/10 shadow-2xl shadow-yellow-400/20 transform scale-105' 
              : 'border-white/20 bg-white/5'
          }`}
        >
          <h3 className="font-display text-2xl font-semibold text-red-400 mb-6">{teamB.name}</h3>
          
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            {getTeamClusterLogos(teamB.name).map((cluster, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-4 ${cluster.borderColor} ${cluster.bgColor} flex items-center justify-center overflow-hidden`}>
                  <img 
                    src={cluster.logo}
                    alt={cluster.name}
                    className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <span className={`font-display text-sm md:text-base font-bold ${cluster.color}`}>{cluster.name}</span>
              </div>
            ))}
            {getTeamClusterLogos(teamB.name).length === 0 && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-red-500 bg-card/60 flex items-center justify-center">
                  <span className="font-display text-lg font-bold text-red-400">
                    {teamB.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <span className="font-display text-sm md:text-base font-bold text-red-400">{teamB.name}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Winner Display */}
      <AnimatePresence>
        {showWinner && winner && (
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
                  {winner} Wins!
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
      {isAdmin && !winner && (
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => handleSetWinner(teamA.name)}
            disabled={winner === teamA.name}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            Set Winner
          </button>
          <button
            onClick={() => handleSetWinner(teamB.name)}
            disabled={winner === teamB.name}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
          >
            Set Winner
          </button>
        </div>
      )}
    </div>
  );
}
