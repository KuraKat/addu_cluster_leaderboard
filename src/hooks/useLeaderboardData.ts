import { useMemo } from 'react';
import { useFirestoreData } from '@/hooks/useFirestoreData';
import { ALL_CLUSTERS, ClusterName } from '@/types/leaderboard';

export function useLeaderboardData() {
  const {
    games,
    grandFinals,
    champions,
    clusterTeams,
    clusterTeamMatches,
    adminLogs,
    slideDuration,
    loading,
    error
  } = useFirestoreData();

  // Standardized filtered data for slides
  const slideData = useMemo(() => {
    // Active (non-retired, non-archived) games with at least one non-zero score
    const activeGames = games.filter((g) => 
      !g.retired && 
      !g.archived && 
      Object.values(g.scores).some((s) => s > 0)
    );

    // Active Grand Finals (non-archived, active)
    const activeGrandFinals = grandFinals.filter((f) => 
      f.isActive && !f.archived
    );

    // Active Cluster Team Matches (non-archived, active)
    const activeClusterTeamMatches = clusterTeamMatches.filter((m) => 
      m.isActive && !m.archived
    );

    // Active Cluster Teams
    const activeClusterTeams = clusterTeams.filter((t) => t.isActive);

    // Champions from active games
    const activeChampions = champions.filter((c) => {
      const game = games.find(g => g.id === c.gameId);
      return game && !game.retired && !game.archived;
    });

    return {
      games: activeGames,
      grandFinals: activeGrandFinals,
      champions: activeChampions,
      clusterTeams: activeClusterTeams,
      clusterTeamMatches: activeClusterTeamMatches,
      slideDuration,
      loading,
      error
    };
  }, [games, grandFinals, champions, clusterTeams, clusterTeamMatches, slideDuration, loading, error]);

  // Admin data (includes all items for management)
  const adminData = useMemo(() => {
    const activeGames = games.filter((g) => !g.retired);
    const retiredGames = games.filter((g) => g.retired);
    const activeFinals = grandFinals.filter((f) => !f.archived);
    const archivedFinals = grandFinals.filter((f) => f.archived);

    return {
      games: {
        active: activeGames,
        retired: retiredGames,
        all: games
      },
      grandFinals: {
        active: activeFinals,
        archived: archivedFinals,
        all: grandFinals
      },
      champions,
      clusterTeams,
      clusterTeamMatches,
      adminLogs,
      slideDuration,
      loading,
      error
    };
  }, [games, grandFinals, champions, clusterTeams, clusterTeamMatches, slideDuration, loading, error]);

  // Helper function to get cluster logo path (standardized across components)
  const getClusterLogoPath = (clusterName: string): string => {
    switch (clusterName.toLowerCase()) {
      case 'salamanca':
        return '/assets/cluster_logos/salamanca.jpg';
      case 'manresa':
        return '/assets/cluster_logos/manresa.jpg';
      case 'jerusalem':
        return '/assets/cluster_logos/jerusalem.jpg';
      case 'paris':
        return '/assets/cluster_logos/paris.jpg';
      case 'rome':
        return '/assets/cluster_logos/rome.jpg';
      case 'montserrat':
        return '/assets/cluster_logos/montserrat.jpg';
      case 'pamplona':
        return '/assets/cluster_logos/pamplona.jpg';
      case 'barcelona':
        return '/assets/cluster_logos/barcelona.jpg';
      default:
        return '/assets/cluster_logos/default.jpg';
    }
  };

  return {
    // For slide components (user-facing)
    slideData,
    
    // For admin components
    adminData,
    
    // Utilities
    getClusterLogoPath,
    
    // Raw data (if needed)
    raw: {
      games,
      grandFinals,
      champions,
      clusterTeams,
      clusterTeamMatches,
      adminLogs,
      slideDuration,
      loading,
      error
    }
  };
}
