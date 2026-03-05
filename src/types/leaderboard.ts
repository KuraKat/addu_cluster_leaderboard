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
  showTopOnly?: boolean; // if true, only show top 5 clusters, otherwise show all
  showTop3?: boolean; // if true, only show top 3 clusters, otherwise show all
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

// Cluster Team System Types
export interface ClusterTeam {
  id: string;
  name: string;
  clusters: ClusterName[]; // 1-4 clusters per team
  isActive: boolean;
  totalScore: number;
  wins: number;
  losses: number;
}

export interface ClusterTeamMatch {
  id: string;
  teamA: string; // ClusterTeam ID
  teamB: string; // ClusterTeam ID
  eventTitle: string;
  winningPoints: number;
  losingPoints: number;
  isActive: boolean;
  winner?: "A" | "B"; // undefined = not decided yet
  timestamp: number;
  archived?: boolean;
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

export interface TeamGame {
  id: string;
  name: string;
  teams: ClusterName[]; // Array of cluster names participating in this team game
  scores: Record<string, number>; // Cluster name -> score mapping
  retired: boolean;
  top3: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
