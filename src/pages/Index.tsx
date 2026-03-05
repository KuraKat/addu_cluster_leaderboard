import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SplashScreen from "@/components/SplashScreen";
import PresentationCarousel from "@/components/PresentationCarousel";
import AdminPanel from "@/components/AdminPanel";
import GlobalFooter from "@/components/GlobalFooter";
import { useScoreData } from "@/hooks/useScoreData";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useScoreData();

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden bg-background">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <PresentationCarousel />
      {user && <AdminPanel />}
      <GlobalFooter />
    </div>
  );
};

export default Index;
