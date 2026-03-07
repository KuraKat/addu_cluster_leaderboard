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

// Helper function to check if user has admin privileges
const hasAdminRole = (user: any): boolean => {
  if (!user) return false;
  
  // Check email domain or specific admin emails
  const adminEmails = [
    'admin@addu.org',
    'evan@addu.org',
    // Add other admin emails here
  ];
  
  const userEmail = user.email?.toLowerCase();
  return adminEmails.includes(userEmail) || userEmail?.endsWith('@addu.org') || false;
};

export function useAdminData(): AdminDataStore {
  const { user } = useAuth();
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check admin privileges before fetching logs
      if (!hasAdminRole(user)) {
        throw new Error('Access denied: Admin privileges required');
      }
      
      const logs = await adminLogsService.getAll();
      setAdminLogs(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin logs');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load - only if user has admin role
  useEffect(() => {
    if (hasAdminRole(user)) {
      refreshLogs();
    } else {
      setLoading(false);
      setError('Access denied: Admin privileges required');
    }
  }, [user, refreshLogs]);

  return {
    adminLogs,
    loading,
    error,
    refreshLogs
  };
}
