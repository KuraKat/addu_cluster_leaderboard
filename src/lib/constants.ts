// Database limits and constants
export const DB_LIMITS = {
  MAX_ADMIN_LOGS: 15,
  MAX_TEAM_NAME_LENGTH: 50,
  MAX_GAME_TITLE_LENGTH: 100,
  MAX_TEAMS_PER_GAME: 10,
  MAX_CLUSTERS_PER_TEAM: 4,
  MIN_TEAMS_PER_GAME: 2,
  MAX_POINTS_PER_TEAM: 100000,
  MIN_POINTS_PER_TEAM: 0
} as const;

// Default values
export const DEFAULT_VALUES = {
  SLIDE_DURATION: 7,
  GRAND_FINALS_DURATION: 14,
  VIGNETTE_RADIUS: 30,
  VIGNETTE_STRENGTH: 85,
  INCREMENT_AMOUNT: 1,
  WINNING_POINTS: 10,
  LOSING_POINTS: 5
} as const;

// Error messages
export const ERROR_MESSAGES = {
  // Authentication errors
  AUTH_REQUIRED: 'Authentication required to perform this action',
  ACCESS_DENIED: 'Access denied: Admin privileges required',
  
  // Validation errors
  GAME_TITLE_REQUIRED: 'Game title is required',
  GAME_TITLE_TOO_LONG: 'Game title must be 100 characters or less',
  TEAM_NAME_REQUIRED: 'Team name is required',
  TEAM_NAME_TOO_LONG: 'Team names must be 50 characters or less',
  TEAM_NAME_INVALID_CHARS: 'Team names can only contain letters, numbers, spaces, hyphens, and underscores',
  DUPLICATE_TEAM_NAME: 'Duplicate team name found',
  MIN_TEAMS_REQUIRED: 'At least 2 teams are required',
  MAX_TEAMS_EXCEEDED: 'Maximum 10 teams allowed',
  CLUSTERS_REQUIRED: 'Team must have at least one cluster',
  MAX_CLUSTERS_EXCEEDED: 'Team can have maximum 4 clusters',
  INVALID_CLUSTER: 'Invalid cluster specified',
  DUPLICATE_VERSUS_TEAMS: 'Team A and Team B must have different names',
  
  // Database errors
  GAME_NOT_FOUND: 'Game not found',
  MATCH_NOT_FOUND: 'Match not found',
  DOCUMENT_NOT_FOUND: 'Document not found',
  UPDATE_FAILED: 'Failed to update document',
  CREATE_FAILED: 'Failed to create document',
  DELETE_FAILED: 'Failed to delete document',
  
  // Generic errors
  NETWORK_ERROR: 'Network error occurred',
  UNKNOWN_ERROR: 'An unknown error occurred',
  OPERATION_FAILED: 'Operation failed',
  
  // Firestore specific
  FIRESTORE_ERROR: 'Firestore operation failed',
  TRANSACTION_FAILED: 'Transaction failed',
  PERMISSION_DENIED: 'Permission denied'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  GAME_CREATED: 'Game created successfully',
  GAME_UPDATED: 'Game updated successfully',
  GAME_DELETED: 'Game deleted successfully',
  GAME_RETIRED: 'Game retired successfully',
  GAME_UNRETIRED: 'Game unretired successfully',
  TEAM_GAME_CREATED: 'Team game created successfully',
  VERSUS_MATCH_CREATED: 'Versus match created successfully',
  MATCH_WINNER_SET: 'Match winner set successfully',
  MATCH_WINNER_UNDONE: 'Match winner undone successfully',
  CONFIG_UPDATED: 'Configuration updated successfully'
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  TEAM_NAME: /^[a-zA-Z0-9\s\-_]+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
} as const;
