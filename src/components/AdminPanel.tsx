import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFirestoreData } from "@/hooks/useFirestoreData";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import { useAdminData } from "@/hooks/useAdminData";
import { useAuth } from "@/hooks/useAuth";
import { X, Settings } from "lucide-react";
import { ALL_CLUSTERS, ClusterName } from "@/types/leaderboard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  GamesTab, 
  GrandFinalsTab, 
  TeamsTab, 
  TeamMatchesTab, 
  TalliedPointsTab, 
  LogsTab, 
  MiscTab 
} from "./AdminPanel/index";

export default function AdminPanel() {
  const { logout } = useAuth();
  const { adminData, getClusterLogoPath } = useLeaderboardData();
  const { adminLogs, refreshLogs } = useAdminData();
  const { 
    vignetteSettings, 
    updateVignetteSettings,
    updateScore, addGame, removeGame, retireGame, unretireGame, updateGameVisibility, updateGameTop3,
    addGrandFinals, removeGrandFinals, updateGrandFinals, archiveGrandFinals, unarchiveGrandFinals,
    slideDuration, updateSlideDuration, advancedSlideTiming, updateAdvancedSlideTiming,
    createTeamGame, createVersusMatch, setMatchWinner, updateTeamGameScore, archiveGame: archiveUnifiedGame, deleteUnifiedGame, updateUnifiedGameStatus,
    unretireTeamGame, updateTeamGameVisibility, updateTeamGameTop3,
  } = useFirestoreData();
  
  const { games, grandFinals, teamGames, clusterTeamMatches, champions } = adminData;

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"games" | "finals" | "teams" | "teamMatches" | "talliedPoints" | "logs" | "misc">("games");
  
  // Games Tab State
  const [newGameName, setNewGameName] = useState("");
  const [incrementMode, setIncrementMode] = useState(false);
  const [incrementAmount, setIncrementAmount] = useState(1);

  // Grand Finals Tab State
  const [newFinalsTitle, setNewFinalsTitle] = useState("");
  const [newFinalsA, setNewFinalsA] = useState<ClusterName>("Salamanca");
  const [newFinalsB, setNewFinalsB] = useState<ClusterName>("Barcelona");

  // Teams Tab State (no longer needed - using unified system)

  // Team Matches Tab State
  const [newMatchTitle, setNewMatchTitle] = useState("");
  const [newMatchTeamA, setNewMatchTeamA] = useState("");
  const [newMatchTeamB, setNewMatchTeamB] = useState("");
  const [newMatchWinningPoints, setNewMatchWinningPoints] = useState(10);
  const [newMatchLosingPoints, setNewMatchLosingPoints] = useState(5);

  // State for team creation in TeamMatchesTab
  const [createdTeams, setCreatedTeams] = useState<{ name: string; clusters: ClusterName[] }[]>([]);

  // Games Tab Handlers
  const handleAddGame = () => {
    if (newGameName.trim()) { addGame(newGameName.trim()); setNewGameName(""); }
  };

  const handleAddTeamGame = (title: string, teams: { name: string; clusters: ClusterName[] }[]) => {
    // This function now receives the title and teams directly from GamesTab
    createTeamGame(title, teams);
  };

  const handleIncrement = (gameId: string, cluster: ClusterName) => {
    const game = games.all.find(g => g.id === gameId);
    if (game) {
      updateScore(gameId, cluster, game.scores[cluster] + incrementAmount);
    }
  };

  const handleDecrement = (gameId: string, cluster: ClusterName) => {
    const game = games.all.find(g => g.id === gameId);
    if (game) {
      updateScore(gameId, cluster, Math.max(0, game.scores[cluster] - incrementAmount));
    }
  };

  const handleTeamGameIncrement = (teamGameId: string, team: string) => {
    const teamGame = teamGames.all.find(tg => tg.id === teamGameId);
    if (teamGame) {
      const currentTeam = teamGame.teams.find(t => t.name === team);
      const currentPoints = currentTeam?.points || 0;
      updateTeamGameScore(teamGameId, team, currentPoints + incrementAmount);
    }
  };

  const handleTeamGameDecrement = (teamGameId: string, team: string) => {
    const teamGame = teamGames.all.find(tg => tg.id === teamGameId);
    if (teamGame) {
      const currentTeam = teamGame.teams.find(t => t.name === team);
      const currentPoints = currentTeam?.points || 0;
      updateTeamGameScore(teamGameId, team, Math.max(0, currentPoints - incrementAmount));
    }
  };

  const handleTop5Toggle = (gameId: string, checked: boolean) => {
    if (checked) {
      updateGameVisibility(gameId, true);
      updateGameTop3(gameId, false);
    } else {
      updateGameVisibility(gameId, false);
    }
  };

  const handleTop3Toggle = (gameId: string, checked: boolean) => {
    if (checked) {
      updateGameTop3(gameId, true);
      updateGameVisibility(gameId, false);
    } else {
      updateGameTop3(gameId, false);
    }
  };

  const handleTeamGameTop3Toggle = (teamGameId: string, checked: boolean) => {
    if (checked) {
      updateTeamGameTop3(teamGameId, true);
    } else {
      updateTeamGameTop3(teamGameId, false);
    }
  };

  const handleTeamGameTop5Toggle = (teamGameId: string, checked: boolean) => {
    if (checked) {
      updateTeamGameVisibility(teamGameId, true);
    } else {
      updateTeamGameVisibility(teamGameId, false);
    }
  };

  // Grand Finals Tab Handlers
  const handleAddFinals = () => {
    if (newFinalsTitle.trim()) {
      addGrandFinals(newFinalsTitle.trim(), newFinalsA, newFinalsB);
      setNewFinalsTitle("");
    }
  };

  // Versus Match Creation Handler (uses unified system)
  const handleCreateVersusMatch = (title: string, teamA: { name: string; clusters: ClusterName[] }, teamB: { name: string; clusters: ClusterName[] }) => {
    createVersusMatch(title, teamA, teamB, newMatchWinningPoints, newMatchLosingPoints);
  };

  // Team Match Handler (uses unified system)
  const handleAddTeamMatch = () => {
    // Use the current state values with unified system
    if (newMatchTitle.trim() && newMatchTeamA.trim() && newMatchTeamB.trim()) {
      const unifiedTeamA = { name: newMatchTeamA, clusters: [] };
      const unifiedTeamB = { name: newMatchTeamB, clusters: [] };
      createVersusMatch(newMatchTitle, unifiedTeamA, unifiedTeamB, newMatchWinningPoints, newMatchLosingPoints);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-14 right-4 z-[100] w-10 h-10 rounded-full bg-secondary/50 hover:bg-secondary flex items-center justify-center opacity-20 hover:opacity-100 transition-opacity"
        aria-label="Admin"
      >
        <Settings className="w-4 h-4 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[101] bg-background/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-[102] w-full max-w-2xl bg-card border-l border-border overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-bold text-foreground">Admin Panel</h2>
                  <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                  {(["games", "finals", "teams", "teamMatches", "talliedPoints", "logs", "misc"] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg font-body text-sm font-medium transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                      {t === "games" ? "Games" : t === "finals" ? "Grand Finals" : t === "teams" ? "Teams" : t === "teamMatches" ? "Team Matches" : t === "talliedPoints" ? "Tallied Points" : t === "logs" ? "Logs" : "Misc"}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {tab === "games" && (
                  <GamesTab
                    games={games}
                    teamGames={teamGames}
                    incrementMode={incrementMode}
                    incrementAmount={incrementAmount}
                    newGameName={newGameName}
                    onNewGameNameChange={setNewGameName}
                    onIncrementModeChange={setIncrementMode}
                    onIncrementAmountChange={setIncrementAmount}
                    onAddGame={handleAddGame}
                    onAddTeamGame={handleAddTeamGame}
                    onUpdateScore={updateScore}
                    onUpdateTeamGameScore={updateTeamGameScore}
                    onRetireGame={retireGame}
                    onUnretireGame={unretireGame}
                    onRemoveGame={removeGame}
                    onRetireUnifiedGame={archiveUnifiedGame}
                    onArchiveUnifiedGame={archiveUnifiedGame}
                    onUnretireTeamGame={unretireTeamGame}
                    onIncrement={handleIncrement}
                    onDecrement={handleDecrement}
                    onTeamGameIncrement={handleTeamGameIncrement}
                    onTeamGameDecrement={handleTeamGameDecrement}
                    onTop5Toggle={handleTop5Toggle}
                    onTop3Toggle={handleTop3Toggle}
                    onTeamGameTop3Toggle={handleTeamGameTop3Toggle}
                    onTeamGameTop5Toggle={handleTeamGameTop5Toggle}
                  />
                )}

                {tab === "finals" && (
                  <GrandFinalsTab
                    grandFinals={grandFinals}
                    newFinalsTitle={newFinalsTitle}
                    newFinalsA={newFinalsA}
                    newFinalsB={newFinalsB}
                    onNewFinalsTitleChange={setNewFinalsTitle}
                    onNewFinalsAChange={setNewFinalsA}
                    onNewFinalsBChange={setNewFinalsB}
                    onAddFinals={handleAddFinals}
                    onUpdateGrandFinals={updateGrandFinals}
                    onArchiveGrandFinals={archiveGrandFinals}
                    onUnarchiveGrandFinals={unarchiveGrandFinals}
                    onRemoveGrandFinals={removeGrandFinals}
                  />
                )}

                {tab === "teams" && (
                  <TeamsTab
                    teamGames={teamGames}
                    onRemoveTeamGame={deleteUnifiedGame}
                  />
                )}

                {tab === "teamMatches" && (
                  <TeamMatchesTab
                    teamGames={teamGames}
                    clusterTeamMatches={clusterTeamMatches}
                    newMatchTitle={newMatchTitle}
                    newMatchTeamA={newMatchTeamA}
                    newMatchTeamB={newMatchTeamB}
                    newMatchWinningPoints={newMatchWinningPoints}
                    newMatchLosingPoints={newMatchLosingPoints}
                    onNewMatchTitleChange={setNewMatchTitle}
                    onNewMatchTeamAChange={setNewMatchTeamA}
                    onNewMatchTeamBChange={setNewMatchTeamB}
                    onNewMatchWinningPointsChange={setNewMatchWinningPoints}
                    onNewMatchLosingPointsChange={setNewMatchLosingPoints}
                    onAddTeamMatch={handleAddTeamMatch}
                    onSetMatchWinner={setMatchWinner}
                    onArchiveUnifiedGame={archiveUnifiedGame}
                    onDeleteUnifiedGame={deleteUnifiedGame}
                    onUpdateMatchStatus={updateUnifiedGameStatus}
                    onCreateVersusMatch={handleCreateVersusMatch}
                  />
                )}

                {tab === "talliedPoints" && (
                  <TalliedPointsTab
                    games={games}
                    teamGames={teamGames}
                    grandFinals={grandFinals}
                    clusterTeams={clusterTeamMatches}
                    getClusterLogoPath={getClusterLogoPath}
                  />
                )}

                {tab === "logs" && (
                  <LogsTab
                    adminLogs={adminLogs}
                    games={games}
                    teamGames={teamGames}
                    refreshLogs={refreshLogs}
                    onUpdateScore={updateScore}
                    onSetMatchWinner={setMatchWinner}
                    onUpdateGameVisibility={updateGameVisibility}
                    onUpdateGameTop3={updateGameTop3}
                  />
                )}

                {tab === "misc" && (
                  <MiscTab
                    vignetteSettings={vignetteSettings}
                    slideDuration={slideDuration}
                    advancedSlideTiming={advancedSlideTiming}
                    onUpdateVignetteSettings={updateVignetteSettings}
                    onUpdateSlideDuration={updateSlideDuration}
                    onUpdateAdvancedSlideTiming={updateAdvancedSlideTiming}
                    onLogout={logout}
                  />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
