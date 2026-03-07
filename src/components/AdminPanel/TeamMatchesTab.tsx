import { useState } from "react";
import { Trophy, Trash2, Archive, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ALL_CLUSTERS } from "@/types/leaderboard";

interface TeamMatchesTabProps {
  teamGames: any;
  clusterTeamMatches: any;
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
  onSetMatchWinner: (matchId: string, winnerTeamName: string) => void;
  onArchiveUnifiedGame: (gameId: string) => void;
  onDeleteUnifiedGame: (gameId: string) => void;
  onUpdateMatchStatus: (matchId: string, status: 'active' | 'archived') => void;
  onCreateVersusMatch: (title: string, teamA: { name: string; clusters: string[] }, teamB: { name: string; clusters: string[] }) => void;
}

export default function TeamMatchesTab({
  teamGames,
  clusterTeamMatches,
  newMatchTitle,
  newMatchTeamA,
  newMatchTeamB,
  newMatchWinningPoints,
  newMatchLosingPoints,
  onNewMatchTitleChange,
  onNewMatchTeamAChange,
  onNewMatchTeamBChange,
  onNewMatchWinningPointsChange,
  onNewMatchLosingPointsChange,
  onAddTeamMatch,
  onSetMatchWinner,
  onArchiveUnifiedGame,
  onDeleteUnifiedGame,
  onUpdateMatchStatus,
  onCreateVersusMatch
}: TeamMatchesTabProps) {
  const activeMatches = clusterTeamMatches.all.filter((game: any) => game.isVersus && game.status === 'active');
  const archivedMatches = clusterTeamMatches.all.filter((game: any) => game.isVersus && game.status === 'archived');
  
  // Extract unique teams from existing games
  const existingTeams = [...new Map(
    teamGames.all.flatMap((game: any) => 
      game.teams.map((team: any) => [team.name, team])
    )
  ).values()];

  // State for team creation
  const [showTeamCreation, setShowTeamCreation] = useState<'A' | 'B' | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedClusters, setSelectedClusters] = useState<string[]>([]);
  const [teamAData, setTeamAData] = useState<{ name: string; clusters: string[] } | null>(null);
  const [teamBData, setTeamBData] = useState<{ name: string; clusters: string[] } | null>(null);

  const handleClusterToggle = (cluster: string) => {
    setSelectedClusters(prev => 
      prev.includes(cluster) 
        ? prev.filter(c => c !== cluster)
        : [...prev, cluster].slice(0, 4)
    );
  };

  const handleCreateTeam = (teamSlot: 'A' | 'B') => {
    if (newTeamName.trim() && selectedClusters.length > 0) {
      const newTeam = {
        name: newTeamName.trim(),
        clusters: selectedClusters
      };
      
      // Store team data
      if (teamSlot === 'A') {
        setTeamAData(newTeam);
        onNewMatchTeamAChange(newTeamName.trim());
      } else {
        setTeamBData(newTeam);
        onNewMatchTeamBChange(newTeamName.trim());
      }
      
      // Reset form
      setNewTeamName('');
      setSelectedClusters([]);
      setShowTeamCreation(null);
    }
  };

  // Handle creating versus match when both teams are ready
  const handleCreateVersusMatch = () => {
    if (newMatchTitle.trim() && teamAData && teamBData) {
      onCreateVersusMatch(
        newMatchTitle.trim(),
        teamAData,
        teamBData
      );
      
      // Reset form
      onNewMatchTitleChange("");
      setTeamAData(null);
      setTeamBData(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add new match */}
      <div className="glass-surface rounded-lg p-4 space-y-3">
        <h3 className="font-body text-sm font-semibold text-foreground">Add Team Match</h3>
        <Input 
          value={newMatchTitle} 
          onChange={(e) => onNewMatchTitleChange(e.target.value)} 
          placeholder="Match title..." 
          className="bg-muted border-border" 
        />
        <div className="grid grid-cols-2 gap-3">
          {/* Team A Selection */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Team A</label>
            {showTeamCreation === 'A' ? (
              <div className="space-y-2 p-2 bg-background/50 rounded">
                <Input 
                  value={newTeamName} 
                  onChange={(e) => setNewTeamName(e.target.value)} 
                  placeholder="Team name..." 
                  className="bg-muted/50 border-border text-sm" 
                />
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Select Clusters (max 4):</label>
                  <div className="grid grid-cols-2 gap-1">
                    {ALL_CLUSTERS.map((cluster) => (
                      <button
                        key={cluster}
                        onClick={() => handleClusterToggle(cluster)}
                        className={`px-1 py-0.5 rounded text-xs font-medium transition-colors ${
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
                <div className="flex gap-1">
                  <Button 
                    onClick={() => handleCreateTeam('A')} 
                    size="sm" 
                    className="bg-blue-500 text-white text-xs"
                    disabled={!newTeamName.trim() || selectedClusters.length === 0}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button 
                    onClick={() => setShowTeamCreation(null)} 
                    size="sm" 
                    variant="outline"
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {teamAData ? (
                  <div className="p-2 bg-muted/30 rounded text-xs">
                    <div className="font-medium text-foreground">{teamAData.name}</div>
                    <div className="text-muted-foreground">Clusters: {teamAData.clusters.join(', ')}</div>
                  </div>
                ) : (
                  <Button 
                    onClick={() => setShowTeamCreation('A')} 
                    size="sm" 
                    variant="outline"
                    className="w-full text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Create Team A
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Team B Selection */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Team B</label>
            {showTeamCreation === 'B' ? (
              <div className="space-y-2 p-2 bg-background/50 rounded">
                <Input 
                  value={newTeamName} 
                  onChange={(e) => setNewTeamName(e.target.value)} 
                  placeholder="Team name..." 
                  className="bg-muted/50 border-border text-sm" 
                />
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Select Clusters (max 4):</label>
                  <div className="grid grid-cols-2 gap-1">
                    {ALL_CLUSTERS.map((cluster) => (
                      <button
                        key={cluster}
                        onClick={() => handleClusterToggle(cluster)}
                        className={`px-1 py-0.5 rounded text-xs font-medium transition-colors ${
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
                <div className="flex gap-1">
                  <Button 
                    onClick={() => handleCreateTeam('B')} 
                    size="sm" 
                    className="bg-blue-500 text-white text-xs"
                    disabled={!newTeamName.trim() || selectedClusters.length === 0}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button 
                    onClick={() => setShowTeamCreation(null)} 
                    size="sm" 
                    variant="outline"
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {teamBData ? (
                  <div className="p-2 bg-muted/30 rounded text-xs">
                    <div className="font-medium text-foreground">{teamBData.name}</div>
                    <div className="text-muted-foreground">Clusters: {teamBData.clusters.join(', ')}</div>
                  </div>
                ) : (
                  <Button 
                    onClick={() => setShowTeamCreation('B')} 
                    size="sm" 
                    variant="outline"
                    className="w-full text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Create Team B
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Winning Points</label>
            <Input 
              type="number" 
              min={1} 
              value={newMatchWinningPoints} 
              onChange={(e) => onNewMatchWinningPointsChange(Number(e.target.value) || 10)} 
              className="bg-muted border-border" 
              onKeyDown={(e) => e.key === 'Enter' && onAddTeamMatch()}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Losing Points</label>
            <Input 
              type="number" 
              min={0} 
              value={newMatchLosingPoints} 
              onChange={(e) => onNewMatchLosingPointsChange(Number(e.target.value) || 5)} 
              className="bg-muted border-border" 
              onKeyDown={(e) => e.key === 'Enter' && onAddTeamMatch()}
            />
          </div>
        </div>
        <Button 
          onClick={handleCreateVersusMatch} 
          size="sm" 
          className="bg-primary text-primary-foreground w-full"
          disabled={!newMatchTitle.trim() || !teamAData || !teamBData}
        >
          <Trophy className="w-4 h-4 mr-2" />
          Add Match
        </Button>
      </div>

      {/* Existing matches */}
      {activeMatches.map((match: any) => {
        const teamA = match.teams[0];
        const teamB = match.teams[1];
        
        return (
          <div key={match.id} className="glass-surface rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Input 
                value={match.title} 
                onChange={(e) => {}} 
                className="bg-muted border-border font-bold" 
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => onUpdateMatchStatus(match.id, match.status === 'active' ? 'archived' : 'active')} 
                  className="text-muted-foreground hover:text-yellow-500 transition-colors" 
                  title="Archive"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this match?')) {
                      onDeleteUnifiedGame(match.id);
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
                checked={match.status === 'active'} 
                onCheckedChange={(checked) => onUpdateMatchStatus(match.id, checked ? 'active' : 'archived')} 
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
              {(teamA.isWinner || teamB.isWinner) ? (
                <div className="text-center p-2 bg-yellow-400/10 rounded-lg">
                  <span className="text-lg font-bold text-yellow-400">
                    Winner: {teamA.isWinner ? teamA.name : teamB.name}
                  </span>
                  <div className="mt-2">
                    <button
                      onClick={() => onSetMatchWinner(match.id, teamA.isWinner ? teamB.name : teamA.name)}
                      className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition-colors"
                    >
                      Undo Winner
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => onSetMatchWinner(match.id, teamA.name)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                  >
                    {teamA.name} Wins
                  </button>
                  <button
                    onClick={() => onSetMatchWinner(match.id, teamB.name)}
                    className="flex-1 px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                  >
                    {teamB.name} Wins
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Archived Team Matches */}
      {archivedMatches.length > 0 && (
        <>
          <h3 className="font-display text-sm font-bold text-muted-foreground mt-8 mb-4 tracking-wider">ARCHIVED MATCHES</h3>
          <div className="space-y-3">
            {archivedMatches.map((match: any) => {
              const teamA = match.teams[0];
              const teamB = match.teams[1];
              
              return (
                <div key={match.id} className="glass-surface rounded-lg px-4 py-3 flex items-center justify-between opacity-70">
                  <div>
                    <span className="font-body text-sm text-foreground">{match.title}</span>
                    <div className="text-xs text-muted-foreground mt-1">
                      {teamA?.name || 'Unknown'} vs {teamB?.name || 'Unknown'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onUpdateMatchStatus(match.id, 'active')} 
                      className="text-muted-foreground hover:text-green-500 transition-colors" 
                      title="Reactivate"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this match permanently?')) {
                          onDeleteUnifiedGame(match.id);
                        }
                      }} 
                      className="text-muted-foreground hover:text-destructive transition-colors" 
                      title="Delete permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
