import { Settings, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogsTabProps {
  adminLogs: any[];
  games: any;
  teamGames: any;
  refreshLogs: () => Promise<void>;
  onUpdateScore: (gameId: string, cluster: string, score: number) => Promise<void>;
  onSetMatchWinner: (matchId: string, winnerTeamName: string) => Promise<void>;
  onUpdateGameVisibility: (gameId: string, showTop5: boolean) => Promise<void>;
  onUpdateGameTop3: (gameId: string, showTop3: boolean) => Promise<void>;
}

export default function LogsTab({
  adminLogs,
  games,
  teamGames,
  refreshLogs,
  onUpdateScore,
  onSetMatchWinner,
  onUpdateGameVisibility,
  onUpdateGameTop3
}: LogsTabProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Admin Activity Logs</h3>
        <Button
          onClick={refreshLogs}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>
      {adminLogs.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>}
      {adminLogs.slice(0, 50).map((log: any) => {
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
                  const game = games.all.find((g: any) => g.name === gameName);
                  if (game) {
                    await onUpdateScore(game.id, cluster, parseInt(oldScore));
                  }
                }
                break;
              }
              case 'team_match_winner': {
                // Extract match ID and winner from details
                const match = log.details.match(/Set winner for match (.+) to (.+)/);
                if (match) {
                  const [, gameId, winner] = match;
                  const teamMatch = teamGames.all.find((g: any) => g.id === gameId);
                  if (teamMatch) {
                    await onSetMatchWinner(gameId, winner);
                  }
                }
                break;
              }
              case 'team_match_undo': {
                // Extract match ID from details
                const match = log.details.match(/Undo winner for match (.+)/);
                if (match) {
                  const [, gameId] = match;
                  const teamMatch = teamGames.all.find((g: any) => g.id === gameId);
                  if (teamMatch) {
                    // Find current winner and set to opposite
                    const currentWinner = teamMatch.teams.find((t: any) => t.isWinner);
                    if (currentWinner) {
                      const oppositeWinner = currentWinner.name === teamMatch.teams[0].name ? teamMatch.teams[1].name : teamMatch.teams[0].name;
                      await onSetMatchWinner(gameId, oppositeWinner);
                    }
                  }
                }
                break;
              }
              case 'game_visibility': {
                const match = log.details.match(/Updated visibility for game with ID: (.+) to showTop5: (.+)/);
                if (match) {
                  const [, gameId, currentSetting] = match;
                  await onUpdateGameVisibility(gameId, currentSetting === 'true');
                }
                break;
              }
              case 'game_top3': {
                const match = log.details.match(/Updated top3 setting for game with ID: (.+) to showTop3: (.+)/);
                if (match) {
                  const [, gameId, currentSetting] = match;
                  await onUpdateGameTop3(gameId, currentSetting === 'true');
                }
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-muted-foreground">{log.action}</div>
                <div className="text-sm font-medium text-muted-foreground">vs</div>
                <div className="text-sm font-medium text-muted-foreground">{log.action}</div>
              </div>
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Approved</span>
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
  );
}
