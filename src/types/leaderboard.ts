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
  Salamanca:  { color: "text-orange-500", bgColor: "bg-orange-500", borderColor: "border-orange-500", logo: "/logos/salamanca.png" },
  Manresa:    { color: "text-purple-500", bgColor: "bg-purple-500", borderColor: "border-purple-500", logo: "/logos/manresa.png" },
  Jerusalem:  { color: "text-green-500",  bgColor: "bg-green-500",  borderColor: "border-green-500",  logo: "/logos/jerusalem.png" },
  Paris:      { color: "text-red-500",    bgColor: "bg-red-500",    borderColor: "border-red-500",    logo: "/logos/paris.png" },
  Rome:       { color: "text-pink-500",   bgColor: "bg-pink-500",   borderColor: "border-pink-500",   logo: "/logos/rome.png" },
  Montserrat: { color: "text-yellow-500", bgColor: "bg-yellow-500", borderColor: "border-yellow-500", logo: "/logos/montserrat.png" },
  Pamplona:   { color: "text-blue-500",   bgColor: "bg-blue-500",   borderColor: "border-blue-500",   logo: "/logos/pamplona.png" },
  Barcelona:  { color: "text-cyan-500",   bgColor: "bg-cyan-500",   borderColor: "border-cyan-500",   logo: "/logos/barcelona.png" },
};

export interface Game {
  id: string;
  name: string;
  scores: Record<ClusterName, number>;
  retired?: boolean; // retired games still count in overall but don't show individual slides
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
}

export interface Champion {
  gameId: string;
  gameName: string;
  cluster: ClusterName;
  score: number;
  timestamp: number;
}
