import { useMemo } from 'react';
import { useFirestoreDataContext } from '@/contexts/FirestoreDataContext';
import { ALL_CLUSTERS, ClusterName } from '@/types/leaderboard';

export function useLeaderboardData() {
  const {
    games,
    unifiedTeamGames,
    grandFinals,
    champions,
    slideDuration,
    loading,
    error
  } = useFirestoreDataContext();

  // Standardized filtered data for slides
  const slideData = useMemo(() => {
    // Active (non-archived) games with at least one non-zero score
    const activeGames = games.filter((g) => 
      !g.archived && 
      Object.values(g.scores).some((s) => s > 0)
    );

    // Active Grand Finals (non-archived, active)
    const activeGrandFinals = grandFinals.filter((f) => 
      f.isActive && !f.archived
    );

    // Active Team Games (non-archived) with at least one non-zero score
    const activeTeamGames = unifiedTeamGames.filter((tg) => 
      tg.isTeamGame && 
      tg.status === 'active' &&
      tg.teams.some((t) => t.points > 0)
    );

    // Active cluster team matches (non-archived)
    const activeClusterTeamMatches = unifiedTeamGames.filter((m) => 
      m.isVersus && 
      m.status === 'active'
    );

  // Champions from active games
  const activeChampions = champions.filter((c) => {
      const game = games.find(g => g.id === c.gameId);
      return game && !game.archived;
    });

    return {
      games: activeGames,
      teamGames: activeTeamGames,
      grandFinals: activeGrandFinals,
      champions: activeChampions,
      clusterTeamMatches: activeClusterTeamMatches,
      slideDuration,
      loading,
      error
    };
  }, [games, unifiedTeamGames, grandFinals, champions, slideDuration, loading, error]);

  // Admin data (includes all items for management)
  const adminData = useMemo(() => {
    const activeGames = games.filter((g) => !g.archived);
    const archivedGames = games.filter((g) => g.archived);
    const activeFinals = grandFinals.filter((f) => !f.archived);
    const archivedFinals = grandFinals.filter((f) => f.archived);
    
    // Filter unified games by type
    const activeTeamMatches = unifiedTeamGames.filter((m) => m.isVersus && m.status === 'active');
    const archivedTeamMatches = unifiedTeamGames.filter((m) => m.isVersus && m.status === 'archived');
    const activeTeamGames = unifiedTeamGames.filter((tg) => tg.isTeamGame && tg.status === 'active');
    const archivedTeamGames = unifiedTeamGames.filter((tg) => tg.isTeamGame && tg.status === 'archived');

    return {
      games: {
        active: activeGames,
        retired: archivedGames,
        all: games
      },
      teamGames: {
        active: activeTeamGames,
        retired: archivedTeamGames,
        all: unifiedTeamGames.filter(g => g.isTeamGame)
      },
      grandFinals: {
        active: activeFinals,
        archived: archivedFinals,
        all: grandFinals
      },
      clusterTeamMatches: {
        active: activeTeamMatches,
        archived: archivedTeamMatches,
        all: unifiedTeamGames.filter(g => g.isVersus)
      },
      champions,
      slideDuration,
      loading,
      error
    };
  }, [games, unifiedTeamGames, grandFinals, champions, slideDuration, loading, error]);

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
      clusterTeams: [], // Using unified team games system instead
      unifiedTeamGames,
      slideDuration,
      loading,
      error
    }
  };
}
