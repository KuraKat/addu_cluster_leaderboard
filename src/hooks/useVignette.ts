import { useState, useEffect } from 'react';

interface VignetteSettings {
  radius: number; // 0-100, where 0 is smallest (strongest) and 100 is largest (weakest)
  strength: number; // 0-100, where 0 is no vignette and 100 is maximum strength
  enabled: boolean;
}

const DEFAULT_SETTINGS: VignetteSettings = {
  radius: 30, // Default radius - relatively small for stronger effect
  strength: 85, // Default strength - quite strong
  enabled: true
};

export function useVignette() {
  const [settings, setSettings] = useState<VignetteSettings>(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('vignette-settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    // Save to localStorage whenever settings change
    localStorage.setItem('vignette-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<VignetteSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Generate CSS gradient string based on settings
  const getVignetteStyle = (): React.CSSProperties => {
    if (!settings.enabled) {
      return {};
    }

    // Convert radius (0-100) to gradient stop percentages
    // Smaller radius = stronger vignette effect
    const transparentStop = Math.max(0, settings.radius * 0.3); // 0-30%
    const midStop = Math.min(100, settings.radius * 0.6); // 0-60% 
    const fullStop = Math.min(100, settings.radius); // 0-100%

    // Convert strength (0-100) to opacity values
    const maxOpacity = settings.strength / 100; // 0-1

    return {
      background: `radial-gradient(ellipse at 0% 0%, transparent 0%, rgba(0,0,0,${maxOpacity * 0.4}) ${transparentStop}%, rgba(0,0,0,${maxOpacity * 0.7}) ${midStop}%, rgba(0,0,0,${maxOpacity * 0.85}) ${fullStop}%)`,
      zIndex: 2
    };
  };

  return {
    settings,
    updateSettings,
    getVignetteStyle
  };
}
