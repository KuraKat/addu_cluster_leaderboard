export default function GlobalFooter() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[90] h-12 flex items-center justify-between px-6 bg-background/80 backdrop-blur-md border-t border-border/40">
      <div className="flex items-center gap-3">
        <img 
          src="/assets/logos/AdDU Logo.png" 
          alt="AdDU Logo" 
          className="h-8 w-auto object-contain"
        />
        <img 
          src="/assets/logos/SHS Logo.png" 
          alt="SHS Logo" 
          className="h-8 w-auto object-contain"
        />
        <span className="font-display text-xs md:text-sm font-bold tracking-widest text-primary">
          CLUSTER LEADERBOARD 2025–2026
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground font-body">
        <span>Current Version 2.0.13</span>
        <span>Developed by: <a href="https://github.com/KuraKat" target="_blank" rel="noopener noreferrer" className="text-foreground font-medium hover:text-primary transition-colors">Evan Toledo, Kibs</a></span>
      </div>
    </div>
  );
}
