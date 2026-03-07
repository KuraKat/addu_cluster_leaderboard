import { useState, useEffect, useCallback } from 'react';
import { 
  gamesService, 
  allUnifiedTeamGamesService,
  configService,
  grandFinalsService,
  championsService
} from '@/lib/firestore';
import { 
  Game, 
  ClusterName,
  UnifiedTeamGame,
  GrandFinalsMatch, 
  Champion, 
  VignetteSettings,
  AdvancedSlideTiming
} from '@/types/leaderboard';
import { useAuth } from './useAuth';

interface FirestoreDataStore {
  games: Game[];
  allUnifiedTeamGames: UnifiedTeamGame[];
  grandFinals: GrandFinalsMatch[];
  champions: Champion[];
  slideDuration: number;
  advancedSlideTiming: AdvancedSlideTiming;
  vignetteSettings: VignetteSettings;
  config: {
    slideDuration: number;
    advancedSlideTiming: AdvancedSlideTiming;
    vignetteSettings: VignetteSettings;
  };
  loading: boolean;
  error: string | null;
  
  // Game operations
  updateScore: (gameId: string, cluster: ClusterName, score: number) => Promise<void>;
  addGame: (name: string) => Promise<void>;
  removeGame: (gameId: string) => Promise<void>;
  retireGame: (gameId: string) => Promise<void>;
  unretireGame: (gameId: string) => Promise<void>;
  updateGameVisibility: (gameId: string, showTop5: boolean) => Promise<void>;
  updateGameTop3: (gameId: string, showTop3: boolean) => Promise<void>;

  // Unified Team Game operations
  createTeamGame: (title: string, teams: { name: string; clusters: ClusterName[] }[]) => Promise<string>;
  createVersusMatch: (title: string, teamA: { name: string; clusters: ClusterName[] }, teamB: { name: string; clusters: ClusterName[] }, winnerPoints: number, loserPoints: number) => Promise<string>;
  setMatchWinner: (matchId: string, winnerTeamName: string) => Promise<void>;
  undoMatchWinner: (matchId: string) => Promise<void>;
  updateTeamGameScore: (gameId: string, teamName: string, points: number) => Promise<void>;
  archiveGame: (gameId: string) => Promise<void>;
  deleteUnifiedGame: (gameId: string) => Promise<void>;
  updateUnifiedGameStatus: (gameId: string, status: 'active' | 'archived') => Promise<void>;
  unretireTeamGame: (teamGameId: string) => Promise<void>;
  updateTeamGameVisibility: (teamGameId: string, showTop5: boolean) => Promise<void>;
  updateTeamGameTop3: (teamGameId: string, showTop3: boolean) => Promise<void>;
  
  // Grand Finals operations
  addGrandFinals: (title: string, clusterA: ClusterName, clusterB: ClusterName) => Promise<void>;
  removeGrandFinals: (finalId: string) => Promise<void>;
  updateGrandFinals: (finalId: string, updates: Partial<GrandFinalsMatch>) => Promise<void>;
  archiveGrandFinals: (finalId: string) => Promise<void>;
  unarchiveGrandFinals: (finalId: string) => Promise<void>;
  addBet: (id: string, side: "A" | "B") => Promise<void>;
  
  // Settings operations
  updateSlideDuration: (duration: number) => Promise<void>;
  updateAdvancedSlideTiming: (timing: AdvancedSlideTiming) => Promise<void>;
  updateVignetteSettings: (settings: VignetteSettings) => Promise<void>;
  updateConfig: (updates: {
    slideDuration?: number;
    advancedSlideTiming?: AdvancedSlideTiming;
    vignetteSettings?: VignetteSettings;
  }) => Promise<void>;
}

export function useFirestoreData(): FirestoreDataStore {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [allUnifiedTeamGames, setUnifiedTeamGames] = useState<UnifiedTeamGame[]>([]);
  const [grandFinals, setGrandFinals] = useState<GrandFinalsMatch[]>([]);
  const [champions, setChampions] = useState<Champion[]>([]);
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
      // Set up real-time listeners for dynamic data
      unsubscribers.push(
        gamesService.subscribe((data) => {
          setGames(data);
        })
      );

      unsubscribers.push(
        allUnifiedTeamGamesService.subscribe((data) => {
          setUnifiedTeamGames(data);
        })
      );

      unsubscribers.push(
        grandFinalsService.subscribe((data) => {
          setGrandFinals(data);
        })
      );

      // Fetch static data once on mount
      const fetchStaticData = async () => {
        try {
          const [championsData] = await Promise.all([
            championsService.getAll()
          ]);
          setChampions(championsData);
        } catch (err) {
          console.error('Failed to fetch static data:', err);
        }
      };

      fetchStaticData();

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

  const updateGameVisibility = useCallback(async (gameId: string, showTop5: boolean) => {
    try {
      const adminInfo = getAdminInfo();
      await gamesService.updateVisibility(gameId, showTop5, adminInfo.email, adminInfo.name);
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

  const updateConfig = useCallback(async (updates: {
    slideDuration?: number;
    advancedSlideTiming?: AdvancedSlideTiming;
    vignetteSettings?: VignetteSettings;
  }) => {
    try {
      const adminInfo = getAdminInfo();
      await configService.updateGlobalConfig(updates, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update config');
      throw err;
    }
  }, [getAdminInfo]);

  // Team game operations - using unified system directly

  const updateTeamGameScore = useCallback(async (gameId: string, teamName: string, points: number) => {
    try {
      const adminInfo = getAdminInfo();
      await allUnifiedTeamGamesService.updateTeamScore(gameId, teamName, points, getAdminInfo().email, getAdminInfo().name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team game score');
      throw err;
    }
  }, [getAdminInfo]);

  const removeTeamGame = useCallback(async (teamGameId: string) => {
    try {
      const adminInfo = getAdminInfo();
      await allUnifiedTeamGamesService.archiveGame(teamGameId, getAdminInfo().email, getAdminInfo().name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove team game');
      throw err;
    }
  }, [getAdminInfo]);

  const deleteTeamGame = useCallback(async (teamGameId: string) => {
    try {
      const adminInfo = getAdminInfo();
      await allUnifiedTeamGamesService.deleteGame(teamGameId, getAdminInfo().email, getAdminInfo().name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete team game');
      throw err;
    }
  }, [getAdminInfo]);

  const unretireTeamGame = useCallback(async (teamGameId: string) => {
    try {
      const adminInfo = getAdminInfo();
      await allUnifiedTeamGamesService.unarchiveGame(teamGameId, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unretire team game');
      throw err;
    }
  }, [getAdminInfo]);

  const updateTeamGameVisibility = useCallback(async (teamGameId: string, showTop5: boolean) => {
    try {
      const adminInfo = getAdminInfo();
      await allUnifiedTeamGamesService.updateGameVisibility(teamGameId, showTop5, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team game visibility');
      throw err;
    }
  }, [getAdminInfo]);

  const updateTeamGameTop3 = useCallback(async (teamGameId: string, showTop3: boolean) => {
    try {
      const adminInfo = getAdminInfo();
      await allUnifiedTeamGamesService.updateGameTop3(teamGameId, showTop3, adminInfo.email, adminInfo.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team game top3 setting');
      throw err;
    }
  }, [getAdminInfo]);

  return {
    games,
    allUnifiedTeamGames,
    grandFinals,
    champions,
    slideDuration,
    advancedSlideTiming,
    vignetteSettings,
    config: {
      slideDuration,
      advancedSlideTiming,
      vignetteSettings
    },
    loading,
    error,
    
    // Game operations
    updateScore,
    addGame,
    removeGame,
    retireGame,
    unretireGame,
    updateGameVisibility,
    updateGameTop3,
    
    // Unified Team Game operations
    createTeamGame: (title: string, teams: { name: string; clusters: ClusterName[] }[]) => allUnifiedTeamGamesService.createTeamGame(title, teams, getAdminInfo().email, getAdminInfo().name),
    createVersusMatch: (title: string, teamA: { name: string; clusters: ClusterName[] }, teamB: { name: string; clusters: ClusterName[] }, winnerPoints: number, loserPoints: number) => allUnifiedTeamGamesService.createVersusMatch(title, teamA, teamB, winnerPoints, loserPoints, getAdminInfo().email, getAdminInfo().name),
    setMatchWinner: (matchId: string, winnerTeamName: string) => allUnifiedTeamGamesService.setMatchWinner(matchId, winnerTeamName, getAdminInfo().email, getAdminInfo().name),
    undoMatchWinner: (matchId: string) => allUnifiedTeamGamesService.undoMatchWinner(matchId, getAdminInfo().email, getAdminInfo().name),
    updateTeamGameScore: (gameId: string, teamName: string, points: number) => allUnifiedTeamGamesService.updateTeamScore(gameId, teamName, points, getAdminInfo().email, getAdminInfo().name),
    archiveGame: (gameId: string) => allUnifiedTeamGamesService.archiveGame(gameId, getAdminInfo().email, getAdminInfo().name),
    deleteUnifiedGame: (gameId: string) => allUnifiedTeamGamesService.deleteGame(gameId, getAdminInfo().email, getAdminInfo().name),
    updateUnifiedGameStatus: (gameId: string, status: 'active' | 'archived') => allUnifiedTeamGamesService.updateGameStatus(gameId, status, getAdminInfo().email, getAdminInfo().name),
    unretireTeamGame,
    updateTeamGameVisibility,
    updateTeamGameTop3,
    
    // Grand Finals operations
    addGrandFinals,
    removeGrandFinals,
    updateGrandFinals,
    archiveGrandFinals,
    unarchiveGrandFinals,
    addBet,
    
    // Settings
    updateSlideDuration,
    updateAdvancedSlideTiming,
    updateVignetteSettings,
    updateConfig
  };
}
