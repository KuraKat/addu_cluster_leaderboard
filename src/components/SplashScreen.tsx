import { motion } from "framer-motion";

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 3, duration: 1, ease: "easeInOut" }}
      onAnimationComplete={onComplete}
    >
      {/* Radial glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center"
      >
        <div className="flex justify-center gap-4 mb-6">
          <motion.img
            src="/assets/logos/AdDU Logo.png"
            alt="AdDU Logo"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
            className="h-20 w-auto object-contain"
          />
          <motion.img
            src="/assets/logos/SHS Logo.png"
            alt="SHS Logo"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            className="h-20 w-auto object-contain"
          />
        </div>
        <h1 className="font-display text-6xl md:text-8xl font-black tracking-wider text-gradient-gold mb-6">
          LEADERBOARD
        </h1>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.5, duration: 1.5, ease: "easeInOut" }}
          className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto max-w-md"
        />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-6 text-lg text-muted-foreground font-body tracking-widest uppercase"
        >
          Cluster Competition
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
