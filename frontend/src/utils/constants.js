// API Response Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  ADMIN_PASSWORD: 'adminPassword',
  DARK_MODE: 'darkMode',
  SOUND_ENABLED: 'soundEnabled',
  CHAT_PLAYER_NAME: 'chatPlayerName',
  SELECTED_TEAM_ID: 'selectedTeamId',
};

// API Endpoints
export const API_ENDPOINTS = {
  TEAMS: '/api/teams',
  TILES: '/api/tiles',
  PROGRESS: '/api/progress',
  PROOFS: '/api/proofs',
  CONFIG: '/api/config',
  RULES: '/api/rules',
  SYNC: '/api/sync',
  ADMIN: {
    VERIFY: '/api/admin/verify',
    UNDO: '/api/admin/undo',
    ASSIGN_TILE: '/api/admin/assign-tile',
  },
  BINGO: {
    STATUS: '/api/bingo/status',
    START: '/api/bingo/start',
    RESET: '/api/bingo/reset',
  },
};

// Tile Types
export const TILE_TYPES = {
  KILLS: 'kills',
  KC: 'kc',
  LEVEL: 'level',
  XP: 'xp',
  COLLECTION: 'collection',
  CUSTOM: 'custom',
};

// Proof Status
export const PROOF_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Refresh Intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  BINGO_STATUS: 30000,
  CHAT_MESSAGES: 5000,
  LIVE_FEED: 30000,
};
