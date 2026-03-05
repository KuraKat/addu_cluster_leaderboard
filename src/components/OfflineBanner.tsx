import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

export default function OfflineBanner() {
  const { isOffline, isOnline } = useOfflineDetection();

  if (isOnline && !isOffline) {
    return null; // Don't show banner when online
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] bg-red-500 text-white px-4 py-2 flex items-center justify-center gap-2 shadow-lg">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">
        This is Offline Data - Changes may not be saved to server
      </span>
      <AlertTriangle className="w-4 h-4" />
    </div>
  );
}
