import { Timestamp } from "firebase/firestore";

export type ClusterName =
  | "Salamanca"
  | "Manresa"
  | "Jerusalem"
  | "Paris"
  | "Rome"
  | "Montserrat"
  | "Pamplona"
  | "Barcelona";

export const ALL_CLUSTERS: ClusterName[] = [
  "Salamanca", "Manresa", "Jerusalem", "Paris",
  "Rome", "Montserrat", "Pamplona", "Barcelona",
];

export interface ClusterConfig {
  color: string;
  bgColor: string;
  borderColor: string;
  logo: string;
}

export const CLUSTER_CONFIG: Record<ClusterName, ClusterConfig> = {
  Salamanca:  { color: "text-orange-500", bgColor: "bg-orange-500", borderColor: "border-orange-500", logo: "/assets/cluster_logos/salamanca.jpg" },
  Manresa:    { color: "text-purple-500", bgColor: "bg-purple-500", borderColor: "border-purple-500", logo: "/assets/cluster_logos/manresa.jpg" },
  Jerusalem:  { color: "text-green-500",  bgColor: "bg-green-500",  borderColor: "border-green-500",  logo: "/assets/cluster_logos/jerusalem.jpg" },
  Paris:      { color: "text-red-500",    bgColor: "bg-red-500",    borderColor: "border-red-500",    logo: "/assets/cluster_logos/paris.jpg" },
  Rome:       { color: "text-pink-500",   bgColor: "bg-pink-500",   borderColor: "border-pink-500",   logo: "/assets/cluster_logos/rome.jpg" },
  Montserrat: { color: "text-yellow-500", bgColor: "bg-yellow-500", borderColor: "border-yellow-500", logo: "/assets/cluster_logos/montserrat.jpg" },
  Pamplona:   { color: "text-blue-500",   bgColor: "bg-blue-500",   borderColor: "border-blue-500",   logo: "/assets/cluster_logos/pamplona.jpg" },
  Barcelona:  { color: "text-cyan-500",   bgColor: "bg-cyan-500",   borderColor: "border-cyan-500",   logo: "/assets/cluster_logos/barcelona.jpg" },
};

export interface Game {
  id: string;
  name: string;
  scores: Record<ClusterName, number>;
  retired?: boolean; // retired games still count in overall but don't show individual slides
  archived?: boolean; // archived games are completely hidden
  showTop5?: boolean; // if true, only show top 5 teams, otherwise show all
  showTop3?: boolean; // if true, only show top 3 teams, otherwise show all
}

export interface OverallScore {
  cluster: ClusterName;
  totalScore: number;
}

export interface PointLog {
  id: string;
  timestamp: number;
  gameId: string;
  gameName: string;
  cluster: ClusterName;
  pointsAdded: number;
}

export interface GrandFinalsMatch {
  id: string;
  isActive: boolean;
  eventTitle: string;
  clusterA: ClusterName;
  clusterB: ClusterName;
  betsA: number;
  betsB: number;
  votingEnabled?: boolean; // if true, voting buttons are shown, default false
  archived?: boolean; // if true, match is archived and doesn't show in active list
}

export interface Champion {
  gameId: string;
  gameName: string;
  cluster: ClusterName;
  score: number;
  timestamp: number;
}

export interface PendingChange {
  id: string;
  type: "score" | "game" | "finals" | "teamMatch" | "settings";
  action: "create" | "update" | "delete" | "retire" | "archive";
  data: any; // The change data
  adminEmail: string;
  adminName: string;
  timestamp: number;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: number;
}

export interface AdminLog {
  id: string;
  adminEmail: string;
  adminName: string;
  action: string;
  details: string;
  timestamp: number;
  approved: boolean;
}

export interface AdvancedSlideTiming {
  overallStanding: number;
  games: number;
  hallOfChampions: number;
  grandFinals: number;
  clusterTeamMatches: number;
  useAdvanced: boolean; // Master switch for advanced timing
}

export interface VignetteSettings {
  enabled: boolean;
  radius: number; // 0-200, where 0 is smallest (strongest) and 200 is largest (weakest)
  strength: number; // 0-200, where 0 is no vignette and 200 is maximum strength
}


// NEW: Unified Team Game Document (replaces separate matches/games)
export interface UnifiedTeamGame {
id: string;
title: string;          // e.g., "Tug of War" or "Red vs Blue"
isTeamGame: boolean;    // If true -> Use TeamGamesSlide
isVersus: boolean;      // If true -> Use ClusterTeamMatchSlide

// Only populated if isVersus == true
pointsVersus?: {
  winner_points: number;
  loser_points: number;
};

// Dynamic Array of Teams (Supports 2 for Versus, or 3+ for Team Games)
teams: {
  name: string;         // e.g., "Team A" or "Red Jaguars"
  clusters: string[];   // ["Salamanca", "Manresa"]
  points: number;       // Manual if isTeamGame, Auto if isVersus
  isActive: boolean;    
  isWinner: boolean;    // Default false, used if isVersus
}[];

status: "active" | "archived" | "retired";
createdAt: Timestamp;
updatedAt: Timestamp;
}
