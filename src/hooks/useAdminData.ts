import { useState, useEffect, useCallback } from 'react';
import { adminLogsService } from '@/lib/firestore';
import { AdminLog } from '@/types/leaderboard';
import { useAuth } from './useAuth';

interface AdminDataStore {
  adminLogs: AdminLog[];
  loading: boolean;
  error: string | null;
  refreshLogs: () => Promise<void>;
}

export function useAdminData(): AdminDataStore {
  const { user } = useAuth();
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const logs = await adminLogsService.getAll();
      setAdminLogs(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin logs');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    adminLogs,
    loading,
    error,
    refreshLogs
  };
}
