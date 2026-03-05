export default function GlobalFooter() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[90] h-12 flex items-center justify-between px-6 bg-background/80 backdrop-blur-md border-t border-border/40">
      <div className="flex items-center gap-3">
        <span className="font-display text-xs md:text-sm font-bold tracking-widest text-primary">
          CLUSTER LEADERBOARD 2025–2026
        </span>
      </div>
      <div className="text-xs text-muted-foreground font-body">
        Developed by: <span className="text-foreground font-medium">KuraKat</span>
      </div>
    </div>
  );
}
