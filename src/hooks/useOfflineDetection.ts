import { useState, useEffect } from 'react';

export function useOfflineDetection() {
  const [isOffline, setIsOffline] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);
    setIsOffline(!navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setIsOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsOffline(true);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also check Firebase connectivity periodically (simplified)
    const checkFirebaseConnection = async () => {
      try {
        // Simple check - just verify we can access Firestore SDK
        // The direct API call is blocked by CORS, so we rely on browser events
        if (navigator.onLine) {
          setIsOnline(true);
          setIsOffline(false);
        }
      } catch (error) {
        // If we can't reach Firestore, we're offline
        setIsOnline(false);
        setIsOffline(true);
      }
    };

    // Check Firebase connection every 30 seconds
    const intervalId = setInterval(checkFirebaseConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  return { isOffline, isOnline };
}
