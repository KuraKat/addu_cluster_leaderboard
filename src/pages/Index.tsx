import { useState } from "react";
import SplashScreen from "@/components/SplashScreen";
import PresentationCarousel from "@/components/PresentationCarousel";
import AdminPanel from "@/components/AdminPanel";
import GlobalFooter from "@/components/GlobalFooter";
import { useScoreData } from "@/hooks/useScoreData";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  useScoreData();

  return (
    <div className="w-full h-screen overflow-hidden bg-background">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <PresentationCarousel />
      <AdminPanel />
      <GlobalFooter />
    </div>
  );
};

export default Index;
