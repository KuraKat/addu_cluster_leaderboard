import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, Plus, Trash2, History, Archive, RotateCcw } from "lucide-react";
import { useScoreData } from "@/hooks/useScoreData";
import { ALL_CLUSTERS, ClusterName } from "@/types/leaderboard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminPanel() {
  const [open, setOpen] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [newFinalsTitle, setNewFinalsTitle] = useState("");
  const [newFinalsA, setNewFinalsA] = useState<ClusterName>("Salamanca");
  const [newFinalsB, setNewFinalsB] = useState<ClusterName>("Barcelona");
  const [tab, setTab] = useState<"games" | "finals" | "logs">("games");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [incrementAmount, setIncrementAmount] = useState(5);

  const {
    games, updateScore, addGame, removeGame, retireGame, unretireGame, updateGameVisibility, updateGameTop3,
    logs, grandFinals, addGrandFinals, removeGrandFinals, updateGrandFinals,
  } = useScoreData();

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
    const game = games.find(g => g.id === gameId);
    if (game) {
      updateScore(gameId, cluster, game.scores[cluster] + incrementAmount);
    }
  };

  const handleDecrement = (gameId: string, cluster: ClusterName) => {
    const game = games.find(g => g.id === gameId);
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

  const activeGames = games.filter((g) => !g.retired);
  const retiredGames = games.filter((g) => g.retired);

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
                  {(["games", "finals", "logs"] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg font-body text-sm font-medium transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                      {t === "games" ? "Games" : t === "finals" ? "Grand Finals" : "Logs"}
                    </button>
                  ))}
                </div>

                {/* Advanced Mode Toggle */}
                <div className="flex items-center justify-between mb-6 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-foreground">Advanced Mode</span>
                    <p className="text-xs text-muted-foreground">Enable increment/decrement buttons for scores</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {advancedMode && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">Increment:</label>
                        <Input 
                          type="number" 
                          min={1} 
                          max={100} 
                          value={incrementAmount} 
                          onChange={(e) => setIncrementAmount(Number(e.target.value) || 5)} 
                          className="bg-background border-border h-8 w-16 text-sm" 
                        />
                      </div>
                    )}
                    <Switch checked={advancedMode} onCheckedChange={setAdvancedMode} />
                  </div>
                </div>

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
                          <div className={`grid gap-3 ${advancedMode ? 'grid-cols-3' : 'grid-cols-2'}`}>
                            {ALL_CLUSTERS.map((cluster) => (
                              <div key={cluster} className="flex items-center gap-2">
                                <label className="text-base text-muted-foreground w-28 truncate">{cluster}</label>
                                <Input type="number" min={0} value={game.scores[cluster]} onChange={(e) => updateScore(game.id, cluster, Number(e.target.value) || 0)} className="bg-muted border-border h-10 text-base w-24" />
                                {advancedMode && (
                                  <div className="flex gap-1">
                                    <button 
                                      onClick={() => handleDecrement(game.id, cluster)} 
                                      className="w-8 h-8 rounded bg-red-500/20 hover:bg-red-500/30 text-red-500 flex items-center justify-center text-base font-bold transition-colors"
                                      title={`Decrease by ${incrementAmount}`}
                                    >
                                      -
                                    </button>
                                    <button 
                                      onClick={() => handleIncrement(game.id, cluster)} 
                                      className="w-8 h-8 rounded bg-green-500/20 hover:bg-green-500/30 text-green-500 flex items-center justify-center text-base font-bold transition-colors"
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
                                  <RotateCcw className="w-4 h-4" />
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
                      <Input value={newFinalsTitle} onChange={(e) => setNewFinalsTitle(e.target.value)} placeholder="Event title..." className="bg-muted border-border" />
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
                    {grandFinals.map((match) => (
                      <div key={match.id} className="glass-surface rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Input value={match.eventTitle} onChange={(e) => updateGrandFinals(match.id, { eventTitle: e.target.value })} className="bg-muted border-border font-bold" />
                          <button onClick={() => removeGrandFinals(match.id)} className="text-muted-foreground hover:text-destructive transition-colors ml-2"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Active in slides</span>
                          <Switch checked={match.isActive} onCheckedChange={(checked) => updateGrandFinals(match.id, { isActive: checked })} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Enable voting</span>
                          <Switch checked={match.votingEnabled} onCheckedChange={(checked) => updateGrandFinals(match.id, { votingEnabled: checked })} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Cluster A</label>
                            <Select value={match.clusterA} onValueChange={(v) => updateGrandFinals(match.id, { clusterA: v as ClusterName })}>
                              <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                              <SelectContent className="z-[200]">{ALL_CLUSTERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Cluster B</label>
                            <Select value={match.clusterB} onValueChange={(v) => updateGrandFinals(match.id, { clusterB: v as ClusterName })}>
                              <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                              <SelectContent className="z-[200]">{ALL_CLUSTERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Votes A</label>
                            <Input type="number" min={0} value={match.betsA} onChange={(e) => updateGrandFinals(match.id, { betsA: Number(e.target.value) || 0 })} className="bg-muted border-border" />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Votes B</label>
                            <Input type="number" min={0} value={match.betsB} onChange={(e) => updateGrandFinals(match.id, { betsB: Number(e.target.value) || 0 })} className="bg-muted border-border" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Logs Tab */}
                {tab === "logs" && (
                  <div className="space-y-2">
                    {logs.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>}
                    {logs.slice(0, 50).map((log) => (
                      <div key={log.id} className="glass-surface rounded-lg px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <History className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm text-foreground font-medium">{log.cluster}</span>
                          <span className="text-xs text-muted-foreground">in {log.gameName}</span>
                        </div>
                        <span className={`font-display text-sm font-bold ${log.pointsAdded >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {log.pointsAdded >= 0 ? "+" : ""}{log.pointsAdded}
                        </span>
                      </div>
                    ))}
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
