import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFirestoreData } from "@/hooks/useFirestoreData";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import { useAuth } from "@/hooks/useAuth";
import { X, Settings, Plus, Trash2, Archive, History, LogOut, Users, Trophy, TrendingUp } from "lucide-react";
import { ALL_CLUSTERS, ClusterName } from "@/types/leaderboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Controlled Input Component to avoid hooks violations
function ControlledInput({ value, onChange, type = "text", disabled = false, ...props }: {
  value: string | number;
  onChange: (value: string | number) => void;
  type?: string;
  disabled?: boolean;
  [key: string]: any;
}) {
  const [tempValue, setTempValue] = useState(value.toString());

  useEffect(() => {
    setTempValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    setTempValue(e.target.value);
  };

  const handleBlur = () => {
    if (disabled) return;
    if (type === "number") {
      const numValue = Number(tempValue) || 0;
      if (numValue !== Number(value)) {
        onChange(numValue);
      }
    } else {
      if (tempValue !== value) {
        onChange(tempValue);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'Enter') {
      if (type === "number") {
        const numValue = Number(tempValue) || 0;
        if (numValue !== Number(value)) {
          onChange(numValue);
        }
      } else {
        if (tempValue !== value) {
          onChange(tempValue);
        }
      }
    }
  };

  return (
    <Input
      {...props}
      value={tempValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled}
    />
  );
}

export default function AdminPanel() {
  const { logout } = useAuth();
  const { adminData, getClusterLogoPath } = useLeaderboardData();
  const {
    updateScore, addGame, removeGame, retireGame, unretireGame, updateGameVisibility, updateGameTop3,
    addGrandFinals, removeGrandFinals, updateGrandFinals, archiveGrandFinals, unarchiveGrandFinals,
    slideDuration, updateSlideDuration, advancedSlideTiming, updateAdvancedSlideTiming,
    addClusterTeam, updateClusterTeam, removeClusterTeam,
    addClusterTeamMatch, updateClusterTeamMatch, deleteClusterTeamMatch, setMatchWinner, undoMatchWinner,
  } = useFirestoreData();
  
  const { games, grandFinals, clusterTeams, clusterTeamMatches, champions, adminLogs } = adminData;

  const [open, setOpen] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [newFinalsTitle, setNewFinalsTitle] = useState("");
  const [newFinalsA, setNewFinalsA] = useState<ClusterName>("Salamanca");
  const [newFinalsB, setNewFinalsB] = useState<ClusterName>("Barcelona");
  const [tab, setTab] = useState<"games" | "finals" | "teams" | "teamMatches" | "talliedPoints" | "logs" | "misc">("games");
  const [incrementMode, setIncrementMode] = useState(false);
  const [incrementAmount, setIncrementAmount] = useState(1);

  // Cluster Team System state
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedClusters, setSelectedClusters] = useState<ClusterName[]>([]);
  const [newMatchTitle, setNewMatchTitle] = useState("");
  const [newMatchTeamA, setNewMatchTeamA] = useState("");
  const [newMatchTeamB, setNewMatchTeamB] = useState("");
  const [newMatchWinningPoints, setNewMatchWinningPoints] = useState(10);
  const [newMatchLosingPoints, setNewMatchLosingPoints] = useState(5);

  const handleTop5Toggle = (gameId: string, checked: boolean) => {
    if (checked) {
      // Enable top 5, disable top 3
      updateGameVisibility(gameId, true);
      updateGameTop3(gameId, false);
    } else {
      // Disable top 5
      updateGameVisibility(gameId, false);
    }
  };

  const handleTop3Toggle = (gameId: string, checked: boolean) => {
    if (checked) {
      // Enable top 3, disable top 5
      updateGameTop3(gameId, true);
      updateGameVisibility(gameId, false);
    } else {
      // Disable top 3
      updateGameTop3(gameId, false);
    }
  };

  const handleAddGame = () => {
    if (newGameName.trim()) { addGame(newGameName.trim()); setNewGameName(""); }
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

  const handleAddFinals = () => {
    if (newFinalsTitle.trim()) {
      addGrandFinals(newFinalsTitle.trim(), newFinalsA, newFinalsB);
      setNewFinalsTitle("");
    }
  };

  // Cluster Team handlers
  const handleAddClusterTeam = () => {
    if (newTeamName.trim() && selectedClusters.length > 0) {
      addClusterTeam({
        name: newTeamName.trim(),
        clusters: selectedClusters,
        isActive: true,
        totalScore: 0,
        wins: 0,
        losses: 0
      });
      setNewTeamName("");
      setSelectedClusters([]);
    }
  };

  const handleClusterToggle = (cluster: ClusterName) => {
    setSelectedClusters(prev => 
      prev.includes(cluster) 
        ? prev.filter(c => c !== cluster)
        : [...prev, cluster].slice(0, 4) // Max 4 clusters
    );
  };

  const handleAddTeamMatch = () => {
    if (newMatchTitle.trim() && newMatchTeamA && newMatchTeamB) {
      addClusterTeamMatch({
        teamA: newMatchTeamA,
        teamB: newMatchTeamB,
        eventTitle: newMatchTitle.trim(),
        winningPoints: newMatchWinningPoints,
        losingPoints: newMatchLosingPoints,
        isActive: true,
        timestamp: Date.now()
      });
      setNewMatchTitle("");
      setNewMatchTeamA("");
      setNewMatchTeamB("");
    }
  };

  const activeGames = games.active;
  const retiredGames = games.retired;
  const activeFinals = grandFinals.active;
  const archivedFinals = grandFinals.archived;

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

                {/* Increment Mode Toggle - Only show for Games tab */}
                {tab === "games" && (
                  <div className="flex items-center justify-between mb-6 p-4 bg-muted/30 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-foreground">Increment Mode</span>
                      <p className="text-xs text-muted-foreground">Enable increment/decrement buttons for scores</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {incrementMode && (
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-muted-foreground">Increment:</label>
                          <Input 
                            type="number" 
                            min={1} 
                            max={100} 
                            value={incrementAmount} 
                            onChange={(e) => setIncrementAmount(Number(e.target.value) || 1)} 
                            className="bg-background border-border h-8 w-20 text-sm" 
                          />
                        </div>
                      )}
                      <Switch checked={incrementMode} onCheckedChange={setIncrementMode} />
                    </div>
                  </div>
                )}

                {/* Games Tab */}
                {tab === "games" && (
                  <>
                    <div className="flex gap-2 mb-6">
                      <Input value={newGameName} onChange={(e) => setNewGameName(e.target.value)} placeholder="New game name..." className="bg-muted border-border" onKeyDown={(e) => e.key === "Enter" && handleAddGame()} />
                      <Button onClick={handleAddGame} size="sm" className="bg-primary text-primary-foreground"><Plus className="w-4 h-4" /></Button>
                    </div>

                    {/* Active Games */}
                    <div className="space-y-6">
                      {activeGames.map((game) => (
                        <div key={game.id} className="glass-surface rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-body text-lg font-semibold text-foreground">{game.name}</h3>
                            <div className="flex gap-2">
                              <button onClick={() => retireGame(game.id)} className="text-muted-foreground hover:text-yellow-500 transition-colors" title="Retire event">
                                <Archive className="w-4 h-4" />
                              </button>
                              <button onClick={() => removeGame(game.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-base text-muted-foreground">Show top 5 only</span>
                            <Switch checked={game.showTopOnly} onCheckedChange={(checked) => handleTop5Toggle(game.id, checked)} />
                          </div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-base text-muted-foreground">Show top 3 only</span>
                            <Switch checked={game.showTop3} onCheckedChange={(checked) => handleTop3Toggle(game.id, checked)} />
                          </div>
                          <div className="grid gap-4 grid-cols-2">
                            {ALL_CLUSTERS.map((cluster) => (
                              <div key={cluster} className="space-y-3">
                                <label className="text-base text-muted-foreground block text-center">{cluster}</label>
                                <ControlledInput 
                                  type="number" 
                                  min={0} 
                                  value={game.scores[cluster]}
                                  onChange={(newValue: number) => updateScore(game.id, cluster, newValue)}
                                  className="bg-muted border-border h-10 text-base w-full" 
                                />
                                {incrementMode && (
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => handleDecrement(game.id, cluster)} 
                                      className="flex-1 h-8 rounded bg-red-500/20 hover:bg-red-500/30 text-red-500 flex items-center justify-center text-base font-bold transition-colors"
                                      title={`Decrease by ${incrementAmount}`}
                                    >
                                      -
                                    </button>
                                    <button 
                                      onClick={() => handleIncrement(game.id, cluster)} 
                                      className="flex-1 h-8 rounded bg-green-500/20 hover:bg-green-500/30 text-green-500 flex items-center justify-center text-base font-bold transition-colors"
                                      title={`Increase by ${incrementAmount}`}
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Retired Games */}
                    {retiredGames.length > 0 && (
                      <>
                        <h3 className="font-display text-sm font-bold text-muted-foreground mt-8 mb-4 tracking-wider">RETIRED EVENTS</h3>
                        <div className="space-y-3">
                          {retiredGames.map((game) => (
                            <div key={game.id} className="glass-surface rounded-lg px-4 py-3 flex items-center justify-between opacity-70">
                              <span className="font-body text-sm text-foreground">{game.name}</span>
                              <div className="flex gap-2">
                                <button onClick={() => unretireGame(game.id)} className="text-muted-foreground hover:text-green-500 transition-colors" title="Reactivate">
                                  <Archive className="w-4 h-4" />
                                </button>
                                <button onClick={() => removeGame(game.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete permanently">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Grand Finals Tab */}
                {tab === "finals" && (
                  <div className="space-y-6">
                    {/* Add new */}
                    <div className="glass-surface rounded-lg p-4 space-y-3">
                      <h3 className="font-body text-sm font-semibold text-foreground">Add Grand Finals</h3>
                      <Input 
                        value={newFinalsTitle} 
                        onChange={(e) => setNewFinalsTitle(e.target.value)} 
                        placeholder="Event title..." 
                        className="bg-muted border-border" 
                        onKeyDown={(e) => e.key === 'Enter' && handleAddFinals()}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Select value={newFinalsA} onValueChange={(v) => setNewFinalsA(v as ClusterName)}>
                          <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                          <SelectContent className="z-[200]">{ALL_CLUSTERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={newFinalsB} onValueChange={(v) => setNewFinalsB(v as ClusterName)}>
                          <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                          <SelectContent className="z-[200]">{ALL_CLUSTERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleAddFinals} size="sm" className="bg-primary text-primary-foreground w-full"><Plus className="w-4 h-4 mr-2" /> Add Match</Button>
                    </div>

                    {/* Existing matches */}
                    {activeFinals.map((match) => (
                      <div key={match.id} className="glass-surface rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Input value={match.eventTitle} onChange={(e) => updateGrandFinals(match.id, { eventTitle: e.target.value })} className="bg-muted border-border font-bold" />
                          <div className="flex gap-2">
                            <button onClick={() => archiveGrandFinals(match.id)} className="text-muted-foreground hover:text-yellow-500 transition-colors" title="Archive">
                              <Archive className="w-4 h-4" />
                            </button>
                            <button onClick={() => removeGrandFinals(match.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Active in slides</span>
                          <Switch checked={match.isActive} onCheckedChange={(checked) => updateGrandFinals(match.id, { isActive: checked })} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Voting enabled</span>
                          <Switch checked={match.votingEnabled} onCheckedChange={(checked) => updateGrandFinals(match.id, { votingEnabled: checked })} />
                        </div>
                        {match.votingEnabled && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground">Votes A</label>
                              <ControlledInput 
                                type="number" 
                                min={0} 
                                value={match.betsA}
                                onChange={(newValue: number) => updateGrandFinals(match.id, { betsA: newValue })}
                                className="bg-muted border-border" 
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Votes B</label>
                              <ControlledInput 
                                type="number" 
                                min={0} 
                                value={match.betsB}
                                onChange={(newValue: number) => updateGrandFinals(match.id, { betsB: newValue })}
                                className="bg-muted border-border" 
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Archived matches */}
                    {archivedFinals.length > 0 && (
                      <>
                        <h3 className="font-body text-sm font-semibold text-muted-foreground mt-6">Archived Matches</h3>
                        {archivedFinals.map((match) => (
                          <div key={match.id} className="glass-surface rounded-lg p-4 space-y-3 opacity-60">
                            <div className="flex items-center justify-between">
                              <Input value={match.eventTitle} onChange={(e) => updateGrandFinals(match.id, { eventTitle: e.target.value })} className="bg-muted border-border font-bold" />
                              <div className="flex gap-2">
                                <button onClick={() => unarchiveGrandFinals(match.id)} className="text-muted-foreground hover:text-green-500 transition-colors" title="Unarchive">
                                  <Archive className="w-4 h-4" />
                                </button>
                                <button onClick={() => removeGrandFinals(match.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">Archived - not shown in slides</div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* Teams Tab */}
                {tab === "teams" && (
                  <div className="space-y-6">
                    {/* Add new team */}
                    <div className="glass-surface rounded-lg p-4 space-y-3">
                      <h3 className="font-body text-sm font-semibold text-foreground">Add Cluster Team</h3>
                      <Input 
                        value={newTeamName} 
                        onChange={(e) => setNewTeamName(e.target.value)} 
                        placeholder="Team name..." 
                        className="bg-muted border-border" 
                      />
                      <div>
                        <label className="text-xs text-muted-foreground mb-2 block">Select Clusters (max 4)</label>
                        <div className="grid grid-cols-4 gap-2">
                          {ALL_CLUSTERS.map((cluster) => (
                            <button
                              key={cluster}
                              onClick={() => handleClusterToggle(cluster)}
                              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                selectedClusters.includes(cluster)
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {cluster}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Button 
                        onClick={handleAddClusterTeam} 
                        size="sm" 
                        className="bg-primary text-primary-foreground w-full"
                        disabled={!newTeamName.trim() || selectedClusters.length === 0}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Add Team
                      </Button>
                    </div>

                    {/* Existing teams */}
                    {clusterTeams.map((team) => (
                      <div key={team.id} className="glass-surface rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-body text-lg font-semibold text-foreground">{team.name}</h3>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => removeClusterTeam(team.id)} 
                              className="text-muted-foreground hover:text-destructive transition-colors" 
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {team.clusters.map((cluster) => (
                            <div 
                              key={cluster}
                              className={`px-2 py-1 rounded text-xs font-medium bg-primary/20 text-primary`}
                            >
                              {cluster}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-blue-400">{team.totalScore}</div>
                            <div className="text-muted-foreground">Total Score</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Team Matches Tab */}
                {tab === "teamMatches" && (
                  <div className="space-y-6">
                    {/* Add new match */}
                    <div className="glass-surface rounded-lg p-4 space-y-3">
                      <h3 className="font-body text-sm font-semibold text-foreground">Add Team Match</h3>
                      <Input 
                        value={newMatchTitle} 
                        onChange={(e) => setNewMatchTitle(e.target.value)} 
                        placeholder="Match title..." 
                        className="bg-muted border-border" 
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Select value={newMatchTeamA} onValueChange={setNewMatchTeamA}>
                          <SelectTrigger className="bg-muted border-border">
                            <SelectValue placeholder="Team A" />
                          </SelectTrigger>
                          <SelectContent className="z-[200]">
                            {clusterTeams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={newMatchTeamB} onValueChange={setNewMatchTeamB}>
                          <SelectTrigger className="bg-muted border-border">
                            <SelectValue placeholder="Team B" />
                          </SelectTrigger>
                          <SelectContent className="z-[200]">
                            {clusterTeams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground">Winning Points</label>
                          <Input 
                            type="number" 
                            min={1} 
                            value={newMatchWinningPoints} 
                            onChange={(e) => setNewMatchWinningPoints(Number(e.target.value) || 10)} 
                            className="bg-muted border-border" 
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTeamMatch()}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Losing Points</label>
                          <Input 
                            type="number" 
                            min={0} 
                            value={newMatchLosingPoints} 
                            onChange={(e) => setNewMatchLosingPoints(Number(e.target.value) || 5)} 
                            className="bg-muted border-border" 
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTeamMatch()}
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={handleAddTeamMatch} 
                        size="sm" 
                        className="bg-primary text-primary-foreground w-full"
                        disabled={!newMatchTitle.trim() || !newMatchTeamA || !newMatchTeamB}
                      >
                        <Trophy className="w-4 h-4 mr-2" />
                        Add Match
                      </Button>
                    </div>

                    {/* Existing matches */}
                    {clusterTeamMatches.map((match) => {
                      const teamA = clusterTeams.find(t => t.id === match.teamA);
                      const teamB = clusterTeams.find(t => t.id === match.teamB);
                      
                      return (
                        <div key={match.id} className="glass-surface rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Input 
                              value={match.eventTitle} 
                              onChange={(e) => updateClusterTeamMatch(match.id, { eventTitle: e.target.value })} 
                              className="bg-muted border-border font-bold" 
                            />
                            <div className="flex gap-2">
                              {match.winner && (
                                <button 
                                  onClick={() => undoMatchWinner(match.id)} 
                                  className="text-muted-foreground hover:text-yellow-500 transition-colors" 
                                  title="Undo Winner"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              )}
                              <button 
                                onClick={() => updateClusterTeamMatch(match.id, { archived: true })} 
                                className="text-muted-foreground hover:text-yellow-500 transition-colors" 
                                title="Archive"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this match?')) {
                                    deleteClusterTeamMatch(match.id);
                                  }
                                }} 
                                className="text-muted-foreground hover:text-red-500 transition-colors" 
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Active in slides</span>
                            <Switch 
                              checked={match.isActive} 
                              onCheckedChange={(checked) => updateClusterTeamMatch(match.id, { isActive: checked })} 
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground">Team A</label>
                              <div className="bg-muted border-border rounded p-2 text-sm">
                                {teamA?.name || 'Unknown'}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Team B</label>
                              <div className="bg-muted border-border rounded p-2 text-sm">
                                {teamB?.name || 'Unknown'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Winner Controls */}
                          <div className="space-y-3">
                            {match.winner ? (
                              <div className="text-center p-2 bg-yellow-400/10 rounded-lg">
                                <span className="text-lg font-bold text-yellow-400">
                                  Winner: {match.winner === "A" ? teamA?.name : teamB?.name}
                                </span>
                                <div className="mt-2">
                                  <button
                                    onClick={() => undoMatchWinner(match.id)}
                                    className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition-colors"
                                  >
                                    Undo Winner
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setMatchWinner(match.id, "A")}
                                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                                >
                                  {teamA?.name} Wins
                                </button>
                                <button
                                  onClick={() => setMatchWinner(match.id, "B")}
                                  className="flex-1 px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                                >
                                  {teamB?.name} Wins
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tallied Points Tab */}
                {tab === "talliedPoints" && (
                  <div className="space-y-6">
                    <div className="glass-surface rounded-lg p-4 space-y-3">
                      <h3 className="font-body text-sm font-semibold text-foreground flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Detailed Points Breakdown
                      </h3>
                      
                      <div className="space-y-6">
                        {ALL_CLUSTERS.map((cluster) => {
                          // Get detailed game information
                          const gameDetails = games.all
                            .filter(game => game.scores[cluster] > 0)
                            .map(game => ({
                              name: game.name,
                              points: game.scores[cluster]
                            }));

                          // Get detailed grand finals information
                          const grandFinalsDetails = grandFinals.all
                            .filter(final => {
                              return (final.clusterA === cluster && final.betsA > 0) || 
                                     (final.clusterB === cluster && final.betsB > 0);
                            })
                            .map(final => {
                              const isClusterA = final.clusterA === cluster;
                              return {
                                name: final.eventTitle,
                                points: isClusterA ? final.betsA : final.betsB,
                                side: isClusterA ? 'A' : 'B'
                              };
                            });

                          // Get detailed team match information
                          const teamMatchDetails = clusterTeamMatches
                            .filter(match => {
                              // Only include matches that have a winner
                              return match.winner && 
                                match.teamA === teamA.id && match.teamB === teamB.id;
                            })
                            .map(match => {
                              const winnerTeamObj = match.winner === 'A' ? teamA : teamB;
                              const loserTeamObj = match.winner === 'A' ? teamB : teamA;
                              
                              return {
                                name: `${match.eventTitle}: ${winnerTeamObj.name} vs ${loserTeamObj.name}`,
                                points: match.winningPoints,
                                result: match.winner === 'A' ? 'Win' : 'Loss',
                                winnerTeam: winnerTeamObj.name,
                                loserTeam: loserTeamObj.name
                              };
                            });

                          const totalPoints = gameDetails.reduce((sum, g) => sum + g.points, 0) +
                                           grandFinalsDetails.reduce((sum, gf) => sum + gf.points, 0) +
                                           teamMatchDetails.reduce((sum, tm) => sum + tm.points, 0);

                          const config = {
                            Salamanca: { color: 'text-green-400', borderColor: 'border-green-400', bgColor: 'bg-green-400/20' },
                            Barcelona: { color: 'text-blue-400', borderColor: 'border-blue-400', bgColor: 'bg-blue-400/20' },
                            Madrid: { color: 'text-red-400', borderColor: 'border-red-400', bgColor: 'bg-red-400/20' },
                            Valencia: { color: 'text-orange-400', borderColor: 'border-orange-400', bgColor: 'bg-orange-400/20' },
                            Sevilla: { color: 'text-purple-400', borderColor: 'border-purple-400', bgColor: 'bg-purple-400/20' },
                            Bilbao: { color: 'text-pink-400', borderColor: 'border-pink-400', bgColor: 'bg-pink-400/20' }
                          }[cluster] || { color: 'text-gray-400', borderColor: 'border-gray-400', bgColor: 'bg-gray-400/20' };

                          return (
                            <div key={cluster} className="glass-surface rounded-lg p-6 space-y-4">
                              {/* Cluster Header with Logo */}
                              <div className="flex items-center gap-4 pb-4 border-b border-border">
                                <div className={`w-12 h-12 rounded-full border-2 ${config.borderColor} ${config.bgColor} flex items-center justify-center overflow-hidden`}>
                                  <img 
                                    src={getClusterLogoPath(cluster)}
                                    alt={cluster}
                                    className="w-8 h-8 rounded-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                                <div>
                                  <h4 className={`font-bold text-xl ${config.color}`}>{cluster}</h4>
                                  <div className="text-sm text-muted-foreground">Total Points: <span className="font-bold text-lg text-primary">{totalPoints}</span></div>
                                </div>
                              </div>

                              {/* Games Section */}
                              {gameDetails.length > 0 && (
                                <div className="space-y-2">
                                  <h5 className="font-semibold text-sm text-blue-400 mb-2">Games ({gameDetails.length})</h5>
                                  {gameDetails.map((game, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-1 px-2 bg-blue-400/10 rounded">
                                      <span className="text-sm text-foreground">{game.name}</span>
                                      <span className="font-medium text-blue-400">+{game.points}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Grand Finals Section */}
                              {grandFinalsDetails.length > 0 && (
                                <div className="space-y-2">
                                  <h5 className="font-semibold text-sm text-green-400 mb-2">Grand Finals ({grandFinalsDetails.length})</h5>
                                  {grandFinalsDetails.map((final, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-1 px-2 bg-green-400/10 rounded">
                                      <span className="text-sm text-foreground">{final.name} (Side {final.side})</span>
                                      <span className="font-medium text-green-400">+{final.points}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Team Matches Section */}
                              {teamMatchDetails.length > 0 && (
                                <div className="space-y-2">
                                  <h5 className="font-semibold text-sm text-purple-400 mb-2">Team Matches ({teamMatchDetails.length})</h5>
                                  {teamMatchDetails.map((team, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-1 px-2 bg-purple-400/10 rounded">
                                      <span className="text-sm text-foreground">{team.name}</span>
                                      <span className="font-medium text-purple-400">+{team.points}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Empty State */}
                              {gameDetails.length === 0 && grandFinalsDetails.length === 0 && teamMatchDetails.length === 0 && (
                                <div className="text-center py-4 text-muted-foreground text-sm">
                                  No points recorded for this cluster yet
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Logs Tab */}
                {tab === "logs" && (
                  <div className="space-y-2">
                    {adminLogs.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>}
                    {adminLogs.slice(0, 50).map((log) => {
                      // Determine if this action can be reverted
                      const canRevert = [
                        'score_update',
                        'game_retire',
                        'game_unretire',
                        'game_visibility',
                        'game_top3',
                        'team_match_winner',
                        'team_match_undo',
                        'finals_update'
                      ].includes(log.action);

                      const handleRevert = async () => {
                        try {
                          switch (log.action) {
                            case 'score_update': {
                              // Extract game ID and cluster from details
                              const match = log.details.match(/Updated (\w+) score in (.+) from (\d+) to (\d+)/);
                              if (match) {
                                const [, cluster, gameName, oldScore] = match;
                                const game = games.all.find(g => g.name === gameName);
                                if (game) {
                                  await updateScore(game.id, cluster, parseInt(oldScore));
                                }
                              }
                              break;
                            }
                            case 'game_retire': {
                              const match = log.details.match(/Retired game: (.+)\. Winner: (.+)/);
                              if (match) {
                                const [, gameName] = match;
                                const game = games.all.find(g => g.name === gameName);
                                if (game) {
                                  await unretireGame(game.id);
                                }
                              }
                              break;
                            }
                            case 'game_unretire': {
                              const match = log.details.match(/Unretired game with ID: (.+)/);
                              if (match) {
                                const [, gameId] = match;
                                const retiredGame = games.retired.find(g => g.id === gameId);
                                if (retiredGame) {
                                  await retireGame(gameId);
                                }
                              }
                              break;
                            }
                            case 'game_visibility': {
                              const match = log.details.match(/Updated visibility for game with ID: (.+) to showTopOnly: (.+)/);
                              if (match) {
                                const [, gameId, currentSetting] = match;
                                await updateGameVisibility(gameId, currentSetting === 'true');
                              }
                              break;
                            }
                            case 'game_top3': {
                              const match = log.details.match(/Updated top3 setting for game with ID: (.+) to showTop3: (.+)/);
                              if (match) {
                                const [, gameId, currentSetting] = match;
                                await updateGameTop3(gameId, currentSetting === 'true');
                              }
                              break;
                            }
                            case 'team_match_winner': {
                              const match = log.details.match(/Set winner for match (.+): Team (.+)/);
                              if (match) {
                                const [, matchTitle] = match;
                                const teamMatch = clusterTeamMatches.find(m => m.eventTitle === matchTitle);
                                if (teamMatch) {
                                  await undoMatchWinner(teamMatch.id);
                                }
                              }
                              break;
                            }
                            case 'team_match_undo': {
                              alert('Cannot restore previous winner - this action is not reversible');
                              break;
                            }
                            case 'finals_update': {
                              alert('Grand finals updates require manual reversal');
                              break;
                            }
                            default:
                              alert('This action cannot be reverted');
                          }
                        } catch (error) {
                          alert('Failed to revert action: ' + (error instanceof Error ? error.message : 'Unknown error'));
                        }
                      };

                      return (
                        <div key={log.id} className="glass-surface rounded-lg px-4 py-3 space-y-2 relative">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <History className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">{log.action}</span>
                              {log.approved && (
                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Approved</span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown time'}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">{log.details}</div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-blue-400">{log.adminEmail}</div>
                            {canRevert && (
                              <button
                                onClick={handleRevert}
                                className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors flex items-center gap-1"
                                title="Revert this action"
                              >
                                <Settings className="w-3 h-3" />
                                Revert
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Misc Tab */}
                {tab === "misc" && (
                  <div className="space-y-6">
                    <div className="glass-surface rounded-lg p-4 space-y-3">
                      <h3 className="font-body text-sm font-semibold text-foreground">Slide Settings</h3>
                      
                      {/* Basic Slide Duration */}
                      <div className={`flex items-center justify-between ${advancedSlideTiming.useAdvanced ? 'opacity-50' : ''}`}>
                        <div>
                          <label className="text-sm text-muted-foreground">Time per Slide (seconds)</label>
                          <p className="text-xs text-muted-foreground">Duration for all slides when Advanced Timing is disabled</p>
                        </div>
                        <ControlledInput 
                          type="number" 
                          min={1} 
                          max={60} 
                          value={slideDuration}
                          onChange={(newValue: number) => updateSlideDuration(newValue)}
                          disabled={advancedSlideTiming.useAdvanced}
                          className={`bg-muted border-border h-10 w-20 text-base ${
                            advancedSlideTiming.useAdvanced ? 'opacity-50 cursor-not-allowed' : ''
                          }`} 
                        />
                      </div>

                      {/* Advanced Slide Timing Toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm text-muted-foreground">Advanced Slide Timing</label>
                          <p className="text-xs text-muted-foreground">Override basic timing and set specific durations for each slide type</p>
                        </div>
                        <Switch 
                          checked={advancedSlideTiming.useAdvanced} 
                          onCheckedChange={(checked) => updateAdvancedSlideTiming({ ...advancedSlideTiming, useAdvanced: checked })} 
                        />
                      </div>

                      {/* Advanced Timing Options */}
                      {advancedSlideTiming.useAdvanced && (
                        <div className="space-y-4 pt-4 border-t border-border">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <h4 className="font-body text-sm font-semibold text-foreground">Advanced Timing Active</h4>
                          </div>
                          <p className="text-xs text-green-400 mb-4">Specific slide durations are being applied instead of the basic timing</p>
                          
                          <h4 className="font-body text-sm font-semibold text-foreground">Specific Slide Durations</h4>
                          
                          <div className="grid gap-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <label className="text-sm text-muted-foreground">Overall Standing</label>
                                <p className="text-xs text-muted-foreground">Main leaderboard display</p>
                              </div>
                              <ControlledInput 
                                type="number" 
                                min={1} 
                                max={60} 
                                value={advancedSlideTiming.overallStanding}
                                onChange={(newValue: number) => updateAdvancedSlideTiming({ ...advancedSlideTiming, overallStanding: newValue })}
                                className="bg-muted border-border h-10 w-20 text-base" 
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <label className="text-sm text-muted-foreground">Games</label>
                                <p className="text-xs text-muted-foreground">Individual game slides</p>
                              </div>
                              <ControlledInput 
                                type="number" 
                                min={1} 
                                max={60} 
                                value={advancedSlideTiming.games}
                                onChange={(newValue: number) => updateAdvancedSlideTiming({ ...advancedSlideTiming, games: newValue })}
                                className="bg-muted border-border h-10 w-20 text-base" 
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <label className="text-sm text-muted-foreground">Hall of Champions</label>
                                <p className="text-xs text-muted-foreground">Champions display slide</p>
                              </div>
                              <ControlledInput 
                                type="number" 
                                min={1} 
                                max={60} 
                                value={advancedSlideTiming.hallOfChampions}
                                onChange={(newValue: number) => updateAdvancedSlideTiming({ ...advancedSlideTiming, hallOfChampions: newValue })}
                                className="bg-muted border-border h-10 w-20 text-base" 
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <label className="text-sm text-muted-foreground">Grand Finals</label>
                                <p className="text-xs text-muted-foreground">Grand finals matches (includes both phases)</p>
                              </div>
                              <ControlledInput 
                                type="number" 
                                min={1} 
                                max={60} 
                                value={advancedSlideTiming.grandFinals}
                                onChange={(newValue: number) => updateAdvancedSlideTiming({ ...advancedSlideTiming, grandFinals: newValue })}
                                className="bg-muted border-border h-10 w-20 text-base" 
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <label className="text-sm text-muted-foreground">Cluster Team Matches</label>
                                <p className="text-xs text-muted-foreground">Team championship matches</p>
                              </div>
                              <ControlledInput 
                                type="number" 
                                min={1} 
                                max={60} 
                                value={advancedSlideTiming.clusterTeamMatches}
                                onChange={(newValue: number) => updateAdvancedSlideTiming({ ...advancedSlideTiming, clusterTeamMatches: newValue })}
                                className="bg-muted border-border h-10 w-20 text-base" 
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="glass-surface rounded-lg p-4 space-y-3">
                      <h3 className="font-body text-sm font-semibold text-foreground">Session</h3>
                      <Button
                        onClick={logout}
                        className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Log Out
                      </Button>
                      <p className="text-xs text-muted-foreground">You will need to log in again to access admin features</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
