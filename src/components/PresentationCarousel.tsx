import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useScoreStore } from "@/hooks/useScoreData";
import OverallLeaderboard from "@/components/OverallLeaderboard";
import GameLeaderboard from "@/components/GameLeaderboard";
import GrandFinalsSlide from "@/components/GrandFinalsSlide";
import ChampionsSlide from "@/components/ChampionsSlide";

/** Duration (in ms) each slide stays visible before advancing. */
const SECONDS_PER_SLIDE = 7;
const SLIDE_DURATION_MS = SECONDS_PER_SLIDE * 1000;

export default function PresentationCarousel() {
  const { games, grandFinals, champions } = useScoreStore();

  const activeGrandFinals = grandFinals.filter((f) => f.isActive);
  // Active (non-retired) games with at least one non-zero score
  const activeGames = games.filter((g) => !g.retired && Object.values(g.scores).some((s) => s > 0));
  const hasChampions = champions.length > 0;

  // Slide order: [grand finals...] + overall + [champions?] + [game slides...]
  const totalSlides = activeGrandFinals.length + 1 + (hasChampions ? 1 : 0) + activeGames.length;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef(Date.now());
  const [isGrandFinalsPlaying, setIsGrandFinalsPlaying] = useState(false);

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

  // Advance slide on timer (skip for grand finals which self-manages)
  useEffect(() => {
    if (isGrandFinalsPlaying) return;
    const interval = setInterval(nextSlide, SLIDE_DURATION_MS);
    return () => clearInterval(interval);
  }, [nextSlide, isGrandFinalsPlaying]);

  // Animate progress bar
  useEffect(() => {
    if (isGrandFinalsPlaying) return;
    let rafId: number;
    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      setProgress(Math.min((elapsed / SLIDE_DURATION_MS) * 100, 100));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [currentSlide, isGrandFinalsPlaying]);

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

    // Grand Finals slides
    if (idx < activeGrandFinals.length) {
      if (!isGrandFinalsPlaying) setIsGrandFinalsPlaying(true);
      return <GrandFinalsSlide match={activeGrandFinals[idx]} onComplete={nextSlide} />;
    }
    idx -= activeGrandFinals.length;

    // Overall standings
    if (idx === 0) return <OverallLeaderboard />;
    idx -= 1;

    // Champions slide
    if (hasChampions) {
      if (idx === 0) return <ChampionsSlide />;
      idx -= 1;
    }

    // Game slides
    if (idx < activeGames.length) return <GameLeaderboard game={activeGames[idx]} />;

    return <OverallLeaderboard />;
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
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
