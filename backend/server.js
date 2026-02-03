import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// JSON file-based database
const DB_PATH = join(__dirname, 'data.json');

const defaultData = {
  teams: [],
  players: [],
  tiles: [],
  progress: [],
  config: { 
    name: 'OSRS Bingo', 
    grid_size: 7, 
    active: true, 
    admin_password: process.env.ADMIN_PASSWORD || 'changeme',
    event_start: null,
    event_end: null,
    event_duration_hours: 168,
    sounds_enabled: true,
    dark_mode: false,
    pot_value: 100000000,
    pot_donor: 'Anonym',
    bingo_started: false
  },
  boards: [],
  proofs: [],
  rules: '',
  history: [],
  actionLog: [],
  chatMessages: [],
  tileVotes: {},
  playerBaselines: {},
  nextIds: { team: 1, player: 1, tile: 1, progress: 1, board: 1, proof: 1, chat: 1 }
};

function loadDB() {
  try {
    if (existsSync(DB_PATH)) {
      return JSON.parse(readFileSync(DB_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error('Error loading DB:', e);
  }
  return { ...defaultData };
}

function saveDB(data) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

let db = loadDB();

// Always use environment variable for admin password if available
function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || db.config.admin_password || 'changeme';
}

// Override db password with env variable on startup
if (process.env.ADMIN_PASSWORD) {
  db.config.admin_password = process.env.ADMIN_PASSWORD;
}

// ============ TEAM ROUTES ============

// Get all teams
app.get('/api/teams', (req, res) => {
  try {
    const teams = db.teams.map(t => ({
      ...t,
      player_count: db.players.filter(p => p.team_id === t.id).length
    }));
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single team with players
app.get('/api/teams/:id', (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const team = db.teams.find(t => t.id === teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    const players = db.players.filter(p => p.team_id === teamId);
    res.json({ ...team, players });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create team
app.post('/api/teams', (req, res) => {
  try {
    const { name, color, logo_url } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Team name is required' });
    }
    if (db.teams.some(t => t.name === name)) {
      return res.status(400).json({ error: 'Team name already exists' });
    }
    const team = {
      id: db.nextIds.team++,
      name,
      color: color || '#3b82f6',
      logo_url: logo_url || '',
      created_at: new Date().toISOString()
    };
    db.teams.push(team);
    saveDB(db);
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update team
app.put('/api/teams/:id', (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const { name, color, logo_url } = req.body;
    const team = db.teams.find(t => t.id === teamId);
    if (team) {
      if (name) team.name = name;
      if (color) team.color = color;
      if (logo_url !== undefined) team.logo_url = logo_url;
      saveDB(db);
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete team
app.delete('/api/teams/:id', (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    db.teams = db.teams.filter(t => t.id !== teamId);
    db.players = db.players.filter(p => p.team_id !== teamId);
    db.progress = db.progress.filter(p => p.team_id !== teamId);
    saveDB(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PLAYER ROUTES ============

// Add player to team
app.post('/api/teams/:teamId/players', (req, res) => {
  try {
    const { username } = req.body;
    const teamId = parseInt(req.params.teamId);
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    if (db.players.some(p => p.username === username && p.team_id === teamId)) {
      return res.status(400).json({ error: 'Player already in this team' });
    }

    const player = {
      id: db.nextIds.player++,
      username,
      team_id: teamId,
      wom_id: null,
      created_at: new Date().toISOString()
    };
    db.players.push(player);
    saveDB(db);
    res.status(201).json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove player from team
app.delete('/api/players/:id', (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    db.players = db.players.filter(p => p.id !== playerId);
    saveDB(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all players
app.get('/api/players', (req, res) => {
  try {
    const players = db.players.map(p => {
      const team = db.teams.find(t => t.id === p.team_id);
      return { ...p, team_name: team?.name, team_color: team?.color };
    });
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ BINGO TILE ROUTES ============

// Get all tiles
app.get('/api/tiles', (req, res) => {
  try {
    const tiles = [...db.tiles].sort((a, b) => a.position - b.position);
    res.json(tiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create tile
app.post('/api/tiles', (req, res) => {
  try {
    const { name, description, type, metric, target_value, points, image_url, position } = req.body;
    const tile = {
      id: db.nextIds.tile++,
      name,
      description: description || '',
      type: type || 'kills',
      metric: metric || '',
      target_value: target_value || 1,
      points: points || 1,
      image_url: image_url || '',
      position: position ?? db.tiles.length
    };
    db.tiles.push(tile);
    saveDB(db);
    res.status(201).json(tile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update tile
app.put('/api/tiles/:id', (req, res) => {
  try {
    const tileId = parseInt(req.params.id);
    const { name, description, type, metric, target_value, points, image_url, position } = req.body;
    const tile = db.tiles.find(t => t.id === tileId);
    if (tile) {
      if (name !== undefined) tile.name = name;
      if (description !== undefined) tile.description = description;
      if (type !== undefined) tile.type = type;
      if (metric !== undefined) tile.metric = metric;
      if (target_value !== undefined) tile.target_value = target_value;
      if (points !== undefined) tile.points = points;
      if (image_url !== undefined) tile.image_url = image_url;
      if (position !== undefined) tile.position = position;
      saveDB(db);
    }
    res.json(tile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete tile
app.delete('/api/tiles/:id', (req, res) => {
  try {
    const tileId = parseInt(req.params.id);
    db.tiles = db.tiles.filter(t => t.id !== tileId);
    db.progress = db.progress.filter(p => p.tile_id !== tileId);
    saveDB(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk create tiles
app.post('/api/tiles/bulk', (req, res) => {
  try {
    const { tiles } = req.body;
    for (const tileData of tiles) {
      const existing = db.tiles.find(t => t.position === tileData.position);
      if (existing) {
        Object.assign(existing, tileData);
      } else {
        const tile = {
          id: db.nextIds.tile++,
          name: tileData.name,
          description: tileData.description || '',
          type: tileData.type || 'kills',
          metric: tileData.metric || '',
          target_value: tileData.target_value || 1,
          points: tileData.points || 1,
          image_url: tileData.image_url || '',
          position: tileData.position
        };
        db.tiles.push(tile);
      }
    }
    saveDB(db);
    const allTiles = [...db.tiles].sort((a, b) => a.position - b.position);
    res.status(201).json(allTiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete ALL tiles
app.delete('/api/tiles/all', (req, res) => {
  try {
    db.tiles = [];
    db.progress = [];
    saveDB(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PROGRESS ROUTES ============

// Get tile progress for all teams
app.get('/api/progress', (req, res) => {
  try {
    const progress = db.progress.map(p => {
      const team = db.teams.find(t => t.id === p.team_id);
      const tile = db.tiles.find(t => t.id === p.tile_id);
      return {
        ...p,
        team_name: team?.name,
        team_color: team?.color,
        tile_name: tile?.name
      };
    });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get progress for specific tile
app.get('/api/tiles/:tileId/progress', (req, res) => {
  try {
    const tileId = parseInt(req.params.tileId);
    const progress = db.progress
      .filter(p => p.tile_id === tileId)
      .map(p => {
        const team = db.teams.find(t => t.id === p.team_id);
        return { ...p, team_name: team?.name, team_color: team?.color };
      })
      .sort((a, b) => b.current_value - a.current_value);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update progress for a tile/team
app.post('/api/progress', (req, res) => {
  try {
    const { tile_id, team_id, current_value, completed } = req.body;
    
    const existing = db.progress.find(p => p.tile_id === tile_id && p.team_id === team_id);
    if (existing) {
      existing.current_value = current_value;
      existing.completed = completed;
      existing.completed_at = completed ? new Date().toISOString() : null;
    } else {
      db.progress.push({
        id: db.nextIds.progress++,
        tile_id,
        team_id,
        current_value,
        completed,
        completed_at: completed ? new Date().toISOString() : null
      });
    }
    saveDB(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SCOREBOARD ============

app.get('/api/scoreboard', (req, res) => {
  try {
    const scoreboard = db.teams.map(team => {
      const teamProgress = db.progress.filter(p => p.team_id === team.id && p.completed);
      const total_points = teamProgress.reduce((sum, p) => {
        const tile = db.tiles.find(t => t.id === p.tile_id);
        return sum + (tile?.points || 0);
      }, 0);
      return {
        id: team.id,
        name: team.name,
        color: team.color,
        total_points,
        tiles_completed: teamProgress.length
      };
    }).sort((a, b) => b.total_points - a.total_points || b.tiles_completed - a.tiles_completed);
    res.json(scoreboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ BINGO CONFIG ============

app.get('/api/config', (req, res) => {
  try {
    res.json(db.config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/config', (req, res) => {
  try {
    const { name, start_date, end_date, grid_size } = req.body;
    if (name !== undefined) db.config.name = name;
    if (start_date !== undefined) db.config.start_date = start_date;
    if (end_date !== undefined) db.config.end_date = end_date;
    if (grid_size !== undefined) db.config.grid_size = grid_size;
    saveDB(db);
    res.json(db.config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ WISE OLD MAN PROXY ============

app.get('/api/wom/player/:username', async (req, res) => {
  try {
    const response = await fetch(`https://api.wiseoldman.net/v2/players/${encodeURIComponent(req.params.username)}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/wom/player/:username/gained', async (req, res) => {
  try {
    const { period } = req.query;
    const url = `https://api.wiseoldman.net/v2/players/${encodeURIComponent(req.params.username)}/gained?period=${period || 'week'}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/wom/player/:username/update', async (req, res) => {
  try {
    const response = await fetch(`https://api.wiseoldman.net/v2/players/${encodeURIComponent(req.params.username)}`, {
      method: 'POST'
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync player data from WOM and update tile progress (using BASELINE comparison)
app.post('/api/sync', async (req, res) => {
  try {
    const results = [];
    const playerCurrentStats = {};
    
    if (!db.playerBaselines) db.playerBaselines = {};
    const hasBaselines = Object.keys(db.playerBaselines).length > 0;
    
    // Fetch current stats for all players from WOM
    for (const player of db.players) {
      try {
        const response = await fetch(
          `https://api.wiseoldman.net/v2/players/${encodeURIComponent(player.username)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          playerCurrentStats[player.username.toLowerCase()] = {
            skills: data.latestSnapshot?.data?.skills || {},
            bosses: data.latestSnapshot?.data?.bosses || {},
            activities: data.latestSnapshot?.data?.activities || {}
          };
          results.push({ username: player.username, success: true });
        } else {
          results.push({ username: player.username, success: false, error: 'Player not found' });
        }
      } catch (e) {
        results.push({ username: player.username, success: false, error: e.message });
      }
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    // Update progress for each team based on gains from baseline
    for (const team of db.teams) {
      const teamPlayers = db.players.filter(p => p.team_id === team.id);
      
      for (const tile of db.tiles) {
        let totalValue = 0;
        
        // Calculate total gained value from all team players
        for (const player of teamPlayers) {
          const username = player.username.toLowerCase();
          const current = playerCurrentStats[username];
          const baseline = db.playerBaselines[username];
          
          if (!current) continue;
          
          // Get value based on tile type and metric
          if (tile.type === 'xp' && tile.metric) {
            const skillName = tile.metric.toLowerCase();
            const currentXP = current.skills?.[skillName]?.experience || 0;
            const baselineXP = baseline?.skills?.[skillName]?.experience || 0;
            const gained = hasBaselines ? Math.max(0, currentXP - baselineXP) : currentXP;
            totalValue += gained;
          } else if (tile.type === 'level' && tile.metric) {
            const skillName = tile.metric.toLowerCase();
            const currentLevel = current.skills?.[skillName]?.level || 0;
            const baselineLevel = baseline?.skills?.[skillName]?.level || 0;
            const gained = hasBaselines ? Math.max(0, currentLevel - baselineLevel) : currentLevel;
            totalValue += gained;
          } else if (tile.type === 'kills' && tile.metric) {
            const bossName = tile.metric.toLowerCase();
            const currentKills = current.bosses?.[bossName]?.kills || 0;
            const baselineKills = baseline?.bosses?.[bossName]?.kills || 0;
            const gained = hasBaselines ? Math.max(0, currentKills - baselineKills) : currentKills;
            totalValue += gained;
          }
        }
        
        // Update or create progress entry
        let progress = db.progress.find(p => p.team_id === team.id && p.tile_id === tile.id);
        if (!progress) {
          progress = {
            id: db.nextIds.progress++,
            team_id: team.id,
            tile_id: tile.id,
            current_value: 0,
            completed: false
          };
          db.progress.push(progress);
        }
        
        progress.current_value = totalValue;
        progress.completed = totalValue >= (tile.target_value || 1);
      }
    }
    
    saveDB(db);
    res.json({ 
      success: true, 
      players: results, 
      using_baselines: hasBaselines,
      message: hasBaselines ? 'Progress updated from baseline' : 'Progress updated (no baseline - showing totals)'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ START BINGO ============

// Start bingo - capture baseline stats for all players
app.post('/api/bingo/start', async (req, res) => {
  try {
    const { admin_password, duration_hours } = req.body;
    if (admin_password !== db.config.admin_password) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const results = [];
    if (!db.playerBaselines) db.playerBaselines = {};

    // Fetch current stats for all players as baseline
    for (const player of db.players) {
      try {
        const response = await fetch(
          `https://api.wiseoldman.net/v2/players/${encodeURIComponent(player.username)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          // Store baseline stats
          db.playerBaselines[player.username.toLowerCase()] = {
            captured_at: new Date().toISOString(),
            skills: data.latestSnapshot?.data?.skills || {},
            bosses: data.latestSnapshot?.data?.bosses || {},
            activities: data.latestSnapshot?.data?.activities || {}
          };
          
          results.push({ username: player.username, success: true });
        } else {
          results.push({ username: player.username, success: false, error: 'Player not found' });
        }
      } catch (e) {
        results.push({ username: player.username, success: false, error: e.message });
      }
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    // Set event times
    const now = new Date();
    const hours = duration_hours || db.config.event_duration_hours || 168;
    const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
    
    db.config.event_start = now.toISOString();
    db.config.event_end = endTime.toISOString();
    db.config.bingo_started = true;

    // Clear all existing progress
    db.progress = [];

    saveDB(db);
    res.json({ 
      success: true, 
      players: results, 
      event_start: db.config.event_start,
      event_end: db.config.event_end,
      message: `Bingo started! Baselines captured for ${results.filter(r => r.success).length} players`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset/Stop bingo
app.post('/api/bingo/reset', (req, res) => {
  try {
    const { admin_password } = req.body;
    if (admin_password !== db.config.admin_password) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    db.config.event_start = null;
    db.config.event_end = null;
    db.config.bingo_started = false;
    db.playerBaselines = {};
    db.progress = [];

    saveDB(db);
    res.json({ success: true, message: 'Bingo reset' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bingo status
app.get('/api/bingo/status', (req, res) => {
  try {
    res.json({
      started: db.config.bingo_started || false,
      event_start: db.config.event_start,
      event_end: db.config.event_end,
      baselines_count: Object.keys(db.playerBaselines || {}).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SAVED BOARDS ============

// Get all saved boards
app.get('/api/boards', (req, res) => {
  try {
    if (!db.boards) db.boards = [];
    res.json(db.boards.map(b => ({ id: b.id, name: b.name, created_at: b.created_at })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save current board
app.post('/api/boards', (req, res) => {
  try {
    const { name } = req.body;
    if (!db.boards) db.boards = [];
    if (!db.nextIds.board) db.nextIds.board = 1;
    
    const board = {
      id: db.nextIds.board++,
      name: name || `Board ${db.boards.length + 1}`,
      tiles: JSON.parse(JSON.stringify(db.tiles)),
      progress: JSON.parse(JSON.stringify(db.progress)),
      created_at: new Date().toISOString()
    };
    db.boards.push(board);
    saveDB(db);
    res.status(201).json({ id: board.id, name: board.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Load a saved board
app.post('/api/boards/:id/load', (req, res) => {
  try {
    const boardId = parseInt(req.params.id);
    const board = db.boards?.find(b => b.id === boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    db.tiles = JSON.parse(JSON.stringify(board.tiles));
    db.progress = JSON.parse(JSON.stringify(board.progress));
    saveDB(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a saved board
app.delete('/api/boards/:id', (req, res) => {
  try {
    const boardId = parseInt(req.params.id);
    if (db.boards) {
      db.boards = db.boards.filter(b => b.id !== boardId);
      saveDB(db);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PROOFS / CHAT ============

// Get all proofs for a tile
app.get('/api/tiles/:tileId/proofs', (req, res) => {
  try {
    const tileId = parseInt(req.params.tileId);
    if (!db.proofs) db.proofs = [];
    const proofs = db.proofs
      .filter(p => p.tile_id === tileId)
      .map(p => {
        const team = db.teams.find(t => t.id === p.team_id);
        return { ...p, team_name: team?.name, team_color: team?.color };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(proofs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all proofs
app.get('/api/proofs', (req, res) => {
  try {
    if (!db.proofs) db.proofs = [];
    const proofs = db.proofs.map(p => {
      const team = db.teams.find(t => t.id === p.team_id);
      const tile = db.tiles.find(t => t.id === p.tile_id);
      return { ...p, team_name: team?.name, team_color: team?.color, tile_name: tile?.name };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(proofs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit a proof
app.post('/api/proofs', (req, res) => {
  try {
    const { tile_id, team_id, image_url, message, player_name, count } = req.body;
    if (!db.proofs) db.proofs = [];
    if (!db.nextIds.proof) db.nextIds.proof = 1;
    
    const proof = {
      id: db.nextIds.proof++,
      tile_id,
      team_id,
      image_url: image_url || '',
      message: message || '',
      player_name: player_name || 'Unknown',
      count: count || 1,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    db.proofs.push(proof);
    saveDB(db);
    res.status(201).json(proof);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Approve/reject proof and assign tile
app.put('/api/proofs/:id', (req, res) => {
  try {
    const proofId = parseInt(req.params.id);
    const { status, admin_password } = req.body;
    
    if (admin_password !== db.config.admin_password) {
      return res.status(403).json({ error: 'Invalid admin password' });
    }
    
    const proof = db.proofs?.find(p => p.id === proofId);
    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }
    
    proof.status = status;
    
    if (status === 'approved') {
      const tile = db.tiles.find(t => t.id === proof.tile_id);
      const isCollection = tile?.type === 'collection';
      const countToAdd = proof.count || 1;
      
      const existing = db.progress.find(p => p.tile_id === proof.tile_id && p.team_id === proof.team_id);
      
      if (isCollection) {
        // Collection type: add to counter
        if (existing) {
          existing.current_value = (existing.current_value || 0) + countToAdd;
        } else {
          db.progress.push({
            id: db.nextIds.progress++,
            tile_id: proof.tile_id,
            team_id: proof.team_id,
            current_value: countToAdd,
            completed: false,
            completed_at: null
          });
        }
        
        // Update who "owns" the tile based on highest count
        const allProgress = db.progress.filter(p => p.tile_id === proof.tile_id);
        const highest = allProgress.reduce((max, p) => p.current_value > max.current_value ? p : max, { current_value: 0 });
        
        // Mark the leader as "completed" (owns the tile)
        allProgress.forEach(p => {
          p.completed = (p.team_id === highest.team_id && highest.current_value > 0);
          if (p.completed) p.completed_at = new Date().toISOString();
        });
      } else {
        // Normal type: first to complete wins
        if (existing) {
          existing.current_value = (existing.current_value || 0) + countToAdd;
          existing.completed = true;
          existing.completed_at = new Date().toISOString();
        } else {
          db.progress.push({
            id: db.nextIds.progress++,
            tile_id: proof.tile_id,
            team_id: proof.team_id,
            current_value: countToAdd,
            completed: true,
            completed_at: new Date().toISOString()
          });
        }
      }
    }
    
    saveDB(db);
    res.json(proof);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete proof
app.delete('/api/proofs/:id', (req, res) => {
  try {
    const proofId = parseInt(req.params.id);
    if (db.proofs) {
      db.proofs = db.proofs.filter(p => p.id !== proofId);
      saveDB(db);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ADMIN ============

// Verify admin password
app.post('/api/admin/verify', (req, res) => {
  try {
    const { password } = req.body;
    const isValid = password === db.config.admin_password;
    res.json({ valid: isValid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Manually assign tile to team
app.post('/api/admin/assign-tile', (req, res) => {
  try {
    const { tile_id, team_id, admin_password } = req.body;
    
    if (admin_password !== db.config.admin_password) {
      return res.status(403).json({ error: 'Invalid admin password' });
    }
    
    // Remove any existing completion for this tile
    db.progress = db.progress.filter(p => !(p.tile_id === tile_id && p.completed));
    
    // Assign to new team
    const existing = db.progress.find(p => p.tile_id === tile_id && p.team_id === team_id);
    if (existing) {
      existing.completed = true;
      existing.completed_at = new Date().toISOString();
    } else {
      db.progress.push({
        id: db.nextIds.progress++,
        tile_id,
        team_id,
        current_value: 1,
        completed: true,
        completed_at: new Date().toISOString()
      });
    }
    
    saveDB(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Change password
app.put('/api/admin/password', (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    
    if (old_password !== db.config.admin_password) {
      return res.status(403).json({ error: 'Invalid current password' });
    }
    
    db.config.admin_password = new_password;
    saveDB(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Adjust collection counter manually
app.post('/api/admin/adjust-counter', (req, res) => {
  try {
    const { tile_id, team_id, adjustment, admin_password } = req.body;
    
    if (admin_password !== db.config.admin_password) {
      return res.status(403).json({ error: 'Invalid admin password' });
    }
    
    const existing = db.progress.find(p => p.tile_id === tile_id && p.team_id === team_id);
    
    if (existing) {
      existing.current_value = Math.max(0, (existing.current_value || 0) + adjustment);
    } else {
      db.progress.push({
        id: db.nextIds.progress++,
        tile_id,
        team_id,
        current_value: Math.max(0, adjustment),
        completed: false,
        completed_at: null
      });
    }
    
    // Recalculate leader for collection tiles
    const tile = db.tiles.find(t => t.id === tile_id);
    if (tile?.type === 'collection') {
      const allProgress = db.progress.filter(p => p.tile_id === tile_id);
      const highest = allProgress.reduce((max, p) => p.current_value > max.current_value ? p : max, { current_value: 0 });
      
      allProgress.forEach(p => {
        p.completed = (p.team_id === highest.team_id && highest.current_value > 0);
        if (p.completed) p.completed_at = new Date().toISOString();
      });
    }
    
    saveDB(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get rules
app.get('/api/rules', (req, res) => {
  try {
    res.json({ rules: db.rules || '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update rules (admin only)
app.put('/api/rules', (req, res) => {
  try {
    const { rules, admin_password } = req.body;
    
    if (admin_password !== db.config.admin_password) {
      return res.status(403).json({ error: 'Invalid admin password' });
    }
    
    db.rules = rules;
    saveDB(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get approved proofs for live feed
app.get('/api/proofs/approved', (req, res) => {
  try {
    if (!db.proofs) db.proofs = [];
    const proofs = db.proofs
      .filter(p => p.status === 'approved')
      .map(p => {
        const team = db.teams.find(t => t.id === p.team_id);
        const tile = db.tiles.find(t => t.id === p.tile_id);
        return { ...p, team_name: team?.name, team_color: team?.color, team_logo: team?.logo_url, tile_name: tile?.name, tile_image: tile?.image_url };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 50); // Last 50 approved proofs
    res.json(proofs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get score history for graphs
app.get('/api/history', (req, res) => {
  try {
    if (!db.history) db.history = [];
    res.json(db.history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record score snapshot (called periodically or on changes)
app.post('/api/history/snapshot', (req, res) => {
  try {
    if (!db.history) db.history = [];
    
    const snapshot = {
      timestamp: new Date().toISOString(),
      scores: db.teams.map(team => {
        const teamProgress = db.progress.filter(p => p.team_id === team.id && p.completed);
        const points = teamProgress.reduce((sum, p) => {
          const tile = db.tiles.find(t => t.id === p.tile_id);
          return sum + (tile?.points || 0);
        }, 0);
        return { team_id: team.id, team_name: team.name, team_color: team.color, points };
      })
    };
    
    db.history.push(snapshot);
    // Keep last 1000 snapshots
    if (db.history.length > 1000) db.history = db.history.slice(-1000);
    saveDB(db);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get/Update event config (timer, etc.)
app.get('/api/config', (req, res) => {
  try {
    res.json(db.config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/config', (req, res) => {
  try {
    const { admin_password, ...updates } = req.body;
    
    if (admin_password !== db.config.admin_password) {
      return res.status(403).json({ error: 'Invalid admin password' });
    }
    
    db.config = { ...db.config, ...updates };
    saveDB(db);
    res.json(db.config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Undo last action
app.post('/api/admin/undo', (req, res) => {
  try {
    const { admin_password } = req.body;
    
    if (admin_password !== db.config.admin_password) {
      return res.status(403).json({ error: 'Invalid admin password' });
    }
    
    if (!db.actionLog || db.actionLog.length === 0) {
      return res.status(400).json({ error: 'No actions to undo' });
    }
    
    const lastAction = db.actionLog.pop();
    
    // Restore previous state based on action type
    if (lastAction.type === 'proof_approved') {
      // Find and unapprove the proof
      const proof = db.proofs.find(p => p.id === lastAction.proof_id);
      if (proof) {
        proof.status = 'pending';
      }
      // Remove the progress
      const progressIdx = db.progress.findIndex(p => 
        p.tile_id === lastAction.tile_id && p.team_id === lastAction.team_id
      );
      if (progressIdx !== -1) {
        db.progress.splice(progressIdx, 1);
      }
    }
    
    saveDB(db);
    res.json({ success: true, undone: lastAction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export data as JSON (can be converted to CSV on frontend)
app.get('/api/export', (req, res) => {
  try {
    const exportData = {
      teams: db.teams.map(t => ({
        name: t.name,
        color: t.color,
        players: db.players.filter(p => p.team_id === t.id).map(p => p.username),
        completed_tiles: db.progress.filter(p => p.team_id === t.id && p.completed).length,
        total_points: db.progress
          .filter(p => p.team_id === t.id && p.completed)
          .reduce((sum, p) => {
            const tile = db.tiles.find(ti => ti.id === p.tile_id);
            return sum + (tile?.points || 0);
          }, 0)
      })),
      tiles: db.tiles.map(t => ({
        name: t.name,
        type: t.type,
        points: t.points,
        completed_by: db.progress
          .filter(p => p.tile_id === t.id && p.completed)
          .map(p => db.teams.find(te => te.id === p.team_id)?.name)
      })),
      history: db.history,
      event: {
        name: db.config.name,
        start: db.config.event_start,
        end: db.config.event_end
      }
    };
    res.json(exportData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get achievements/badges
app.get('/api/achievements', (req, res) => {
  try {
    const achievements = [];
    
    // First Blood - first team to complete any tile
    const firstCompletion = db.progress
      .filter(p => p.completed)
      .sort((a, b) => new Date(a.completed_at || a.created_at) - new Date(b.completed_at || b.created_at))[0];
    
    if (firstCompletion) {
      const team = db.teams.find(t => t.id === firstCompletion.team_id);
      if (team) {
        achievements.push({
          id: 'first_blood',
          name: 'First Blood',
          description: 'Første hold til at fuldføre et felt',
          team_id: team.id,
          team_name: team.name,
          team_color: team.color,
          icon: '🩸'
        });
      }
    }
    
    // Most Tiles - team with most completed tiles
    const tileCounts = {};
    db.progress.filter(p => p.completed).forEach(p => {
      tileCounts[p.team_id] = (tileCounts[p.team_id] || 0) + 1;
    });
    
    const mostTilesTeamId = Object.entries(tileCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    
    if (mostTilesTeamId) {
      const team = db.teams.find(t => t.id === parseInt(mostTilesTeamId));
      if (team) {
        achievements.push({
          id: 'most_tiles',
          name: 'Tile Master',
          description: `Flest fuldførte felter (${tileCounts[mostTilesTeamId]})`,
          team_id: team.id,
          team_name: team.name,
          team_color: team.color,
          icon: '🏆'
        });
      }
    }
    
    // Speed Demon - fastest tile completion (if we have timing data)
    // Point Leader - highest points
    const pointCounts = {};
    db.progress.filter(p => p.completed).forEach(p => {
      const tile = db.tiles.find(t => t.id === p.tile_id);
      pointCounts[p.team_id] = (pointCounts[p.team_id] || 0) + (tile?.points || 0);
    });
    
    const topPointsTeamId = Object.entries(pointCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    
    if (topPointsTeamId) {
      const team = db.teams.find(t => t.id === parseInt(topPointsTeamId));
      if (team) {
        achievements.push({
          id: 'point_leader',
          name: 'Point Leader',
          description: `Højeste point total (${pointCounts[topPointsTeamId]})`,
          team_id: team.id,
          team_name: team.name,
          team_color: team.color,
          icon: '⭐'
        });
      }
    }
    
    // Boss Slayer - most boss kills tiles
    const bossKills = {};
    db.progress.filter(p => p.completed).forEach(p => {
      const tile = db.tiles.find(t => t.id === p.tile_id);
      if (tile?.type === 'kills' || tile?.type === 'kc') {
        bossKills[p.team_id] = (bossKills[p.team_id] || 0) + 1;
      }
    });
    
    const bossSlayerTeamId = Object.entries(bossKills)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    
    if (bossSlayerTeamId && bossKills[bossSlayerTeamId] > 0) {
      const team = db.teams.find(t => t.id === parseInt(bossSlayerTeamId));
      if (team) {
        achievements.push({
          id: 'boss_slayer',
          name: 'Boss Slayer',
          description: `Flest boss kills (${bossKills[bossSlayerTeamId]})`,
          team_id: team.id,
          team_name: team.name,
          team_color: team.color,
          icon: '⚔️'
        });
      }
    }
    
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get MVP per team
app.get('/api/mvp', (req, res) => {
  try {
    const mvps = [];
    
    db.teams.forEach(team => {
      // Count proofs submitted and approved per player
      const playerContributions = {};
      
      db.proofs
        .filter(p => p.team_id === team.id && p.status === 'approved')
        .forEach(p => {
          playerContributions[p.player_name] = (playerContributions[p.player_name] || 0) + 1;
        });
      
      const topPlayer = Object.entries(playerContributions)
        .sort((a, b) => b[1] - a[1])[0];
      
      if (topPlayer) {
        mvps.push({
          team_id: team.id,
          team_name: team.name,
          team_color: team.color,
          player_name: topPlayer[0],
          contributions: topPlayer[1]
        });
      }
    });
    
    res.json(mvps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CHAT ENDPOINTS ============

// Get chat messages for a team
app.get('/api/chat/:teamId', (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    if (!db.chatMessages) db.chatMessages = [];
    const messages = db.chatMessages
      .filter(m => m.team_id === teamId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-100); // Last 100 messages
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Post a chat message
app.post('/api/chat', (req, res) => {
  try {
    const { team_id, player_name, message } = req.body;
    if (!team_id || !player_name || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!db.chatMessages) db.chatMessages = [];
    if (!db.nextIds.chat) db.nextIds.chat = 1;
    
    const newMessage = {
      id: db.nextIds.chat++,
      team_id: parseInt(team_id),
      player_name,
      message: message.slice(0, 500), // Limit message length
      timestamp: new Date().toISOString()
    };
    
    db.chatMessages.push(newMessage);
    // Keep only last 500 messages per team
    const teamMessages = db.chatMessages.filter(m => m.team_id === parseInt(team_id));
    if (teamMessages.length > 500) {
      const toRemove = teamMessages.slice(0, teamMessages.length - 500);
      db.chatMessages = db.chatMessages.filter(m => !toRemove.includes(m));
    }
    
    saveDB(db);
    res.json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ TILE VOTING ENDPOINTS ============

// Get votes for all tiles
app.get('/api/votes', (req, res) => {
  try {
    if (!db.tileVotes) db.tileVotes = {};
    res.json(db.tileVotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get votes for a specific team
app.get('/api/votes/:teamId', (req, res) => {
  try {
    const teamId = req.params.teamId;
    if (!db.tileVotes) db.tileVotes = {};
    const teamVotes = {};
    
    Object.entries(db.tileVotes).forEach(([tileId, votes]) => {
      const teamTileVotes = votes.filter(v => v.team_id === parseInt(teamId));
      if (teamTileVotes.length > 0) {
        teamVotes[tileId] = teamTileVotes.length;
      }
    });
    
    res.json(teamVotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vote for a tile
app.post('/api/votes', (req, res) => {
  try {
    const { tile_id, team_id, player_name } = req.body;
    if (!tile_id || !team_id || !player_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!db.tileVotes) db.tileVotes = {};
    if (!db.tileVotes[tile_id]) db.tileVotes[tile_id] = [];
    
    // Check if player already voted for this tile
    const existingVote = db.tileVotes[tile_id].find(
      v => v.team_id === parseInt(team_id) && v.player_name === player_name
    );
    
    if (existingVote) {
      // Remove vote (toggle)
      db.tileVotes[tile_id] = db.tileVotes[tile_id].filter(
        v => !(v.team_id === parseInt(team_id) && v.player_name === player_name)
      );
    } else {
      // Add vote
      db.tileVotes[tile_id].push({
        team_id: parseInt(team_id),
        player_name,
        timestamp: new Date().toISOString()
      });
    }
    
    saveDB(db);
    res.json({ success: true, votes: db.tileVotes[tile_id]?.length || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ POT VALUE ENDPOINTS ============

// Get pot value
app.get('/api/pot', (req, res) => {
  try {
    res.json({
      value: db.config.pot_value || 0,
      donor: db.config.pot_donor || 'Anonym'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update pot value (admin only)
app.put('/api/pot', (req, res) => {
  try {
    const { admin_password, value, donor } = req.body;
    if (admin_password !== db.config.admin_password) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    if (value !== undefined) db.config.pot_value = parseInt(value);
    if (donor !== undefined) db.config.pot_donor = donor;
    
    saveDB(db);
    res.json({ success: true, value: db.config.pot_value, donor: db.config.pot_donor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
