import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFirestoreData } from "@/hooks/useFirestoreData";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import OverallLeaderboard from "@/components/OverallLeaderboard";
import GameLeaderboard from "@/components/GameLeaderboard";
import TeamGamesSlide from "@/components/TeamGamesSlide";
import GrandFinalsSlide from "@/components/GrandFinalsSlide";
import ChampionsSlide from "@/components/ChampionsSlide";
import ClusterTeamMatchSlide from "@/components/ClusterTeamMatchSlide";
import { useAuth } from "@/hooks/useAuth";

export default function PresentationCarousel() {
  const { setMatchWinner, undoMatchWinner, slideDuration, advancedSlideTiming } = useFirestoreData();
  const { user } = useAuth();
  const { slideData } = useLeaderboardData();

  const { games, teamGames, grandFinals, clusterTeamMatches, clusterTeams } = slideData;
  const hasChampions = games.length > 0;

  // Slide order: Overall > Grand Finals > Team Matches > Games > Team Games > Champions
  const totalSlides = 1 + grandFinals.length + clusterTeamMatches.length + games.length + teamGames.length + (hasChampions ? 1 : 0);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef(Date.now());
  const [isGrandFinalsPlaying, setIsGrandFinalsPlaying] = useState(false);
  const [lastDataCount, setLastDataCount] = useState({ games: 0, grandFinals: 0, clusterTeamMatches: 0 });
  
  // Reset carousel when new data is added to prevent freezing
  useEffect(() => {
    const currentDataCount = { games: games.length, grandFinals: grandFinals.length, clusterTeamMatches: clusterTeamMatches.length };
    
    // Check if any data has changed
    const hasDataChanged = 
      currentDataCount.games !== lastDataCount.games ||
      currentDataCount.grandFinals !== lastDataCount.grandFinals ||
      currentDataCount.clusterTeamMatches !== lastDataCount.clusterTeamMatches;
    
    if (hasDataChanged) {
      // Reset to first slide to show new content immediately
      setCurrentSlide(0);
      setProgress(0);
      startTimeRef.current = Date.now();
      setIsGrandFinalsPlaying(false);
      setLastDataCount(currentDataCount);
    }
  }, [games.length, grandFinals.length, clusterTeamMatches.length, lastDataCount]);
  
  // Get slide duration based on type and advanced settings
  const getSlideDuration = useCallback((slideIndex: number) => {
    if (advancedSlideTiming.useAdvanced) {
      // Calculate which slide type this is
      let idx = slideIndex;
      
      // Overall standings (always first)
      if (idx === 0) return advancedSlideTiming.overallStanding;
      idx -= 1;
      
      // Grand Finals slides
      if (idx < grandFinals.length) return advancedSlideTiming.grandFinals;
      idx -= grandFinals.length;
      
      // Cluster Team Match slides
      if (idx < clusterTeamMatches.length) return advancedSlideTiming.clusterTeamMatches;
      idx -= clusterTeamMatches.length;
      
      // Game slides
      if (idx < games.length) return advancedSlideTiming.games;
      idx -= games.length;

      // Team Game slides (use same timing as games)
      if (idx < teamGames.length) return advancedSlideTiming.games;
      idx -= teamGames.length;
      
      // Champions slide (last position)
      // After subtracting all previous sections, idx should be 0 for champions
      if (hasChampions && idx === 0) return advancedSlideTiming.hallOfChampions;
      
      return slideDuration; // fallback
    }
    
    return slideDuration; // Use basic slide duration when advanced is disabled
  }, [advancedSlideTiming, slideDuration, grandFinals.length, clusterTeamMatches.length, games.length, teamGames.length, hasChampions]);
  
  // Calculate champions slide index dynamically
  const getChampionsSlideIndex = useCallback(() => {
    return 1 + grandFinals.length + clusterTeamMatches.length + games.length + teamGames.length;
  }, [grandFinals.length, clusterTeamMatches.length, games.length, teamGames.length, hasChampions]);

  const SLIDE_DURATION_MS = getSlideDuration(currentSlide) * 1000;

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    setProgress(0);
    startTimeRef.current = Date.now();
    setIsGrandFinalsPlaying(false);
  }, [totalSlides]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
    setProgress(0);
    startTimeRef.current = Date.now();
    setIsGrandFinalsPlaying(false);
  }, [totalSlides]);

  // Auto-advance slides
  useEffect(() => {
    if (isGrandFinalsPlaying) return;
    const interval = setInterval(nextSlide, getSlideDuration(currentSlide) * 1000);
    return () => clearInterval(interval);
  }, [nextSlide, isGrandFinalsPlaying, getSlideDuration, currentSlide]);

  // Animate progress bar
  useEffect(() => {
    if (isGrandFinalsPlaying) return;
    let rafId: number;
    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentDuration = getSlideDuration(currentSlide) * 1000;
      setProgress(Math.min((elapsed / currentDuration) * 100, 100));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [currentSlide, isGrandFinalsPlaying, getSlideDuration]);

  // Reset slide if out of bounds
  useEffect(() => {
    if (currentSlide >= totalSlides) setCurrentSlide(0);
  }, [totalSlides, currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        nextSlide();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextSlide]);

  const getSlideContent = () => {
    let idx = currentSlide;

    // Overall standings (always first)
    if (idx === 0) return <OverallLeaderboard />;
    idx -= 1;

    // Grand Finals slides
    if (idx < grandFinals.length) {
      if (!isGrandFinalsPlaying) setIsGrandFinalsPlaying(true);
      return <GrandFinalsSlide match={grandFinals[idx]} onComplete={nextSlide} isAdmin={!!user} />;
    }
    idx -= grandFinals.length;

    // Cluster Team Match slides
    if (idx < clusterTeamMatches.length) {
      const match = clusterTeamMatches[idx];
      const teamA = clusterTeams.find(t => t.id === match.teamA);
      const teamB = clusterTeams.find(t => t.id === match.teamB);
      
      if (!teamA || !teamB) {
        return <OverallLeaderboard />; // Fallback if teams not found
      }

      return (
        <ClusterTeamMatchSlide
          match={match}
          teamA={teamA}
          teamB={teamB}
          isAdmin={!!user}
          onSetWinner={setMatchWinner}
          onUndoWinner={undoMatchWinner}
        />
      );
    }
    idx -= clusterTeamMatches.length;

    // Game slides
    if (idx < games.length) return <GameLeaderboard game={games[idx]} />;
    idx -= games.length;

    // Team Game slides
    if (idx < teamGames.length) return <TeamGamesSlide teamGame={teamGames[idx]} />;
    idx -= teamGames.length;

    // Champions slide (last)
    if (hasChampions && idx === 0) return <ChampionsSlide />;

    return <OverallLeaderboard />;
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)",
        backgroundSize: "40px 40px",
      }} />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {getSlideContent()}
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-2">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? "w-8 bg-primary" : "w-1.5 bg-muted-foreground/30"}`} />
        ))}
      </div>

      <div className="absolute bottom-12 left-0 w-full h-1 bg-muted/30">
        <div className="h-full bg-primary transition-none" style={{ width: `${isGrandFinalsPlaying ? 0 : progress}%` }} />
      </div>
    </div>
  );
}
