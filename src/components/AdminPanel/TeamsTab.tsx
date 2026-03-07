import { Users, Trash2 } from "lucide-react";
import { ALL_CLUSTERS, ClusterName } from "@/types/leaderboard";
import { Button } from "@/components/ui/button";

interface TeamsTabProps {
  teamGames: any;
  onRemoveTeamGame: (gameId: string) => void;
}

export default function TeamsTab({
  teamGames,
  onRemoveTeamGame
}: TeamsTabProps) {
  return (
    <div className="space-y-6">
      {/* Team Games - Show all teams from each game document */}
      {teamGames.all.map((game: any) => (
        <div key={game.id} className="glass-surface rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-body text-lg font-semibold text-foreground flex items-center gap-2">
              {game.title}
              <span className="px-2 py-1 bg-blue-500/20 text-blue-500 text-xs font-medium rounded">Team Game</span>
            </h3>
            <Button 
              onClick={() => {
                if (confirm('Are you sure you want to delete this entire team game document? This will delete all teams within it.')) {
                  onRemoveTeamGame(game.id);
                }
              }} 
              className="text-muted-foreground hover:text-destructive transition-colors" 
              title="Delete entire team game document"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground mb-2">Teams in this game:</div>
            {game.teams.map((team: any, index: number) => (
              <div key={index} className="p-3 bg-muted/30 rounded">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{team.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Clusters: {team.clusters?.join(', ') || 'None'}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-primary">
                    {team.points || 0} points
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {teamGames.all.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No teams created yet</p>
          <p className="text-sm text-muted-foreground">Create teams in the Games or Team Matches tab</p>
        </div>
      )}
    </div>
  );
}
