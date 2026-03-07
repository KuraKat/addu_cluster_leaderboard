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
  writeBatch,
  addDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Game, 
  ClusterName, 
  ALL_CLUSTERS, 
  OverallScore, 
  GrandFinalsMatch, 
  Champion, 
  UnifiedTeamGame,
  PointLog,
  AdminLog,
  AdvancedSlideTiming,
  VignetteSettings
} from "@/types/leaderboard";

// Collection references
const GAMES_COLLECTION = 'games';
const FINALS_COLLECTION = 'grandFinals';
const CHAMPIONS_COLLECTION = 'champions';
const TEAMS_COLLECTION = 'clusterTeams';
const TEAM_MATCHES_COLLECTION = 'clusterTeamMatches';
const PENDING_CHANGES_COLLECTION = 'pendingChanges';
const ADMIN_LOGS_COLLECTION = 'adminLogs';
const SETTINGS_COLLECTION = 'settings';
const CONFIG_COLLECTION = 'config';

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
      showTop5: false,
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
  async updateVisibility(gameId: string, showTop5: boolean, adminEmail: string, adminName: string): Promise<void> {
    await updateDoc(doc(db, GAMES_COLLECTION, gameId), {
      showTop5,
      updatedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'game_visibility',
      details: `Updated visibility for game with ID: ${gameId} to showTop5: ${showTop5}`,
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

// Cluster Team Matches operations - wrapper for versus matches from unified system
export const clusterTeamMatchesService = {
  async getAll(): Promise<UnifiedTeamGame[]> {
    // Return only versus matches from unified system
    const allGames = await unifiedTeamGamesService.getAll();
    return allGames.filter(game => game.isVersus);
  },

  subscribe(callback: (matches: UnifiedTeamGame[]) => void) {
    // Subscribe to versus matches from unified system
    return unifiedTeamGamesService.subscribe((allGames) => {
      const versusMatches = allGames.filter(game => game.isVersus);
      callback(versusMatches);
    });
  },

  // Create a new versus match using unified system
  async create(title: string, teamAName: string, teamBName: string, winningPoints: number, losingPoints: number, adminEmail: string, adminName: string): Promise<void> {
    const unifiedTeamA = { name: teamAName, clusters: [] };
    const unifiedTeamB = { name: teamBName, clusters: [] };
    await unifiedTeamGamesService.createVersusMatch(title, unifiedTeamA, unifiedTeamB, winningPoints, losingPoints, adminEmail, adminName);
  },

  // Set winner for a versus match (converts A/B to team winner)
  async setWinner(matchId: string, winner: "A" | "B", adminEmail: string, adminName: string): Promise<void> {
    const game = await unifiedTeamGamesService.getAll();
    const targetGame = game.find(g => g.id === matchId);
    if (!targetGame || !targetGame.isVersus) {
      throw new Error('Match not found or not a versus match');
    }

    // Determine which team name corresponds to A/B
    const winnerTeamName = winner === "A" ? targetGame.teams[0].name : targetGame.teams[1].name;
    
    await unifiedTeamGamesService.setMatchWinner(matchId, winnerTeamName, adminEmail, adminName);
  },

  // Undo winner (clear all winner flags)
  async undoWinner(matchId: string, adminEmail: string, adminName: string): Promise<void> {
    await unifiedTeamGamesService.undoMatchWinner(matchId, adminEmail, adminName);
  },

  // Delete a versus match
  async delete(matchId: string, adminEmail: string, adminName: string): Promise<void> {
    await unifiedTeamGamesService.deleteGame(matchId, adminEmail, adminName);
  },

  // Archive a versus match
  async archive(matchId: string, adminEmail: string, adminName: string): Promise<void> {
    await unifiedTeamGamesService.archiveGame(matchId, adminEmail, adminName);
  },

  // Unarchive a versus match
  async unarchive(matchId: string, adminEmail: string, adminName: string): Promise<void> {
    await unifiedTeamGamesService.updateGameStatus(matchId, 'active', adminEmail, adminName);
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
export const TEAM_GAMES_COLLECTION = 'teamGames';



// NEW: Unified Team Games Service (replaces teamGames + clusterTeamMatches)
export const unifiedTeamGamesService = {
  async getAll(): Promise<UnifiedTeamGame[]> {
    const snapshot = await getDocs(collection(db, TEAM_GAMES_COLLECTION));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title || '',
      isTeamGame: doc.data().isTeamGame || false,
      isVersus: doc.data().isVersus || false,
      pointsVersus: doc.data().pointsVersus,
      teams: doc.data().teams || [],
      status: doc.data().status || 'active',
      showTop5: doc.data().showTop5 || false,
      showTop3: doc.data().showTop3 || false,
      createdAt: doc.data().createdAt,
      updatedAt: doc.data().updatedAt
    } as UnifiedTeamGame));
  },

  subscribe(callback: (games: UnifiedTeamGame[]) => void) {
    return onSnapshot(collection(db, TEAM_GAMES_COLLECTION), (snapshot) => {
      const games = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title || '',
        isTeamGame: doc.data().isTeamGame || false,
        isVersus: doc.data().isVersus || false,
        pointsVersus: doc.data().pointsVersus,
        teams: doc.data().teams || [],
        status: doc.data().status || 'active',
        showTop5: doc.data().showTop5 || false,
        showTop3: doc.data().showTop3 || false,
        createdAt: doc.data().createdAt,
        updatedAt: doc.data().updatedAt
      } as UnifiedTeamGame));
      callback(games);
    });
  },

  // Create Team Game (cluster team mode ON)
  async createTeamGame(
    title: string,
    teams: { name: string; clusters: string[] }[],
    adminEmail: string,
    adminName: string
  ): Promise<string> {
    const docRef = await addDoc(collection(db, TEAM_GAMES_COLLECTION), {
      title,
      isTeamGame: true,
      isVersus: false,
      teams: teams.map(team => ({
        ...team,
        points: 0,
        isActive: true,
        isWinner: false
      })),
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'team_game_create',
      details: `Created team game: ${title} with ${teams.length} teams`,
      timestamp: serverTimestamp(),
      approved: true
    });

    return docRef.id;
  },

  // Create Versus Match (cluster team mode OFF)
  async createVersusMatch(
    title: string,
    teamA: { name: string; clusters: string[] },
    teamB: { name: string; clusters: string[] },
    winnerPoints: number,
    loserPoints: number,
    adminEmail: string,
    adminName: string
  ): Promise<string> {
    const docRef = await addDoc(collection(db, TEAM_GAMES_COLLECTION), {
      title,
      isTeamGame: false,
      isVersus: true,
      pointsVersus: {
        winner_points: winnerPoints,
        loser_points: loserPoints
      },
      teams: [
        { ...teamA, points: 0, isActive: true, isWinner: false },
        { ...teamB, points: 0, isActive: true, isWinner: false }
      ],
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'versus_match_create',
      details: `Created versus match: ${title} - ${teamA.name} vs ${teamB.name}`,
      timestamp: serverTimestamp(),
      approved: true
    });

    return docRef.id;
  },

  // Set winner for versus matches
  async setMatchWinner(
    matchId: string,
    winnerTeamName: string,
    adminEmail: string,
    adminName: string
  ): Promise<void> {
    const matchRef = doc(db, TEAM_GAMES_COLLECTION, matchId);
    const matchDoc = await getDoc(matchRef);
    
    if (!matchDoc.exists()) throw new Error('Match not found');
    
    const match = matchDoc.data() as UnifiedTeamGame;
    
    if (!match.isVersus) throw new Error('Cannot set winner for team games');
    
    // Update teams array to set winner
    const updatedTeams = match.teams.map(team => ({
      ...team,
      isWinner: team.name === winnerTeamName,
      points: team.name === winnerTeamName ? match.pointsVersus?.winner_points : match.pointsVersus?.loser_points
    }));

    await updateDoc(matchRef, {
      teams: updatedTeams,
      updatedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'versus_match_winner',
      details: `Set winner for match ${match.title}: ${winnerTeamName}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  // Update team scores (for team games)
  async updateTeamScore(
    gameId: string,
    teamName: string,
    points: number,
    adminEmail: string,
    adminName: string
  ): Promise<void> {
    const gameRef = doc(db, TEAM_GAMES_COLLECTION, gameId);
    const gameDoc = await getDoc(gameRef);
    
    if (!gameDoc.exists()) throw new Error('Game not found');
    
    const game = gameDoc.data() as UnifiedTeamGame;
    
    // Update teams array to set points
    const updatedTeams = game.teams.map(team => ({
      ...team,
      points: team.name === teamName ? points : team.points
    }));

    await updateDoc(gameRef, {
      teams: updatedTeams,
      updatedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'team_game_score_update',
      details: `Updated score for team ${teamName} in game ${game.title}: ${points} points`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  // Undo winner for versus matches
  async undoMatchWinner(
    matchId: string,
    adminEmail: string,
    adminName: string
  ): Promise<void> {
    const matchRef = doc(db, TEAM_GAMES_COLLECTION, matchId);
    const matchDoc = await getDoc(matchRef);
    
    if (!matchDoc.exists()) throw new Error('Match not found');
    
    const match = matchDoc.data() as UnifiedTeamGame;
    
    if (!match.isVersus) throw new Error('Cannot undo winner for team games');
    
    // Check if there's a winner to undo
    const hasWinner = match.teams.some(team => team.isWinner);
    if (!hasWinner) throw new Error('No winner to undo');
    
    // Update teams array to remove winner and reset points
    const updatedTeams = match.teams.map(team => ({
      ...team,
      isWinner: false,
      points: 0 // Reset points to 0 when undoing
    }));

    await updateDoc(matchRef, {
      teams: updatedTeams,
      updatedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'versus_match_winner_undo',
      details: `Undid winner for match ${match.title}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  // Archive games (sets status to 'archived')
  async archiveGame(gameId: string, adminEmail: string, adminName: string): Promise<void> {
    const gameRef = doc(db, TEAM_GAMES_COLLECTION, gameId);
    await updateDoc(gameRef, {
      status: 'archived',
      updatedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'game_archive',
      details: `Archived game: ${gameId}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  async deleteGame(gameId: string, adminEmail: string, adminName: string): Promise<void> {
    await deleteDoc(doc(db, TEAM_GAMES_COLLECTION, gameId));

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'game_delete',
      details: `Deleted game: ${gameId}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  async updateGameStatus(gameId: string, status: 'active' | 'archived', adminEmail: string, adminName: string): Promise<void> {
    const gameRef = doc(db, TEAM_GAMES_COLLECTION, gameId);
    await updateDoc(gameRef, {
      status,
      updatedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'game_status_update',
      details: `Updated game ${gameId} status to: ${status}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  // Unarchive games (sets status to 'active' - equivalent to unretire)
  async unarchiveGame(gameId: string, adminEmail: string, adminName: string): Promise<void> {
    const gameRef = doc(db, TEAM_GAMES_COLLECTION, gameId);
    await updateDoc(gameRef, {
      status: 'active',
      updatedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'game_unarchive',
      details: `Unarchived game: ${gameId}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  // Update game visibility (showTop5)
  async updateGameVisibility(gameId: string, showTop5: boolean, adminEmail: string, adminName: string): Promise<void> {
    const gameRef = doc(db, TEAM_GAMES_COLLECTION, gameId);
    await updateDoc(gameRef, {
      showTop5,
      showTop3: false, // Ensure these are mutually exclusive
      updatedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'game_visibility',
      details: `Updated game ${gameId} visibility - showTop5: ${showTop5}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },

  // Update game top3 setting
  async updateGameTop3(gameId: string, showTop3: boolean, adminEmail: string, adminName: string): Promise<void> {
    const gameRef = doc(db, TEAM_GAMES_COLLECTION, gameId);
    await updateDoc(gameRef, {
      showTop3,
      showTop5: false, // Ensure these are mutually exclusive
      updatedAt: serverTimestamp()
    });

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'game_top3_update',
      details: `Updated game ${gameId} top3 setting - showTop3: ${showTop3}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  }
};

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

// Unified Config Service 
export const configService = {
  // Get unified config document
  async getGlobalConfig(): Promise<{
    slideDuration: number;
    advancedSlideTiming: AdvancedSlideTiming;
    vignetteSettings: VignetteSettings;
  }> {
    const docRef = doc(db, CONFIG_COLLECTION, 'global');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        slideDuration: data.slideDuration || 7,
        advancedSlideTiming: data.advancedSlideTiming || {
          overallStanding: 7,
          games: 7,
          hallOfChampions: 7,
          grandFinals: 14,
          clusterTeamMatches: 7,
          useAdvanced: false
        },
        vignetteSettings: data.vignetteSettings || {
          enabled: true,
          radius: 30,
          strength: 85
        }
      };
    }
    
    // Return defaults if document doesn't exist
    return {
      slideDuration: 7,
      advancedSlideTiming: {
        overallStanding: 7,
        games: 7,
        hallOfChampions: 7,
        grandFinals: 14,
        clusterTeamMatches: 7,
        useAdvanced: false
      },
      vignetteSettings: {
        enabled: true,
        radius: 30,
        strength: 85
      }
    };
  },

  // Subscribe to unified config
  subscribe(callback: (config: {
    slideDuration: number;
    advancedSlideTiming: AdvancedSlideTiming;
    vignetteSettings: VignetteSettings;
  }) => void) {
    return onSnapshot(doc(db, CONFIG_COLLECTION, 'global'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback({
          slideDuration: data.slideDuration || 7,
          advancedSlideTiming: data.advancedSlideTiming || {
            overallStanding: 7,
            games: 7,
            hallOfChampions: 7,
            grandFinals: 14,
            clusterTeamMatches: 7,
            useAdvanced: false
          },
          vignetteSettings: data.vignetteSettings || {
            enabled: true,
            radius: 30,
            strength: 85
          }
        });
      } else {
        // Default values
        callback({
          slideDuration: 7,
          advancedSlideTiming: {
            overallStanding: 7,
            games: 7,
            hallOfChampions: 7,
            grandFinals: 14,
            clusterTeamMatches: 7,
            useAdvanced: false
          },
          vignetteSettings: {
            enabled: true,
            radius: 30,
            strength: 85
          }
        });
      }
    });
  },

  // Update unified config
  async updateGlobalConfig(
    updates: {
      slideDuration?: number;
      advancedSlideTiming?: AdvancedSlideTiming;
      vignetteSettings?: VignetteSettings;
    },
    adminEmail: string,
    adminName: string
  ): Promise<void> {
    const docRef = doc(db, CONFIG_COLLECTION, 'global');
    const currentConfig = await this.getGlobalConfig();
    
    const newConfig = {
      ...currentConfig,
      ...updates,
      updatedAt: serverTimestamp()
    };

    await setDoc(docRef, newConfig);

    // Log the action
    const adminLogRef = doc(collection(db, ADMIN_LOGS_COLLECTION));
    const updateDetails = [];
    if (updates.slideDuration !== undefined) updateDetails.push(`slide duration: ${updates.slideDuration}s`);
    if (updates.advancedSlideTiming !== undefined) updateDetails.push('advanced slide timing');
    if (updates.vignetteSettings !== undefined) updateDetails.push('vignette settings');
    
    await setDoc(adminLogRef, {
      adminEmail,
      adminName,
      action: 'config_update',
      details: `Updated global config: ${updateDetails.join(', ')}`,
      timestamp: serverTimestamp(),
      approved: true
    });
  },
};
