import { Game, UnifiedTeamGame, GrandFinalsMatch, AdminLog } from './leaderboard';
import { ClusterName } from './leaderboard';

export interface GamesTabProps {
  games: {
    all: Game[];
    active: Game[];
    retired: Game[];
  };
  teamGames: {
    all: UnifiedTeamGame[];
    active: UnifiedTeamGame[];
    retired: UnifiedTeamGame[];
  };
  incrementMode: boolean;
  incrementAmount: number;
  newGameName: string;
  onNewGameNameChange: (value: string) => void;
  onIncrementModeChange: (value: boolean) => void;
  onIncrementAmountChange: (value: number) => void;
  onAddGame: () => void;
  onAddTeamGame: (title: string, teams: { name: string; clusters: ClusterName[] }[]) => void;
  onUpdateScore: (gameId: string, cluster: ClusterName, score: number) => Promise<void>;
  onUpdateTeamGameScore: (gameId: string, teamName: string, points: number) => Promise<void>;
  onRetireGame: (gameId: string) => Promise<void>;
  onUnretireGame: (gameId: string) => Promise<void>;
  onRemoveGame: (gameId: string) => Promise<void>;
  onRetireUnifiedGame: (gameId: string) => Promise<void>;
  onArchiveUnifiedGame: (gameId: string) => Promise<void>;
  onUnretireTeamGame: (gameId: string) => Promise<void>;
  onIncrement: (gameId: string, cluster: ClusterName) => void;
  onDecrement: (gameId: string, cluster: ClusterName) => void;
  onTeamGameIncrement: (teamGameId: string, team: string) => void;
  onTeamGameDecrement: (teamGameId: string, team: string) => void;
  onTop5Toggle: (gameId: string, checked: boolean) => void;
  onTop3Toggle: (gameId: string, checked: boolean) => void;
  onTeamGameTop3Toggle: (teamGameId: string, checked: boolean) => void;
  onTeamGameTop5Toggle: (teamGameId: string, checked: boolean) => void;
}

export interface LogsTabProps {
  adminLogs: AdminLog[];
  games: {
    all: Game[];
    active: Game[];
    retired: Game[];
  };
  teamGames: {
    all: UnifiedTeamGame[];
    active: UnifiedTeamGame[];
    retired: UnifiedTeamGame[];
  };
  refreshLogs: () => Promise<void>;
  onUpdateScore: (gameId: string, cluster: string, score: number) => Promise<void>;
  onSetMatchWinner: (matchId: string, winnerTeamName: string) => Promise<void>;
  onUpdateGameVisibility: (gameId: string, showTop5: boolean) => Promise<void>;
  onUpdateGameTop3: (gameId: string, showTop3: boolean) => Promise<void>;
}

export interface GrandFinalsTabProps {
  grandFinals: {
    all: GrandFinalsMatch[];
    active: GrandFinalsMatch[];
    archived: GrandFinalsMatch[];
  };
  newFinalsTitle: string;
  newFinalsA: ClusterName;
  newFinalsB: ClusterName;
  onNewFinalsTitleChange: (value: string) => void;
  onNewFinalsAChange: (value: ClusterName) => void;
  onNewFinalsBChange: (value: ClusterName) => void;
  onAddFinals: () => void;
  onUpdateGrandFinals: (finalId: string, updates: Partial<GrandFinalsMatch>) => Promise<void>;
  onArchiveGrandFinals: (finalId: string) => Promise<void>;
  onUnarchiveGrandFinals: (finalId: string) => Promise<void>;
  onRemoveGrandFinals: (finalId: string) => Promise<void>;
}

export interface TeamsTabProps {
  teamGames: {
    all: UnifiedTeamGame[];
    active: UnifiedTeamGame[];
    retired: UnifiedTeamGame[];
  };
  onRemoveTeamGame: (teamGameId: string) => Promise<void>;
}

export interface TeamMatchesTabProps {
  teamGames: {
    all: UnifiedTeamGame[];
    active: UnifiedTeamGame[];
    retired: UnifiedTeamGame[];
  };
  clusterTeamMatches: {
    active: UnifiedTeamGame[];
    archived: UnifiedTeamGame[];
  };
  newMatchTitle: string;
  newMatchTeamA: string;
  newMatchTeamB: string;
  newMatchWinningPoints: number;
  newMatchLosingPoints: number;
  onNewMatchTitleChange: (value: string) => void;
  onNewMatchTeamAChange: (value: string) => void;
  onNewMatchTeamBChange: (value: string) => void;
  onNewMatchWinningPointsChange: (value: number) => void;
  onNewMatchLosingPointsChange: (value: number) => void;
  onAddTeamMatch: () => void;
  onCreateVersusMatch: (title: string, teamA: { name: string; clusters: ClusterName[] }, teamB: { name: string; clusters: ClusterName[] }) => void;
  onSetMatchWinner: (matchId: string, winnerTeamName: string) => Promise<void>;
  onUndoMatchWinner: (matchId: string) => Promise<void>;
  onArchiveClusterTeamMatch: (matchId: string) => Promise<void>;
  onUnarchiveClusterTeamMatch: (matchId: string) => Promise<void>;
  onDeleteClusterTeamMatch: (matchId: string) => Promise<void>;
}
