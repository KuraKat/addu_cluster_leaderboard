import { useState, useEffect, useCallback } from 'react';
import { 
  gamesService, 
  teamGamesService,
  clusterTeamsService, 
  clusterTeamMatchesService, 
  configService,
  grandFinalsService,
  championsService
} from '@/lib/firestore';
import { 
  Game, 
  ClusterTeam, 
  ClusterTeamMatch, 
  GrandFinalsMatch, 
  Champion, 
  ClusterName, 
  AdvancedSlideTiming,
  VignetteSettings,
  TeamGame
} from '@/types/leaderboard';
import { useAuth } from './useAuth';

interface FirestoreDataStore {
  games: Game[];
  teamGames: TeamGame[];
  grandFinals: GrandFinalsMatch[];
  champions: Champion[];
  clusterTeams: ClusterTeam[];
  clusterTeamMatches: ClusterTeamMatch[];
  slideDuration: number;
  advancedSlideTiming: AdvancedSlideTiming;
  vignetteSettings: VignetteSettings;
  loading: boolean;
  error: string | null;
  
  // Game operations
  updateScore: (gameId: string, cluster: string, score: number) => Promise<void>;
  addGame: (name: string) => Promise<void>;
  removeGame: (gameId: string) => Promise<void>;
  retireGame: (gameId: string) => Promise<void>;
  unretireGame: (gameId: string) => Promise<void>;
  updateGameVisibility: (gameId: string, showTopOnly: boolean) => Promise<void>;
  updateGameTop3: (gameId: string, showTop3: boolean) => Promise<void>;

  // Team game operations
  addTeamGame: (name: string, teams: ClusterName[]) => Promise<void>;
  updateTeamGameScore: (teamGameId: string, cluster: string, score: number) => Promise<void>;
  removeTeamGame: (teamGameId: string) => Promise<void>;
  retireTeamGame: (teamGameId: string) => Promise<void>;
  unretireTeamGame: (teamGameId: string) => Promise<void>;
  updateTeamGameVisibility: (teamGameId: string, top3: boolean) => Promise<void>;
  
  // Grand Finals operations
  addGrandFinals: (title: string, clusterA: ClusterName, clusterB: ClusterName) => Promise<void>;
  removeGrandFinals: (finalId: string) => Promise<void>;
  updateGrandFinals: (finalId: string, updates: Partial<GrandFinalsMatch>) => Promise<void>;
  archiveGrandFinals: (finalId: string) => Promise<void>;
  unarchiveGrandFinals: (finalId: string) => Promise<void>;
  addBet: (id: string, side: "A" | "B") => Promise<void>;
  
  // Team operations
  addClusterTeam: (team: Omit<ClusterTeam, 'id'>) => Promise<void>;
  updateClusterTeam: (teamId: string, updates: Partial<ClusterTeam>) => Promise<void>;
  removeClusterTeam: (teamId: string) => Promise<void>;
  
  // Team Match operations
  addClusterTeamMatch: (match: Omit<ClusterTeamMatch, 'id'>) => Promise<void>;
  updateClusterTeamMatch: (matchId: string, updates: Partial<ClusterTeamMatch>) => Promise<void>;
  deleteClusterTeamMatch: (matchId: string) => Promise<void>;
  setMatchWinner: (matchId: string, winner: "A" | "B") => Promise<void>;
  undoMatchWinner: (matchId: string) => Promise<void>;
  archiveClusterTeamMatch: (matchId: string) => Promise<void>;
  unarchiveClusterTeamMatch: (matchId: string) => Promise<void>;
  
  // Settings
  updateSlideDuration: (duration: number) => Promise<void>;
  updateAdvancedSlideTiming: (timing: AdvancedSlideTiming) => Promise<void>;
  updateVignetteSettings: (settings: VignetteSettings) => Promise<void>;
}

export function useFirestoreData(): FirestoreDataStore {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [teamGames, setTeamGames] = useState<TeamGame[]>([]);
  const [grandFinals, setGrandFinals] = useState<GrandFinalsMatch[]>([]);
  const [champions, setChampions] = useState<Champion[]>([]);
  const [clusterTeams, setClusterTeams] = useState<ClusterTeam[]>([]);
  const [clusterTeamMatches, setClusterTeamMatches] = useState<ClusterTeamMatch[]>([]);
  const [slideDuration, setSlideDuration] = useState(7);
  const [advancedSlideTiming, setAdvancedSlideTiming] = useState<AdvancedSlideTiming>({
    overallStanding: 7,
    games: 7,
    hallOfChampions: 7,
    grandFinals: 14, // Grand finals have 2 phases, so longer by default
    clusterTeamMatches: 7,
    useAdvanced: false
  });
  const [vignetteSettings, setVignetteSettings] = useState<VignetteSettings>({
    enabled: true,
    radius: 30,
    strength: 85
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get admin info for logging
  const getAdminInfo = useCallback(() => {
    return {
      email: user?.email || 'unknown@admin.com',
      name: user?.displayName || user?.email || 'Unknown Admin'
    };
  }, [user]);

  // Initialize data and set up real-time listeners
  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribers: (() => void)[] = [];

    try {
      // Set up real-time listeners
      unsubscribers.push(
        gamesService.subscribe((data) => {
          setGames(data);
        })
      );

      unsubscribers.push(
        teamGamesService.subscribe((data) => {
          setTeamGames(data);
        })
      );

      unsubscribers.push(
        grandFinalsService.subscribe((data) => {
          setGrandFinals(data);
        })
      );

      unsubscribers.push(
        championsService.subscribe((data) => {
          setChampions(data);
        })
      );

      unsubscribers.push(
        clusterTeamsService.subscribe((data) => {
          setClusterTeams(data);
        })
      );

      unsubscribers.push(
        clusterTeamMatchesService.subscribe((data) => {
          setClusterTeamMatches(data);
        })
      );

      // Unified config subscription (replaces 3 separate subscriptions)
      unsubscribers.push(
        configService.subscribe((config) => {
          setSlideDuration(config.slideDuration);
          setAdvancedSlideTiming(config.advancedSlideTiming);
          setVignetteSettings(config.vignetteSettings);
        })
      );

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setLoading(false);
    }

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  // Game operations
  const updateScore = useCallback(async (gameId: string, cluster: string, score: number) => {
    try {
      const adminInfo = getAdminInfo();
      await gamesService.updateScore(gameId, cluster as any, score, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update score');
      throw err;
    }
  }, [getAdminInfo]);

  const addGame = useCallback(async (name: string) => {
    try {
      const adminInfo = getAdminInfo();
      await gamesService.create(name, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add game');
      throw err;
    }
  }, [getAdminInfo]);

  const removeGame = useCallback(async (gameId: string) => {
    try {
      const adminInfo = getAdminInfo();
      await gamesService.delete(gameId, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove game');
      throw err;
    }
  }, [getAdminInfo]);

  const retireGame = useCallback(async (gameId: string) => {
    try {
      const adminInfo = getAdminInfo();
      await gamesService.retire(gameId, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retire game');
      throw err;
    }
  }, [getAdminInfo]);

  const unretireGame = useCallback(async (gameId: string) => {
    try {
      const adminInfo = getAdminInfo();
      await gamesService.unretire(gameId, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unretire game');
      throw err;
    }
  }, [getAdminInfo]);

  const updateGameVisibility = useCallback(async (gameId: string, showTopOnly: boolean) => {
    try {
      const adminInfo = getAdminInfo();
      await gamesService.updateVisibility(gameId, showTopOnly, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update game visibility');
      throw err;
    }
  }, [getAdminInfo]);

  const updateGameTop3 = useCallback(async (gameId: string, showTop3: boolean) => {
    try {
      const adminInfo = getAdminInfo();
      await gamesService.updateTop3(gameId, showTop3, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update game top3 setting');
      throw err;
    }
  }, [getAdminInfo]);

  // Grand Finals operations
  const addGrandFinals = useCallback(async (title: string, clusterA: ClusterName, clusterB: ClusterName) => {
    try {
      const adminInfo = getAdminInfo();
      await grandFinalsService.create(title, clusterA, clusterB, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add grand finals');
      throw err;
    }
  }, [getAdminInfo]);

  const removeGrandFinals = useCallback(async (finalId: string) => {
    try {
      const adminInfo = getAdminInfo();
      await grandFinalsService.delete(finalId, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove grand finals');
      throw err;
    }
  }, [getAdminInfo]);

  const updateGrandFinals = useCallback(async (finalId: string, updates: Partial<GrandFinalsMatch>) => {
    try {
      const adminInfo = getAdminInfo();
      await grandFinalsService.update(finalId, updates, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update grand finals');
      throw err;
    }
  }, [getAdminInfo]);

  const archiveGrandFinals = useCallback(async (finalId: string) => {
    try {
      const adminInfo = getAdminInfo();
      await grandFinalsService.archive(finalId, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive grand finals');
      throw err;
    }
  }, [getAdminInfo]);

  const unarchiveGrandFinals = useCallback(async (finalId: string) => {
    try {
      const adminInfo = getAdminInfo();
      await grandFinalsService.unarchive(finalId, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unarchive grand finals');
      throw err;
    }
  }, [getAdminInfo]);

  const addBet = useCallback(async (id: string, side: "A" | "B") => {
    try {
      await grandFinalsService.addBet(id, side);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add bet');
      throw err;
    }
  }, []);

  // Team operations
  const addClusterTeam = useCallback(async (team: Omit<ClusterTeam, 'id'>) => {
    try {
      const adminInfo = getAdminInfo();
      await clusterTeamsService.create(team, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add team');
      throw err;
    }
  }, [getAdminInfo]);

  const updateClusterTeam = useCallback(async (teamId: string, updates: Partial<ClusterTeam>) => {
    try {
      const adminInfo = getAdminInfo();
      await clusterTeamsService.update(teamId, updates, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team');
      throw err;
    }
  }, [getAdminInfo]);

  const removeClusterTeam = useCallback(async (teamId: string) => {
    try {
      const adminInfo = getAdminInfo();
      await clusterTeamsService.delete(teamId, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove team');
      throw err;
    }
  }, [getAdminInfo]);

  // Team match operations
  const addClusterTeamMatch = useCallback(async (match: Omit<ClusterTeamMatch, 'id'>) => {
    try {
      const adminInfo = getAdminInfo();
      await clusterTeamMatchesService.create(match, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add match');
      throw err;
    }
  }, [getAdminInfo]);

  const updateClusterTeamMatch = useCallback(async (matchId: string, updates: Partial<ClusterTeamMatch>) => {
    try {
      const adminInfo = getAdminInfo();
      await clusterTeamMatchesService.update(matchId, updates, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update match');
      throw err;
    }
  }, [getAdminInfo]);

  const setMatchWinner = useCallback(async (matchId: string, winner: "A" | "B") => {
    try {
      const adminInfo = getAdminInfo();
      await clusterTeamMatchesService.setWinner(matchId, winner, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set winner');
      throw err;
    }
  }, [getAdminInfo]);

  const undoMatchWinner = useCallback(async (matchId: string) => {
    try {
      const adminInfo = getAdminInfo();
      await clusterTeamMatchesService.undoWinner(matchId, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to undo match winner');
      throw err;
    }
  }, [getAdminInfo]);

  const archiveClusterTeamMatch = useCallback(async (matchId: string) => {
    try {
      const adminInfo = getAdminInfo();
      await clusterTeamMatchesService.archive(matchId, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive team match');
      throw err;
    }
  }, [getAdminInfo]);

  const unarchiveClusterTeamMatch = useCallback(async (matchId: string) => {
    try {
      const adminInfo = getAdminInfo();
      await clusterTeamMatchesService.unarchive(matchId, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unarchive team match');
      throw err;
    }
  }, [getAdminInfo]);

  const deleteClusterTeamMatch = useCallback(async (matchId: string) => {
    try {
      const adminInfo = getAdminInfo();
      await clusterTeamMatchesService.delete(matchId, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete match');
      throw err;
    }
  }, [getAdminInfo]);

  // Settings
  const updateSlideDuration = useCallback(async (duration: number) => {
    try {
      const adminInfo = getAdminInfo();
      await configService.updateGlobalConfig({ slideDuration: duration }, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update slide duration');
      throw err;
    }
  }, [getAdminInfo]);

  const updateAdvancedSlideTiming = useCallback(async (timing: AdvancedSlideTiming) => {
    try {
      const adminInfo = getAdminInfo();
      await configService.updateGlobalConfig({ advancedSlideTiming: timing }, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update advanced slide timing');
      throw err;
    }
  }, [getAdminInfo]);

  const updateVignetteSettings = useCallback(async (settings: VignetteSettings) => {
    try {
      const adminInfo = getAdminInfo();
      await configService.updateGlobalConfig({ vignetteSettings: settings }, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vignette settings');
      throw err;
    }
  }, [getAdminInfo]);

  // Team game operations
  const addTeamGame = useCallback(async (name: string, teams: ClusterName[]) => {
    try {
      const adminInfo = getAdminInfo();
      const scores: Record<string, number> = {};
      teams.forEach(team => {
        scores[team] = 0;
      });
      
      await teamGamesService.add({
        name,
        teams,
        scores,
        retired: false,
        top3: false
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add team game');
      throw err;
    }
  }, [getAdminInfo]);

  const updateTeamGameScore = useCallback(async (teamGameId: string, cluster: string, score: number) => {
    try {
      const adminInfo = getAdminInfo();
      const teamGame = teamGames.find(tg => tg.id === teamGameId);
      if (!teamGame) throw new Error('Team game not found');
      
      await teamGamesService.update(teamGameId, {
        scores: {
          ...teamGame.scores,
          [cluster]: score
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team game score');
      throw err;
    }
  }, [teamGames, getAdminInfo]);

  const removeTeamGame = useCallback(async (teamGameId: string) => {
    try {
      const adminInfo = getAdminInfo();
      await teamGamesService.delete(teamGameId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove team game');
      throw err;
    }
  }, [getAdminInfo]);

  const retireTeamGame = useCallback(async (teamGameId: string) => {
    try {
      const adminInfo = getAdminInfo();
      await teamGamesService.update(teamGameId, { retired: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retire team game');
      throw err;
    }
  }, [getAdminInfo]);

  const unretireTeamGame = useCallback(async (teamGameId: string) => {
    try {
      const adminInfo = getAdminInfo();
      await teamGamesService.update(teamGameId, { retired: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unretire team game');
      throw err;
    }
  }, [getAdminInfo]);

  const updateTeamGameVisibility = useCallback(async (teamGameId: string, top3: boolean) => {
    try {
      const adminInfo = getAdminInfo();
      await teamGamesService.update(teamGameId, { top3 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team game visibility');
      throw err;
    }
  }, [getAdminInfo]);

  return {
    games,
    teamGames,
    grandFinals,
    champions,
    clusterTeams,
    clusterTeamMatches,
    slideDuration,
    advancedSlideTiming,
    vignetteSettings,
    loading,
    error,
    
    updateScore,
    addGame,
    removeGame,
    retireGame,
    unretireGame,
    updateGameVisibility,
    updateGameTop3,
    addTeamGame,
    updateTeamGameScore,
    removeTeamGame,
    retireTeamGame,
    unretireTeamGame,
    updateTeamGameVisibility,
    addGrandFinals,
    removeGrandFinals,
    updateGrandFinals,
    archiveGrandFinals,
    unarchiveGrandFinals,
    addBet,
    
    addClusterTeam,
    updateClusterTeam,
    removeClusterTeam,
    
    addClusterTeamMatch,
    updateClusterTeamMatch,
    deleteClusterTeamMatch,
    setMatchWinner,
    undoMatchWinner,
    archiveClusterTeamMatch,
    unarchiveClusterTeamMatch,
    
    updateSlideDuration,
    updateAdvancedSlideTiming,
    updateVignetteSettings,
  };
}
