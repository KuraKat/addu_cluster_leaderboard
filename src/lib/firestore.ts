import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Game, ClusterName, PointLog, GrandFinalsMatch, Champion, ClusterTeam, ClusterTeamMatch, PendingChange, AdminLog, AdvancedSlideTiming, VignetteSettings } from '@/types/leaderboard';

// Collection references
const GAMES_COLLECTION = 'games';
const FINALS_COLLECTION = 'grandFinals';
const CHAMPIONS_COLLECTION = 'champions';
const TEAMS_COLLECTION = 'clusterTeams';
const TEAM_MATCHES_COLLECTION = 'clusterTeamMatches';
const PENDING_CHANGES_COLLECTION = 'pendingChanges';
const ADMIN_LOGS_COLLECTION = 'adminLogs';
const SETTINGS_COLLECTION = 'settings';

// Helper to convert Firestore timestamps
function fromFirestoreTimestamp(timestamp: Timestamp): number {
  return timestamp.toMillis();
}

function toFirestoreTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

// Games CRUD operations
export const gamesService = {
  // Get all games
  async getAll(): Promise<Game[]> {
    const snapshot = await getDocs(collection(db, GAMES_COLLECTION));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Game));
  },

  // Get real-time updates
  subscribe(callback: (games: Game[]) => void) {
    return onSnapshot(collection(db, GAMES_COLLECTION), (snapshot) => {
      const games = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Game));
      callback(games);
    });
  },

  // Update game scores
  async updateScore(gameId: string, cluster: ClusterName, score: number, adminEmail: string, adminName: string) {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    const gameDoc = await getDoc(gameRef);
    
    if (!gameDoc.exists()) throw new Error('Game not found');
    
    const oldGame = gameDoc.data() as Game;
    const oldScore = oldGame.scores[cluster] || 0;
    const diff = score - oldScore;

    // Update the game
    await updateDoc(gameRef, {
      [`scores.${cluster}`]: score,
      updatedAt: serverTimestamp()
    });

    // Create admin log
    if (diff !== 0) {
      const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
      await setDoc(adminLogRef, {
        adminEmail,
        adminName,
        action: 'score_update',
        details: `Updated ${cluster} score in ${oldGame.name} from ${oldScore} to ${score}`,
        timestamp: serverTimestamp(),
        approved: true // Direct updates are auto-approved
      });
    }
  },

  // Create new game
  async create(name: string, adminEmail: string, adminName: string): Promise<void> {
    const newGame: Omit<Game, 'id'> = {
      name,
      scores: {} as Record<ClusterName, number>,
      retired: false,
      showTopOnly: false,
      showTop3: false
    };

    // Initialize scores for all clusters
    const allClusters: ClusterName[] = ["Salamanca", "Manresa", "Jerusalem", "Paris", "Rome", "Montserrat", "Pamplona", "Barcelona"];
    allClusters.forEach(cluster => {
      newGame.scores[cluster] = 0;
    });

    const docRef = doc(collection(db, GAMES_COLLECTION));
    await setDoc(docRef, {
      ...newGame,
      createdAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'game_create',
      details: `Created new game: ${name}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  // Delete game
  async delete(gameId: string, adminEmail: string, adminName: string): Promise<void> {
    await deleteDoc(doc(db, GAMES_COLLECTION, gameId));

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'game_delete',
      details: `Deleted game with ID: ${gameId}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  // Retire game
  async retire(gameId: string, adminEmail: string, adminName: string): Promise<void> {
    const gameRef = doc(db, GAMES_COLLECTION, gameId);
    const gameDoc = await getDoc(gameRef);
    
    if (!gameDoc.exists()) throw new Error('Game not found');
    
    const game = gameDoc.data() as Game;

    // Find the winning cluster
    const allClusters: ClusterName[] = ["Salamanca", "Manresa", "Jerusalem", "Paris", "Rome", "Montserrat", "Pamplona", "Barcelona"];
    const topCluster = allClusters.reduce((best, cluster) => 
      (game.scores[cluster] || 0) > (game.scores[best] || 0) ? cluster : best
    );

    // Create champion entry
    const championRef = doc(collection(db, CHAMPIONS_COLLECTION));
    await setDoc(championRef, {
      gameId,
      gameName: game.name,
      cluster: topCluster,
      score: game.scores[topCluster],
      timestamp: serverTimestamp()
    });

    // Retire the game
    await updateDoc(gameRef, {
      retired: true,
      retiredAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'game_retire',
      details: `Retired game: ${game.name}. Winner: ${topCluster}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  // Unretire game
  async unretire(gameId: string, adminEmail: string, adminName: string): Promise<void> {
    await updateDoc(doc(db, GAMES_COLLECTION, gameId), {
      retired: false,
      updatedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'game_unretire',
      details: `Unretired game with ID: ${gameId}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  // Update game visibility
  async updateVisibility(gameId: string, showTopOnly: boolean, adminEmail: string, adminName: string): Promise<void> {
    await updateDoc(doc(db, GAMES_COLLECTION, gameId), {
      showTopOnly,
      updatedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'game_visibility',
      details: `Updated visibility for game with ID: ${gameId} to showTopOnly: ${showTopOnly}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  // Update game top3 setting
  async updateTop3(gameId: string, showTop3: boolean, adminEmail: string, adminName: string): Promise<void> {
    await updateDoc(doc(db, GAMES_COLLECTION, gameId), {
      showTop3,
      updatedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'game_top3',
      details: `Updated top3 setting for game with ID: ${gameId} to showTop3: ${showTop3}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  }
};

// Cluster Teams operations
export const clusterTeamsService = {
  async getAll(): Promise<ClusterTeam[]> {
    const snapshot = await getDocs(collection(db, TEAMS_COLLECTION));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ClusterTeam));
  },

  subscribe(callback: (teams: ClusterTeam[]) => void) {
    return onSnapshot(collection(db, TEAMS_COLLECTION), (snapshot) => {
      const teams = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ClusterTeam));
      callback(teams);
    });
  },

  async create(team: Omit<ClusterTeam, 'id'>, adminEmail: string, adminName: string): Promise<void> {
    const docRef = doc(collection(db, TEAMS_COLLECTION));
    await setDoc(docRef, {
      ...team,
      createdAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'team_create',
      details: `Created new team: ${team.name}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  async update(teamId: string, updates: Partial<ClusterTeam>, adminEmail: string, adminName: string): Promise<void> {
    await updateDoc(doc(db, TEAMS_COLLECTION, teamId), {
      ...updates,
      updatedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'team_update',
      details: `Updated team with ID: ${teamId}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  async delete(teamId: string, adminEmail: string, adminName: string): Promise<void> {
    await deleteDoc(doc(db, TEAMS_COLLECTION, teamId));

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'team_delete',
      details: `Deleted team with ID: ${teamId}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  }
};

// Cluster Team Matches operations
export const clusterTeamMatchesService = {
  async getAll(): Promise<ClusterTeamMatch[]> {
    const snapshot = await getDocs(collection(db, TEAM_MATCHES_COLLECTION));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: fromFirestoreTimestamp(doc.data().timestamp)
    } as ClusterTeamMatch));
  },

  subscribe(callback: (matches: ClusterTeamMatch[]) => void) {
    return onSnapshot(collection(db, TEAM_MATCHES_COLLECTION), (snapshot) => {
      const matches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: fromFirestoreTimestamp(doc.data().timestamp)
      } as ClusterTeamMatch));
      callback(matches);
    });
  },

  async create(match: Omit<ClusterTeamMatch, 'id'>, adminEmail: string, adminName: string): Promise<void> {
    const docRef = doc(collection(db, TEAM_MATCHES_COLLECTION));
    await setDoc(docRef, {
      ...match,
      timestamp: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'team_match_create',
      details: `Created new team match: ${match.eventTitle}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  async update(matchId: string, updates: Partial<ClusterTeamMatch>, adminEmail: string, adminName: string): Promise<void> {
    await updateDoc(doc(db, TEAM_MATCHES_COLLECTION, matchId), {
      ...updates,
      updatedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'team_match_update',
      details: `Updated team match with ID: ${matchId}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  async setWinner(matchId: string, winner: "A" | "B", adminEmail: string, adminName: string): Promise<void> {
    const matchRef = doc(db, TEAM_MATCHES_COLLECTION, matchId);
    const matchDoc = await getDoc(matchRef);
    
    if (!matchDoc.exists()) throw new Error('Match not found');
    
    const match = matchDoc.data() as ClusterTeamMatch;

    // Update match with winner
    await updateDoc(matchRef, {
      winner,
      decidedAt: serverTimestamp()
    });

    // Update team statistics
    const teamsRef = collection(db, TEAMS_COLLECTION);
    const winnerTeamId = winner === "A" ? match.teamA : match.teamB;
    const loserTeamId = winner === "A" ? match.teamB : match.teamA;

    const winnerTeamDoc = await getDoc(doc(teamsRef, winnerTeamId));
    const loserTeamDoc = await getDoc(doc(teamsRef, loserTeamId));

    if (winnerTeamDoc.exists() && loserTeamDoc.exists()) {
      const batch = writeBatch(db);
      
      // Update winner stats
      batch.update(doc(teamsRef, winnerTeamId), {
        wins: (winnerTeamDoc.data() as ClusterTeam).wins + 1,
        totalScore: (winnerTeamDoc.data() as ClusterTeam).totalScore + match.winningPoints
      });

      // Update loser stats
      batch.update(doc(teamsRef, loserTeamId), {
        losses: (loserTeamDoc.data() as ClusterTeam).losses + 1,
        totalScore: (loserTeamDoc.data() as ClusterTeam).totalScore + match.losingPoints // Add positive losing points
      });

      await batch.commit();
    }

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'team_match_winner',
      details: `Set winner for match ${match.eventTitle}: Team ${winner}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  async undoWinner(matchId: string, adminEmail: string, adminName: string): Promise<void> {
    const matchRef = doc(db, TEAM_MATCHES_COLLECTION, matchId);
    const matchDoc = await getDoc(matchRef);
    
    if (!matchDoc.exists()) throw new Error('Match not found');
    
    const match = matchDoc.data() as ClusterTeamMatch;
    
    if (!match.winner) throw new Error('No winner to undo');

    // Update match to remove winner
    await updateDoc(matchRef, {
      winner: null,
      undoneAt: serverTimestamp()
    });

    // Revert team statistics
    const teamsRef = collection(db, TEAMS_COLLECTION);
    const winnerTeamId = match.winner === "A" ? match.teamA : match.teamB;
    const loserTeamId = match.winner === "A" ? match.teamB : match.teamA;

    const winnerTeamDoc = await getDoc(doc(teamsRef, winnerTeamId));
    const loserTeamDoc = await getDoc(doc(teamsRef, loserTeamId));

    if (winnerTeamDoc.exists() && loserTeamDoc.exists()) {
      const batch = writeBatch(db);
      
      // Revert winner stats
      batch.update(doc(teamsRef, winnerTeamId), {
        wins: Math.max(0, (winnerTeamDoc.data() as ClusterTeam).wins - 1),
        totalScore: Math.max(0, (winnerTeamDoc.data() as ClusterTeam).totalScore - match.winningPoints)
      });

      // Revert loser stats
      batch.update(doc(teamsRef, loserTeamId), {
        losses: Math.max(0, (loserTeamDoc.data() as ClusterTeam).losses - 1),
        totalScore: (loserTeamDoc.data() as ClusterTeam).totalScore - match.losingPoints // Remove losing points
      });

      await batch.commit();
    }

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'team_match_undo',
      details: `Undid winner for match ${match.eventTitle}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  async delete(matchId: string, adminEmail: string, adminName: string): Promise<void> {
    await deleteDoc(doc(db, TEAM_MATCHES_COLLECTION, matchId));

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      details: `Deleted team match with ID: ${matchId}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  async archive(matchId: string, adminEmail: string, adminName: string): Promise<void> {
    await updateDoc(doc(db, TEAM_MATCHES_COLLECTION, matchId), {
      archived: true,
      isActive: false,
      archivedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'team_match_archive',
      details: `Archived team match with ID: ${matchId}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  async unarchive(matchId: string, adminEmail: string, adminName: string): Promise<void> {
    await updateDoc(doc(db, TEAM_MATCHES_COLLECTION, matchId), {
      archived: false,
      unarchivedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'team_match_unarchive',
      details: `Unarchived team match with ID: ${matchId}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  }
};

// Admin Logs operations
export const adminLogsService = {
  async getAll(): Promise<AdminLog[]> {
    const snapshot = await getDocs(
      query(collection(db, ADMIN_LOGS_COLLECTION), orderBy('timestamp', 'desc'), limit(100))
    );
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: fromFirestoreTimestamp(doc.data().timestamp)
    } as AdminLog));
  },

  subscribe(callback: (logs: AdminLog[]) => void) {
    return onSnapshot(
      query(collection(db, ADMIN_LOGS_COLLECTION), orderBy('timestamp', 'desc'), limit(100)),
      (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: fromFirestoreTimestamp(doc.data().timestamp)
        } as AdminLog));
        callback(logs);
      }
    );
  }
};

// Grand Finals operations
export const grandFinalsService = {
  async getAll(): Promise<GrandFinalsMatch[]> {
    const snapshot = await getDocs(collection(db, FINALS_COLLECTION));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as GrandFinalsMatch));
  },

  subscribe(callback: (finals: GrandFinalsMatch[]) => void) {
    return onSnapshot(collection(db, FINALS_COLLECTION), (snapshot) => {
      const finals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as GrandFinalsMatch));
      callback(finals);
    });
  },

  async create(title: string, clusterA: ClusterName, clusterB: ClusterName, adminEmail: string, adminName: string): Promise<void> {
    const docRef = doc(collection(db, FINALS_COLLECTION));
    await setDoc(docRef, {
      eventTitle: title,
      clusterA,
      clusterB,
      betsA: 0,
      betsB: 0,
      isActive: false,
      votingEnabled: false,
      createdAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'finals_create',
      details: `Created new grand finals: ${title}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  async update(finalId: string, updates: Partial<GrandFinalsMatch>, adminEmail: string, adminName: string): Promise<void> {
    await updateDoc(doc(db, FINALS_COLLECTION, finalId), {
      ...updates,
      updatedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'finals_update',
      details: `Updated grand finals with ID: ${finalId}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  async delete(finalId: string, adminEmail: string, adminName: string): Promise<void> {
    await deleteDoc(doc(db, FINALS_COLLECTION, finalId));

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'finals_delete',
      details: `Deleted grand finals with ID: ${finalId}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  async archive(finalId: string, adminEmail: string, adminName: string): Promise<void> {
    await updateDoc(doc(db, FINALS_COLLECTION, finalId), {
      archived: true,
      isActive: false,
      archivedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'finals_archive',
      details: `Archived grand finals with ID: ${finalId}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  async unarchive(finalId: string, adminEmail: string, adminName: string): Promise<void> {
    await updateDoc(doc(db, FINALS_COLLECTION, finalId), {
      archived: false,
      unarchivedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'finals_unarchive',
      details: `Unarchived grand finals with ID: ${finalId}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  async addBet(finalId: string, side: "A" | "B"): Promise<void> {
    const finalRef = doc(db, FINALS_COLLECTION, finalId);
    const finalDoc = await getDoc(finalRef);
    
    if (!finalDoc.exists()) throw new Error('Grand final not found');
    
    const final = finalDoc.data() as GrandFinalsMatch;
    
    // Update the bet count
    await updateDoc(finalRef, {
      [`bets${side}`]: (final[`bets${side}`] || 0) + 1,
      updatedAt: serverTimestamp()
    });
  }
};

// Champions operations
export const championsService = {
  async getAll(): Promise<Champion[]> {
    const snapshot = await getDocs(collection(db, CHAMPIONS_COLLECTION));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      gameId: doc.data().gameId || '',
      gameName: doc.data().gameName || '',
      cluster: doc.data().cluster || 'Salamanca',
      score: doc.data().score || 0,
      timestamp: fromFirestoreTimestamp(doc.data().timestamp)
    } as Champion));
  },

  subscribe(callback: (champions: Champion[]) => void) {
    return onSnapshot(collection(db, CHAMPIONS_COLLECTION), (snapshot) => {
      const champions = snapshot.docs.map(doc => ({
        id: doc.id,
        gameId: doc.data().gameId || '',
        gameName: doc.data().gameName || '',
        cluster: doc.data().cluster || 'Salamanca',
        score: doc.data().score || 0,
        timestamp: fromFirestoreTimestamp(doc.data().timestamp)
      } as Champion));
      callback(champions);
    });
  }
};

// Settings operations
export const settingsService = {
  async getSlideDuration(): Promise<number> {
    const docRef = doc(db, SETTINGS_COLLECTION, 'slideDuration');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().value : 7;
  },

  subscribeToSlideDuration(callback: (duration: number) => void) {
    return onSnapshot(doc(db, SETTINGS_COLLECTION, 'slideDuration'), (doc) => {
      callback(doc.exists() ? doc.data().value : 7);
    });
  },

  subscribeToAdvancedSlideTiming(callback: (timing: AdvancedSlideTiming) => void) {
    return onSnapshot(doc(db, SETTINGS_COLLECTION, 'advancedSlideTiming'), (doc) => {
      if (doc.exists()) {
        callback(doc.data() as AdvancedSlideTiming);
      } else {
        // Default values if document doesn't exist
        callback({
          overallStanding: 7,
          games: 7,
          hallOfChampions: 7,
          grandFinals: 7,
          clusterTeamMatches: 7,
          useAdvanced: false
        });
      }
    });
  },

  async updateSlideDuration(duration: number, adminEmail: string, adminName: string): Promise<void> {
    await setDoc(doc(db, SETTINGS_COLLECTION, 'slideDuration'), {
      value: duration,
      updatedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'settings_update',
      details: `Updated slide duration to ${duration} seconds`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  // Logs advanced slide timing updates
  async updateAdvancedSlideTiming(timing: any, adminEmail: string, adminName: string): Promise<void> {
    await setDoc(doc(db, SETTINGS_COLLECTION, 'advancedSlideTiming'), {
      ...timing,
      updatedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'settings_update',
      details: `Updated advanced slide timing`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  // Vignette settings operations
  subscribeToVignetteSettings(callback: (settings: VignetteSettings) => void) {
    return onSnapshot(doc(db, SETTINGS_COLLECTION, 'vignetteSettings'), (doc) => {
      if (doc.exists()) {
        callback(doc.data() as VignetteSettings);
      } else {
        // Default values if document doesn't exist
        callback({
          enabled: true,
          radius: 30,
          strength: 85
        });
      }
    });
  },

  async updateVignetteSettings(settings: VignetteSettings, adminEmail: string, adminName: string): Promise<void> {
    await setDoc(doc(db, SETTINGS_COLLECTION, 'vignetteSettings'), {
      ...settings,
      updatedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'settings_update',
      details: `Updated vignette settings - enabled: ${settings.enabled}, radius: ${settings.radius}%, strength: ${settings.strength}%`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },
};
