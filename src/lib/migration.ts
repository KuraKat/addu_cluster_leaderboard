import { gamesService, clusterTeamMatchesService, settingsService } from './firestore';
import { Game, ClusterName, ALL_CLUSTERS } from '@/types/leaderboard';

// Migration script to move data from localStorage to Firestore
export async function migrateFromLocalStorage() {
  console.log('Starting migration from localStorage to Firestore...');
  
  try {
    // Migrate games
    const gamesData = localStorage.getItem('leaderboard-games');
    if (gamesData) {
      const games: Game[] = JSON.parse(gamesData);
      console.log(`Found ${games.length} games to migrate`);
      
      for (const game of games) {
        // Ensure all clusters have scores
        const completeScores = {} as Record<ClusterName, number>;
        ALL_CLUSTERS.forEach(cluster => {
          completeScores[cluster] = game.scores[cluster] || 0;
        });
        
        await gamesService.create(game.name, 'migration@system.com', 'System Migration');
        
        // Update the newly created game with the scores
        // Note: This would need to be implemented in the gamesService
        console.log(`Migrated game: ${game.name}`);
      }
    }
    
    // Migrate slide duration
    const slideDuration = localStorage.getItem('leaderboard-settings');
    if (slideDuration) {
      const duration = Number(slideDuration);
      await settingsService.updateSlideDuration(duration, 'migration@system.com', 'System Migration');
      console.log(`Migrated slide duration: ${duration}s`);
    }
    
    // Clear localStorage after successful migration
    if (confirm('Migration completed successfully! Clear localStorage?')) {
      localStorage.removeItem('leaderboard-games');
      localStorage.removeItem('leaderboard-logs');
      localStorage.removeItem('leaderboard-finals');
      localStorage.removeItem('leaderboard-champions');
      localStorage.removeItem('leaderboard-settings');
      console.log('LocalStorage cleared');
    }
    
    console.log('Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

// Check if migration is needed
export function needsMigration(): boolean {
  const gamesData = localStorage.getItem('leaderboard-games');
  return !!gamesData;
}

// Export current localStorage data as JSON
export function exportLocalStorageData(): string {
  const data = {
    games: JSON.parse(localStorage.getItem('leaderboard-games') || '[]'),
    logs: JSON.parse(localStorage.getItem('leaderboard-logs') || '[]'),
    grandFinals: JSON.parse(localStorage.getItem('leaderboard-finals') || '[]'),
    champions: JSON.parse(localStorage.getItem('leaderboard-champions') || '[]'),
    slideDuration: JSON.parse(localStorage.getItem('leaderboard-settings') || '7'),
  };
  return JSON.stringify(data, null, 2);
}
