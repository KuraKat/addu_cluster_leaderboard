import { useState, useEffect, useCallback } from 'react';
import { adminLogsService } from '@/lib/firestore';
import { AdminLog } from '@/types/leaderboard';
import { useAuth } from './useAuth';
import { ERROR_MESSAGES } from '@/lib/constants';

interface AdminDataStore {
  adminLogs: AdminLog[];
  loading: boolean;
  error: string | null;
  refreshLogs: () => Promise<void>;
}

// Helper function to check if user has admin privileges
const hasAdminRole = (user: any): boolean => {
  if (!user) return false;
  
  // Allow anonymous users in development mode
  const isDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (isDevelopment && user.isAnonymous) {
    return true;
  }
  
  if (!user.email) return false;
  
  // Check email domain or specific admin emails
  const adminEmails = [
    'admin@addu.edu.ph',
    'etoledo@addu.edu.ph',
    // Add other admin emails here
  ];
  
  const userEmail = user.email.toLowerCase();
  return adminEmails.includes(userEmail) || 
         userEmail.endsWith('@addu.edu.ph');
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
        throw new Error(ERROR_MESSAGES.ACCESS_DENIED);
      }
      
      const logs = await adminLogsService.getAll();
      setAdminLogs(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : ERROR_MESSAGES.UNKNOWN_ERROR);
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
      setError(ERROR_MESSAGES.ACCESS_DENIED);
    }
  }, [user, refreshLogs]);

  return {
    adminLogs,
    loading,
    error,
    refreshLogs
  };
}
