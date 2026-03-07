import { useState, useEffect } from "react";
import { Plus, Trash2, Archive } from "lucide-react";
import { ALL_CLUSTERS } from "@/types/leaderboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

// Controlled Input Component
function ControlledInput({ value, onChange, type = "text", disabled = false, ...props }: {
  value: string | number;
  onChange: (value: string | number) => void;
  type?: string;
  disabled?: boolean;
  [key: string]: any;
}) {
  const [tempValue, setTempValue] = useState(value.toString());

  // Sync tempValue with prop value when it changes (for increment/decrement updates)
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

interface GamesTabProps {
  games: any;
  teamGames: any;
  incrementMode: boolean;
  incrementAmount: number;
  newGameName: string;
  onNewGameNameChange: (value: string) => void;
  onIncrementModeChange: (value: boolean) => void;
  onIncrementAmountChange: (value: number) => void;
  onAddGame: () => void;
  onAddTeamGame: (title: string, teams: { name: string; clusters: string[] }[]) => void;
  onUpdateScore: (gameId: string, cluster: string, score: number) => void;
  onUpdateTeamGameScore: (gameId: string, teamName: string, points: number) => void;
  onRetireGame: (gameId: string) => void;
  onUnretireGame: (gameId: string) => void;
  onRemoveGame: (gameId: string) => void;
  onRetireUnifiedGame: (gameId: string) => void;
  onArchiveUnifiedGame: (gameId: string) => void;
  onUnretireTeamGame?: (gameId: string) => void;
  onIncrement: (gameId: string, cluster: string) => void;
  onDecrement: (gameId: string, cluster: string) => void;
  onTeamGameIncrement: (gameId: string, team: string) => void;
  onTeamGameDecrement: (gameId: string, team: string) => void;
  onTop5Toggle: (gameId: string, checked: boolean) => void;
  onTop3Toggle: (gameId: string, checked: boolean) => void;
  onTeamGameTop3Toggle: (teamGameId: string, checked: boolean) => void;
  onTeamGameTop5Toggle: (teamGameId: string, checked: boolean) => void;
}

export default function GamesTab({
  games,
  teamGames,
  incrementMode,
  incrementAmount,
  newGameName,
  onNewGameNameChange,
  onIncrementModeChange,
  onIncrementAmountChange,
  onAddGame,
  onAddTeamGame,
  onUpdateScore,
  onUpdateTeamGameScore,
  onRetireGame,
  onUnretireGame,
  onRemoveGame,
  onRetireUnifiedGame,
  onArchiveUnifiedGame,
  onUnretireTeamGame,
  onIncrement,
  onDecrement,
  onTeamGameIncrement,
  onTeamGameDecrement,
  onTop5Toggle,
  onTop3Toggle,
  onTeamGameTop3Toggle,
  onTeamGameTop5Toggle
}: GamesTabProps) {
  // Local state for team creation
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedClusters, setSelectedClusters] = useState<string[]>([]);
  const [createdTeams, setCreatedTeams] = useState<{ name: string; clusters: string[] }[]>([]);
  const [clusterMode, setClusterMode] = useState(false); // NEW: Cluster Mode toggle

  // Handle cluster toggle for team creation
  const handleClusterToggle = (cluster: string) => {
    setSelectedClusters(prev => 
      prev.includes(cluster) 
        ? prev.filter(c => c !== cluster)
        : [...prev, cluster].slice(0, 4)
    );
  };

  // Handle team creation (add to list)
  const handleCreateTeam = () => {
    if (newTeamName.trim() && selectedClusters.length > 0) {
      const newTeam = {
        name: newTeamName.trim(),
        clusters: selectedClusters
      };
      setCreatedTeams(prev => [...prev, newTeam]);
      // Reset form for next team
      setNewTeamName('');
      setSelectedClusters([]);
    }
  };

  // Handle removing team from list
  const handleRemoveTeam = (index: number) => {
    setCreatedTeams(prev => prev.filter((_, i) => i !== index));
  };

  // Create the actual team game with all teams
  const handleCreateTeamGame = () => {
    if (createdTeams.length >= 2) {
      onAddTeamGame(newGameName.trim() || "Team Game", createdTeams);
      // Reset everything
      setCreatedTeams([]);
      setNewTeamName('');
      setSelectedClusters([]);
      onNewGameNameChange(""); // Clear the game name input
    }
  };

  const activeGames = games.active;
  const retiredGames = games.retired;

  return (
    <>
      {/* Increment Mode Toggle */}
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
                onChange={(e) => onIncrementAmountChange(Number(e.target.value) || 1)} 
                className="bg-background border-border h-8 w-20 text-sm" 
              />
            </div>
          )}
          <Switch checked={incrementMode} onCheckedChange={onIncrementModeChange} />
        </div>
      </div>

      {/* Game Creation Card */}
      <div className="glass-surface rounded-lg p-6 mb-6">
        <div className="space-y-4">
          {/* Game Name Input */}
          <div className="flex gap-2">
            <Input 
              value={newGameName} 
              onChange={(e) => onNewGameNameChange(e.target.value)} 
              placeholder={clusterMode ? "Team game name..." : "New game name..."} 
              className="bg-muted/50 border-border flex-1" 
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (clusterMode) {
                    handleCreateTeamGame();
                  } else {
                    onAddGame();
                  }
                }
              }} 
            />
            <Button 
              onClick={() => {
                if (clusterMode) {
                  handleCreateTeamGame();
                } else {
                  onAddGame();
                }
              }} 
              size="sm" 
              className={clusterMode ? "bg-blue-500 text-white" : "bg-primary text-primary-foreground"}
              disabled={!newGameName.trim() || (clusterMode && createdTeams.length < 2)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Cluster Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div>
              <span className="text-sm font-medium text-foreground">Cluster Mode</span>
              <p className="text-xs text-muted-foreground">Create team games with clusters instead of regular games</p>
            </div>
            <Switch 
              checked={clusterMode} 
              onCheckedChange={setClusterMode} 
            />
          </div>

          {/* Show team creation UI only in cluster mode */}
          {clusterMode && (
            <div className="space-y-3 p-3 bg-background/50 rounded-lg">
              <div className="text-xs font-medium text-muted-foreground">Create New Team:</div>
              <div className="flex gap-2">
                <Input 
                  value={newTeamName} 
                  onChange={(e) => setNewTeamName(e.target.value)} 
                  placeholder="Team name..." 
                  className="bg-muted/50 border-border flex-1 text-sm" 
                />
                <Button 
                  onClick={handleCreateTeam} 
                  size="sm" 
                  className="bg-blue-500 text-white"
                  disabled={!newTeamName.trim() || selectedClusters.length === 0}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              
              {/* Cluster Selection for New Team */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Select Clusters (max 4):</label>
                <div className="grid grid-cols-4 gap-1">
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
              
              {selectedClusters.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Selected clusters: {selectedClusters.join(', ')}
                </div>
              )}
              
              {/* Created Teams List */}
              {createdTeams.length > 0 && (
                <div className="space-y-3 p-3 bg-background/50 rounded-lg">
                  <div className="text-xs font-medium text-muted-foreground mb-3">
                    Created Teams ({createdTeams.length}):
                  </div>
                  <div className="space-y-2">
                    {createdTeams.map((team, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground">{team.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Clusters: {team.clusters.join(', ')}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleRemoveTeam(index)}
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                    
                  {/* Create Game Button */}
                  <div className="mt-4">
                    <div className="text-xs text-muted-foreground mb-2">
                      {createdTeams.length < 2 
                        ? `Add ${2 - createdTeams.length} more team${2 - createdTeams.length > 1 ? 's' : ''} to enable creation`
                        : 'Ready to create team game!'
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* All Games - Regular and Team Games */}
      <div className="space-y-6">
        {/* Regular Games */}
        {activeGames.map((game: any) => (
          <div key={game.id} className="glass-surface rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-body text-lg font-semibold text-foreground">{game.name}</h3>
              <div className="flex gap-2">
                <button onClick={() => onRetireGame(game.id)} className="text-muted-foreground hover:text-yellow-500 transition-colors" title="Retire event">
                  <Archive className="w-4 h-4" />
                </button>
                <button onClick={() => onRemoveGame(game.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-base text-muted-foreground">Show top 5 only</span>
              <Switch checked={game.showTop5} onCheckedChange={(checked) => onTop5Toggle(game.id, checked)} />
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-base text-muted-foreground">Show top 3 only</span>
              <Switch checked={game.showTop3} onCheckedChange={(checked) => onTop3Toggle(game.id, checked)} />
            </div>
            <div className="grid gap-4 grid-cols-2">
              {ALL_CLUSTERS.map((cluster) => (
                <div key={cluster} className="space-y-3">
                  <label className="text-base text-muted-foreground block text-center">{cluster}</label>
                  <ControlledInput 
                    type="number" 
                    min={0} 
                    value={game.scores[cluster]}
                    onChange={(newValue: number) => onUpdateScore(game.id, cluster, newValue)}
                    className="bg-muted border-border h-10 text-base w-full" 
                  />
                  {incrementMode && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onDecrement(game.id, cluster)} 
                        className="flex-1 h-8 rounded bg-red-500/20 hover:bg-red-500/30 text-red-500 flex items-center justify-center text-base font-bold transition-colors"
                        title={`Decrease by ${incrementAmount}`}
                      >
                        -
                      </button>
                      <button 
                        onClick={() => onIncrement(game.id, cluster)} 
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

        {/* Team Games */}
        {teamGames.active.map((teamGame: any) => (
          <div key={teamGame.id} className="glass-surface rounded-lg p-4 border-2 border-blue-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-body text-lg font-semibold text-foreground flex items-center gap-2">
                {teamGame.title}
                <span className="px-2 py-1 bg-blue-500/20 text-blue-500 text-xs font-medium rounded">Team Game</span>
              </h3>
              <div className="flex gap-2">
                <button onClick={() => onRetireUnifiedGame(teamGame.id)} className="text-muted-foreground hover:text-yellow-500 transition-colors" title="Retire event">
                  <Archive className="w-4 h-4" />
                </button>
                <button onClick={() => onArchiveUnifiedGame(teamGame.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-base text-muted-foreground">Show top 5 only</span>
              <Switch checked={teamGame.showTop5 || false} onCheckedChange={(checked) => onTeamGameTop5Toggle(teamGame.id, checked)} />
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-base text-muted-foreground">Show top 3 only</span>
              <Switch checked={teamGame.showTop3 || false} onCheckedChange={(checked) => onTeamGameTop3Toggle(teamGame.id, checked)} />
            </div>
            <div className="mb-3">
              <div className="text-sm text-muted-foreground mb-2">Teams:</div>
              <div className="flex flex-wrap gap-2">
                {teamGame.teams.map((team: any) => (
                  <div key={team.name} className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-500">
                    {team.name}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 grid-cols-2">
              {teamGame.teams.map((team: any) => (
                <div key={team.name} className="space-y-3">
                  <label className="text-base text-muted-foreground block text-center">{team.name}</label>
                  <ControlledInput 
                    type="number" 
                    min={0} 
                    value={team.points}
                    onChange={(newValue: number) => onUpdateTeamGameScore(teamGame.id, team.name, newValue)}
                    className="bg-muted border-border h-10 text-base w-full" 
                  />
                  {incrementMode && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onTeamGameDecrement(teamGame.id, team.name)} 
                        className="flex-1 h-8 rounded bg-red-500/20 hover:bg-red-500/30 text-red-500 flex items-center justify-center text-base font-bold transition-colors"
                        title={`Decrease by ${incrementAmount}`}
                      >
                        -
                      </button>
                      <button 
                        onClick={() => onTeamGameIncrement(teamGame.id, team.name)} 
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
            {retiredGames.map((game: any) => (
              <div key={game.id} className="glass-surface rounded-lg px-4 py-3 flex items-center justify-between opacity-70 border border-red-500/30">
                <span className="font-body text-sm text-foreground flex items-center gap-2">
                  {game.name}
                  <span className="px-2 py-1 bg-red-500/20 text-red-500 text-xs font-medium rounded">Game</span>
                </span>
                <div className="flex gap-2">
                  <button onClick={() => onUnretireGame(game.id)} className="text-muted-foreground hover:text-green-500 transition-colors" title="Reactivate">
                    <Archive className="w-4 h-4" />
                  </button>
                  <button onClick={() => onRemoveGame(game.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete permanently">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Retired Team Games */}
      {teamGames.retired.length > 0 && (
        <>
          <h3 className="font-display text-sm font-bold text-muted-foreground mt-8 mb-4 tracking-wider">RETIRED TEAM EVENTS</h3>
          <div className="space-y-3">
            {teamGames.retired.map((teamGame: any) => (
              <div key={teamGame.id} className="glass-surface rounded-lg px-4 py-3 flex items-center justify-between opacity-70 border border-blue-500/30">
                <span className="font-body text-sm text-foreground flex items-center gap-2">
                  {teamGame.title}
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-500 text-xs font-medium rounded">Team Game</span>
                </span>
                <div className="flex gap-2">
                  <button onClick={() => onUnretireTeamGame?.(teamGame.id)} className="text-muted-foreground hover:text-green-500 transition-colors" title="Reactivate">
                    <Archive className="w-4 h-4" />
                  </button>
                  <button onClick={() => onArchiveUnifiedGame(teamGame.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete permanently">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
