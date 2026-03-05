import { create } from "zustand";
import { Game, ClusterName, ALL_CLUSTERS, PointLog, GrandFinalsMatch, Champion } from "@/types/leaderboard";
import { useEffect } from "react";

const STORAGE_KEY = "leaderboard-games";
const LOGS_KEY = "leaderboard-logs";
const FINALS_KEY = "leaderboard-finals";
const CHAMPIONS_KEY = "leaderboard-champions";

function createDefaultScores(): Record<ClusterName, number> {
  const scores = {} as Record<ClusterName, number>;
  ALL_CLUSTERS.forEach((c) => (scores[c] = 0));
  return scores;
}

const MOCK_GAMES: Game[] = [
  {
    id: "game-1",
    name: "Trivia Challenge",
    scores: { Salamanca: 85, Manresa: 72, Jerusalem: 90, Paris: 68, Rome: 95, Montserrat: 78, Pamplona: 82, Barcelona: 88 },
  },
  {
    id: "game-2",
    name: "Relay Race",
    scores: { Salamanca: 60, Manresa: 95, Jerusalem: 75, Paris: 88, Rome: 70, Montserrat: 92, Pamplona: 65, Barcelona: 80 },
  },
  {
    id: "game-3",
    name: "Creative Arts",
    scores: { Salamanca: 90, Manresa: 80, Jerusalem: 85, Paris: 95, Rome: 75, Montserrat: 70, Pamplona: 88, Barcelona: 82 },
  },
];

const SETTINGS_KEY = "leaderboard-settings";

function load<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {}
  return fallback;
}

function save(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

interface ScoreStore {
  games: Game[];
  logs: PointLog[];
  grandFinals: GrandFinalsMatch[];
  champions: Champion[];
  slideDuration: number; // Duration in seconds per slide
  updateScore: (gameId: string, cluster: ClusterName, score: number) => void;
  addGame: (name: string) => void;
  removeGame: (gameId: string) => void;
  retireGame: (gameId: string) => void;
  unretireGame: (gameId: string) => void;
  updateGameVisibility: (gameId: string, showTopOnly: boolean) => void;
  updateGameTop3: (gameId: string, showTop3: boolean) => void;
  addGrandFinals: (title: string, clusterA: ClusterName, clusterB: ClusterName) => void;
  removeGrandFinals: (id: string) => void;
  updateGrandFinals: (id: string, updates: Partial<GrandFinalsMatch>) => void;
  addBet: (id: string, side: "A" | "B") => void;
  updateSlideDuration: (duration: number) => void;
  _setGames: (games: Game[]) => void;
  _setLogs: (logs: PointLog[]) => void;
  _setFinals: (finals: GrandFinalsMatch[]) => void;
  _setChampions: (champions: Champion[]) => void;
}

export const useScoreStore = create<ScoreStore>((set, get) => ({
  games: load<Game[]>(STORAGE_KEY, MOCK_GAMES),
  logs: load<PointLog[]>(LOGS_KEY, []),
  grandFinals: load<GrandFinalsMatch[]>(FINALS_KEY, []),
  champions: load<Champion[]>(CHAMPIONS_KEY, []),
  slideDuration: load<number>(SETTINGS_KEY, 7),

  updateScore: (gameId, cluster, score) => {
    const state = get();
    const oldGame = state.games.find((g) => g.id === gameId);
    const oldScore = oldGame?.scores[cluster] ?? 0;
    const diff = score - oldScore;

    const games = state.games.map((g) =>
      g.id === gameId ? { ...g, scores: { ...g.scores, [cluster]: score } } : g
    );
    save(STORAGE_KEY, games);

    if (diff !== 0 && oldGame) {
      const log: PointLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        gameId,
        gameName: oldGame.name,
        cluster,
        pointsAdded: diff,
      };
      const logs = [log, ...state.logs].slice(0, 100);
      save(LOGS_KEY, logs);
      set({ games, logs });
    } else {
      set({ games });
    }
  },

  addGame: (name) => {
    const games = [...get().games, { id: `game-${Date.now()}`, name, scores: createDefaultScores() }];
    save(STORAGE_KEY, games);
    set({ games });
  },

  removeGame: (gameId) => {
    const state = get();
    const games = state.games.filter((g) => g.id !== gameId);
    const champions = state.champions.filter((c) => c.gameId !== gameId);
    save(STORAGE_KEY, games);
    save(CHAMPIONS_KEY, champions);
    set({ games, champions });
  },

  retireGame: (gameId) => {
    const state = get();
    const game = state.games.find((g) => g.id === gameId);
    if (!game) return;

    // Record champion (highest scoring cluster)
    const topCluster = ALL_CLUSTERS.reduce((best, c) =>
      (game.scores[c] ?? 0) > (game.scores[best] ?? 0) ? c : best
    , ALL_CLUSTERS[0]);

    const champion: Champion = {
      gameId: game.id,
      gameName: game.name,
      cluster: topCluster,
      score: game.scores[topCluster],
      timestamp: Date.now(),
    };

    const games = state.games.map((g) =>
      g.id === gameId ? { ...g, retired: true } : g
    );
    // Replace existing champion for this game or add new
    const champions = [...state.champions.filter((c) => c.gameId !== gameId), champion];

    save(STORAGE_KEY, games);
    save(CHAMPIONS_KEY, champions);
    set({ games, champions });
  },

  unretireGame: (gameId) => {
    const games = get().games.map((g) =>
      g.id === gameId ? { ...g, retired: false } : g
    );
    save(STORAGE_KEY, games);
    set({ games });
  },

  updateGameVisibility: (gameId, showTopOnly) => {
    const games = get().games.map((g) =>
      g.id === gameId ? { ...g, showTopOnly } : g
    );
    save(STORAGE_KEY, games);
    set({ games });
  },

  updateGameTop3: (gameId, showTop3) => {
    const games = get().games.map((g) =>
      g.id === gameId ? { ...g, showTop3 } : g
    );
    save(STORAGE_KEY, games);
    set({ games });
  },

  addGrandFinals: (title, clusterA, clusterB) => {
    const finals = [...get().grandFinals, {
      id: `finals-${Date.now()}`,
      isActive: false,
      eventTitle: title,
      clusterA,
      clusterB,
      betsA: 0,
      betsB: 0,
      votingEnabled: false,
    }];
    save(FINALS_KEY, finals);
    set({ grandFinals: finals });
  },

  removeGrandFinals: (id) => {
    const finals = get().grandFinals.filter((f) => f.id !== id);
    save(FINALS_KEY, finals);
    set({ grandFinals: finals });
  },

  updateGrandFinals: (id, updates) => {
    const finals = get().grandFinals.map((f) =>
      f.id === id ? { ...f, ...updates } : f
    );
    save(FINALS_KEY, finals);
    set({ grandFinals: finals });
  },

  addBet: (id, side) => {
    const finals = get().grandFinals.map((f) => {
      if (f.id !== id) return f;
      return side === "A" ? { ...f, betsA: f.betsA + 1 } : { ...f, betsB: f.betsB + 1 };
    });
    save(FINALS_KEY, finals);
    set({ grandFinals: finals });
  },

  updateSlideDuration: (duration) => {
    save(SETTINGS_KEY, duration);
    set({ slideDuration: duration });
  },

  _setGames: (games) => set({ games }),
  _setLogs: (logs) => set({ logs }),
  _setFinals: (finals) => set({ grandFinals: finals }),
  _setChampions: (champions) => set({ champions }),
}));

/** Hook that also listens for cross-tab storage changes */
export function useScoreData() {
  const store = useScoreStore();

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      try {
        if (e.key === STORAGE_KEY && e.newValue) store._setGames(JSON.parse(e.newValue));
        if (e.key === LOGS_KEY && e.newValue) store._setLogs(JSON.parse(e.newValue));
        if (e.key === FINALS_KEY && e.newValue) store._setFinals(JSON.parse(e.newValue));
        if (e.key === CHAMPIONS_KEY && e.newValue) store._setChampions(JSON.parse(e.newValue));
      } catch {}
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [store._setGames, store._setLogs, store._setFinals, store._setChampions]);

  return store;
}
