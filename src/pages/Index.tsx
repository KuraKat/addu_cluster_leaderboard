import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SplashScreen from "@/components/SplashScreen";
import PresentationCarousel from "@/components/PresentationCarousel";
import AdminPanel from "@/components/AdminPanel";
import GlobalFooter from "@/components/GlobalFooter";
import OfflineBanner from "@/components/OfflineBanner";
import { useAuth } from "@/hooks/useAuth";
import { useFirestoreData } from "@/hooks/useFirestoreData";
import { VignetteSettings } from "@/types/leaderboard";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { vignetteSettings } = useFirestoreData();

  // Generate CSS gradient string based on settings
  const getVignetteStyle = (): React.CSSProperties => {
    if (!vignetteSettings.enabled) {
      return {};
    }

    // Convert radius (0-100) to gradient stop percentages
    // Smaller radius = stronger vignette effect
    const transparentStop = Math.max(0, vignetteSettings.radius * 0.3); // 0-30%
    const midStop = Math.min(100, vignetteSettings.radius * 0.6); // 0-60% 
    const fullStop = Math.min(100, vignetteSettings.radius); // 0-100%

    // Convert strength (0-100) to opacity values
    const maxOpacity = vignetteSettings.strength / 100; // 0-1

    // Create gradient from background color (hsl(220, 60%, 12%)) at top-left to transparent at bottom-right
    return {
      background: `linear-gradient(135deg, hsla(220, 60%, 12%, ${maxOpacity * 0.9}) 0%, hsla(220, 60%, 12%, ${maxOpacity * 0.6}) ${transparentStop}%, hsla(220, 60%, 12%, ${maxOpacity * 0.3}) ${midStop}%, transparent ${fullStop}%)`
    };
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* SHS Building Background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url("/assets/backgrounds/SHS_Building.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.15,
          zIndex: 0
        }}
      />
      
      {/* Vignette Overlay - only affects the background image area */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          ...getVignetteStyle(),
          zIndex: 0
        }}
      />
      
      <OfflineBanner />
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <PresentationCarousel />
      {user && <AdminPanel />}
      <GlobalFooter />
    </div>
  );
};

export default Index;
