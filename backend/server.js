import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://aikkggrnddyjjbprvkwm.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpa2tnZ3JuZGR5ampicHJ2a3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1ODM4NzcsImV4cCI6MjA1NDE1OTg3N30.sb_publishable_N2t-kXVQqOnsNWNoIrs4mw_fcbWxbDr';
const supabase = createClient(supabaseUrl, supabaseKey);

// Default passwords from env
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const SITE_PIN = process.env.SITE_PIN || '1234';

console.log('Connected to Supabase:', supabaseUrl);

// ============ HELPER FUNCTIONS ============

async function logActivity(action, details, actor = 'System') {
  try {
    await supabase.from('action_logs').insert({ action, details, actor });
  } catch (e) {
    console.error('Error logging activity:', e);
  }
}

async function getConfig() {
  const { data, error } = await supabase.from('config').select('*').limit(1);
  
  if (error || !data || data.length === 0) {
    // Create default config if none exists
    const defaultConfig = { 
      admin_password: ADMIN_PASSWORD, 
      site_pin: SITE_PIN,
      name: 'OSRS Bingo',
      grid_size: 7
    };
    await supabase.from('config').insert(defaultConfig);
    return defaultConfig;
  }
  
  return data[0];
}

// ============ TEAM ROUTES ============

app.get('/api/teams', async (req, res) => {
  try {
    const { data: teams } = await supabase.from('teams').select('*');
    const { data: players } = await supabase.from('players').select('*');
    
    const teamsWithMembers = (teams || []).map(t => {
      const teamPlayers = (players || []).filter(p => p.team_id === t.id);
      return {
        ...t,
        player_count: teamPlayers.length,
        members: teamPlayers.map(p => p.username)
      };
    });
    res.json(teamsWithMembers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/teams/:id', async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const { data: team } = await supabase.from('teams').select('*').eq('id', teamId).single();
    if (!team) return res.status(404).json({ error: 'Team not found' });
    
    const { data: players } = await supabase.from('players').select('*').eq('team_id', teamId);
    res.json({ ...team, players: players || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/teams', async (req, res) => {
  try {
    const { name, color, logo_url } = req.body;
    if (!name) return res.status(400).json({ error: 'Team name is required' });
    
    const { data: existing } = await supabase.from('teams').select('id').eq('name', name);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Team name already exists' });
    }
    
    const { data: team, error } = await supabase.from('teams')
      .insert({ name, color: color || '#3b82f6', logo_url })
      .select()
      .single();
    
    if (error) throw error;
    await logActivity('TEAM_CREATED', `Hold "${name}" oprettet`);
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/teams/:id', async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    const { name, color, logo_url } = req.body;
    
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (color !== undefined) updates.color = color;
    if (logo_url !== undefined) updates.logo_url = logo_url;
    
    const { data: team, error } = await supabase.from('teams')
      .update(updates)
      .eq('id', teamId)
      .select()
      .single();
    
    if (error) throw error;
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/teams/:id', async (req, res) => {
  try {
    const teamId = parseInt(req.params.id);
    
    // Remove team association from players
    await supabase.from('players').update({ team_id: null }).eq('team_id', teamId);
    // Delete progress
    await supabase.from('progress').delete().eq('team_id', teamId);
    // Delete team
    await supabase.from('teams').delete().eq('id', teamId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PLAYER ROUTES ============

app.get('/api/players', async (req, res) => {
  try {
    const { data: players } = await supabase.from('players').select('*');
    res.json(players || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/players', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required' });
    
    const { data: existing } = await supabase.from('players').select('id').eq('username', username);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Player already exists' });
    }
    
    const { data: player, error } = await supabase.from('players')
      .insert({ username })
      .select()
      .single();
    
    if (error) throw error;
    await logActivity('PLAYER_ADDED', `Spiller "${username}" tilføjet til pulje`);
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/teams/:teamId/players', async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const { username } = req.body;
    
    // Check if player already exists
    const { data: existing } = await supabase.from('players').select('*').eq('username', username);
    
    if (existing && existing.length > 0) {
      // Update existing player's team
      const { data: player, error } = await supabase.from('players')
        .update({ team_id: teamId })
        .eq('id', existing[0].id)
        .select()
        .single();
      if (error) throw error;
      return res.json(player);
    }
    
    // Create new player
    const { data: player, error } = await supabase.from('players')
      .insert({ username, team_id: teamId })
      .select()
      .single();
    
    if (error) throw error;
    await logActivity('PLAYER_ADDED', `Spiller "${username}" tilføjet`);
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/players/:id/team', async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    const { team_id } = req.body;
    
    const { data: player, error } = await supabase.from('players')
      .update({ team_id: team_id || null })
      .eq('id', playerId)
      .select()
      .single();
    
    if (error) throw error;
    
    if (team_id) {
      const { data: team } = await supabase.from('teams').select('name').eq('id', team_id).single();
      await logActivity('PLAYER_ASSIGNED', `"${player.username}" tildelt til "${team?.name}"`);
    } else {
      await logActivity('PLAYER_REMOVED', `"${player.username}" fjernet fra hold`);
    }
    
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/players/:id', async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    
    const { data: player } = await supabase.from('players').select('username').eq('id', playerId).single();
    await supabase.from('players').delete().eq('id', playerId);
    
    if (player) {
      await logActivity('PLAYER_DELETED', `Spiller "${player.username}" slettet`);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ TILES ROUTES ============

app.get('/api/tiles', async (req, res) => {
  try {
    const { data: tiles } = await supabase.from('tiles').select('*').order('position');
    res.json(tiles || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tiles', async (req, res) => {
  try {
    const { name, description, type, metric, target_value, points, image_url, position } = req.body;
    
    const { data: tile, error } = await supabase.from('tiles')
      .insert({ name, description, type, metric, target_value, points, image_url, position })
      .select()
      .single();
    
    if (error) throw error;
    res.json(tile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tiles/:id', async (req, res) => {
  try {
    const tileId = parseInt(req.params.id);
    const { name, description, type, metric, target_value, points, image_url, position } = req.body;
    
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (type !== undefined) updates.type = type;
    if (metric !== undefined) updates.metric = metric;
    if (target_value !== undefined) updates.target_value = target_value;
    if (points !== undefined) updates.points = points;
    if (image_url !== undefined) updates.image_url = image_url;
    if (position !== undefined) updates.position = position;
    
    const { data: tile, error } = await supabase.from('tiles')
      .update(updates)
      .eq('id', tileId)
      .select()
      .single();
    
    if (error) throw error;
    res.json(tile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tiles/:id', async (req, res) => {
  try {
    const tileId = parseInt(req.params.id);
    await supabase.from('tiles').delete().eq('id', tileId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PROGRESS ROUTES ============

app.get('/api/progress', async (req, res) => {
  try {
    const { data: progress } = await supabase.from('progress').select('*');
    res.json(progress || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/progress', async (req, res) => {
  try {
    const { tile_id, team_id, current_value, completed } = req.body;
    
    // Upsert progress
    const { data: existing } = await supabase.from('progress')
      .select('*')
      .eq('tile_id', tile_id)
      .eq('team_id', team_id);
    
    if (existing && existing.length > 0) {
      const { data: progress, error } = await supabase.from('progress')
        .update({ 
          current_value, 
          completed, 
          completed_at: completed ? new Date().toISOString() : null 
        })
        .eq('id', existing[0].id)
        .select()
        .single();
      if (error) throw error;
      return res.json(progress);
    }
    
    const { data: progress, error } = await supabase.from('progress')
      .insert({ 
        tile_id, 
        team_id, 
        current_value, 
        completed,
        completed_at: completed ? new Date().toISOString() : null
      })
      .select()
      .single();
    
    if (error) throw error;
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PROOFS ROUTES ============

app.get('/api/proofs', async (req, res) => {
  try {
    const { data: proofs } = await supabase.from('proofs').select('*').order('created_at', { ascending: false });
    
    // Add tile and team names
    const { data: tiles } = await supabase.from('tiles').select('id, name');
    const { data: teams } = await supabase.from('teams').select('id, name');
    
    const enrichedProofs = (proofs || []).map(p => ({
      ...p,
      tile_name: tiles?.find(t => t.id === p.tile_id)?.name,
      team_name: teams?.find(t => t.id === p.team_id)?.name
    }));
    
    res.json(enrichedProofs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/proofs', async (req, res) => {
  try {
    const { tile_id, team_id, player_name, image_url, notes } = req.body;
    
    const { data: proof, error } = await supabase.from('proofs')
      .insert({ tile_id, team_id, player_name, image_url, notes, status: 'pending' })
      .select()
      .single();
    
    if (error) throw error;
    res.json(proof);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/proofs/:id', async (req, res) => {
  try {
    const proofId = parseInt(req.params.id);
    const { status, admin_password } = req.body;
    
    const config = await getConfig();
    if (admin_password !== config.admin_password && admin_password !== ADMIN_PASSWORD) {
      return res.status(403).json({ error: 'Invalid admin password' });
    }
    
    const { data: proof } = await supabase.from('proofs').select('*').eq('id', proofId).single();
    
    const { data: updatedProof, error } = await supabase.from('proofs')
      .update({ status })
      .eq('id', proofId)
      .select()
      .single();
    
    if (error) throw error;
    
    // If approved, update progress
    if (status === 'approved' && proof) {
      const { data: existing } = await supabase.from('progress')
        .select('*')
        .eq('tile_id', proof.tile_id)
        .eq('team_id', proof.team_id);
      
      if (existing && existing.length > 0) {
        await supabase.from('progress')
          .update({ completed: true, completed_at: new Date().toISOString() })
          .eq('id', existing[0].id);
      } else {
        await supabase.from('progress')
          .insert({ tile_id: proof.tile_id, team_id: proof.team_id, completed: true, completed_at: new Date().toISOString() });
      }
      
      await logActivity('PROOF_APPROVED', `Bevis godkendt for tile ${proof.tile_id}`, 'Admin');
    } else if (status === 'rejected') {
      await logActivity('PROOF_REJECTED', `Bevis afvist for tile ${proof?.tile_id}`, 'Admin');
    }
    
    res.json(updatedProof);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/proofs/:id', async (req, res) => {
  try {
    const proofId = parseInt(req.params.id);
    await supabase.from('proofs').delete().eq('id', proofId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CONFIG ROUTES ============

app.get('/api/config', async (req, res) => {
  try {
    const config = await getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/config', async (req, res) => {
  try {
    const updates = req.body;
    
    const { data: existing } = await supabase.from('config').select('id').limit(1);
    
    if (existing && existing.length > 0) {
      const { data: config, error } = await supabase.from('config')
        .update(updates)
        .eq('id', existing[0].id)
        .select()
        .single();
      if (error) throw error;
      return res.json(config);
    }
    
    const { data: config, error } = await supabase.from('config')
      .insert(updates)
      .select()
      .single();
    if (error) throw error;
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ADMIN ROUTES ============

app.post('/api/admin/verify', async (req, res) => {
  try {
    const { password } = req.body;
    const config = await getConfig();
    const isValid = password === config.admin_password || password === ADMIN_PASSWORD;
    res.json({ valid: isValid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/verify-pin', async (req, res) => {
  try {
    const { pin } = req.body;
    const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
    
    // Check lockout
    const { data: attempt } = await supabase.from('failed_pin_attempts')
      .select('*')
      .eq('client_ip', clientIp)
      .single();
    
    if (attempt?.locked) {
      return res.json({ valid: false, locked: true, message: 'For mange forsøg. Kontakt admin.' });
    }
    
    const config = await getConfig();
    const isValid = pin === config.site_pin || pin === SITE_PIN;
    
    if (isValid) {
      // Reset attempts
      if (attempt) {
        await supabase.from('failed_pin_attempts').delete().eq('client_ip', clientIp);
      }
      return res.json({ valid: true });
    }
    
    // Increment failed attempts
    const count = (attempt?.count || 0) + 1;
    const locked = count >= 5;
    
    if (attempt) {
      await supabase.from('failed_pin_attempts')
        .update({ count, locked, updated_at: new Date().toISOString() })
        .eq('client_ip', clientIp);
    } else {
      await supabase.from('failed_pin_attempts')
        .insert({ client_ip: clientIp, count, locked });
    }
    
    if (locked) {
      await logActivity('PIN_LOCKOUT', `IP ${clientIp} låst efter 5 forkerte PIN forsøg`);
    }
    
    const remaining = 5 - count;
    res.json({ 
      valid: false, 
      locked,
      remaining: remaining > 0 ? remaining : 0,
      message: locked ? 'For mange forsøg. Kontakt admin.' : `Forkert PIN. ${remaining} forsøg tilbage.`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/pin', async (req, res) => {
  try {
    const { admin_password, new_pin } = req.body;
    const config = await getConfig();
    
    if (admin_password !== config.admin_password && admin_password !== ADMIN_PASSWORD) {
      return res.status(403).json({ error: 'Invalid admin password' });
    }
    
    if (!new_pin || new_pin.length < 4) {
      return res.status(400).json({ error: 'PIN skal være mindst 4 tegn' });
    }
    
    const { data: existing } = await supabase.from('config').select('id').limit(1);
    if (existing && existing.length > 0) {
      await supabase.from('config').update({ site_pin: new_pin }).eq('id', existing[0].id);
    }
    
    await logActivity('PIN_CHANGED', 'Site PIN kode ændret', 'Admin');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/assign-tile', async (req, res) => {
  try {
    const { tile_id, team_id, admin_password } = req.body;
    const config = await getConfig();
    
    if (admin_password !== config.admin_password && admin_password !== ADMIN_PASSWORD) {
      return res.status(403).json({ error: 'Invalid admin password' });
    }
    
    // Remove existing completions for this tile
    await supabase.from('progress').delete().eq('tile_id', tile_id).eq('completed', true);
    
    // Add new completion
    await supabase.from('progress').insert({
      tile_id,
      team_id,
      current_value: 1,
      completed: true,
      completed_at: new Date().toISOString()
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const { data: logs } = await supabase.from('action_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    res.json(logs || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/logs', async (req, res) => {
  try {
    const { admin_password } = req.body;
    const config = await getConfig();
    
    if (admin_password !== config.admin_password && admin_password !== ADMIN_PASSWORD) {
      return res.status(403).json({ error: 'Invalid admin password' });
    }
    
    await supabase.from('action_logs').delete().neq('id', 0);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SCOREBOARD ============

app.get('/api/scoreboard', async (req, res) => {
  try {
    const { data: teams } = await supabase.from('teams').select('*');
    const { data: progress } = await supabase.from('progress').select('*').eq('completed', true);
    const { data: tiles } = await supabase.from('tiles').select('id, points');
    
    const scoreboard = (teams || []).map(team => {
      const teamProgress = (progress || []).filter(p => p.team_id === team.id);
      const total_points = teamProgress.reduce((sum, p) => {
        const tile = tiles?.find(t => t.id === p.tile_id);
        return sum + (tile?.points || 1);
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

// ============ VOTES ============

app.get('/api/votes', async (req, res) => {
  try {
    const { data: votes } = await supabase.from('tile_votes').select('*');
    
    // Group by tile_id
    const votesByTile = {};
    (votes || []).forEach(v => {
      if (!votesByTile[v.tile_id]) votesByTile[v.tile_id] = { up: 0, down: 0 };
      if (v.vote > 0) votesByTile[v.tile_id].up++;
      if (v.vote < 0) votesByTile[v.tile_id].down++;
    });
    
    res.json(votesByTile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/votes', async (req, res) => {
  try {
    const { tile_id, player_name, vote } = req.body;
    
    const { data: existing } = await supabase.from('tile_votes')
      .select('*')
      .eq('tile_id', tile_id)
      .eq('player_name', player_name);
    
    if (existing && existing.length > 0) {
      await supabase.from('tile_votes')
        .update({ vote })
        .eq('id', existing[0].id);
    } else {
      await supabase.from('tile_votes')
        .insert({ tile_id, player_name, vote });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ WOM SYNC ============

app.post('/api/sync', async (req, res) => {
  try {
    const { data: players } = await supabase.from('players').select('*');
    const results = [];
    
    for (const player of (players || [])) {
      try {
        // Trigger WOM update
        await fetch(`https://api.wiseoldman.net/v2/players/${encodeURIComponent(player.username)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Fetch updated data
        const response = await fetch(`https://api.wiseoldman.net/v2/players/${encodeURIComponent(player.username)}`);
        if (response.ok) {
          const data = await response.json();
          
          await supabase.from('players')
            .update({ 
              wom_id: data.id,
              wom_data: data,
              current_stats: data.latestSnapshot?.data
            })
            .eq('id', player.id);
          
          results.push({ username: player.username, success: true });
        } else {
          results.push({ username: player.username, success: false, error: 'Not found on WOM' });
        }
      } catch (e) {
        results.push({ username: player.username, success: false, error: e.message });
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    await logActivity('WOM_SYNC', `Synkroniseret ${results.filter(r => r.success).length}/${results.length} spillere fra WOM`);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sync/progress', async (req, res) => {
  try {
    const config = await getConfig();
    if (!config.event_start) {
      return res.status(400).json({ error: 'Bingo event not started' });
    }
    
    const { data: tiles } = await supabase.from('tiles').select('*');
    const { data: teams } = await supabase.from('teams').select('*');
    const { data: players } = await supabase.from('players').select('*');
    
    const results = [];
    
    for (const tile of (tiles || [])) {
      // Skip custom tiles (no automatic tracking)
      if (tile.type === 'custom') continue;
      
      const isCompetition = tile.target_value === 0 || tile.target_value === null;
      const teamProgress = {};
      
      // Calculate progress for each team based on their players
      for (const team of (teams || [])) {
        const teamPlayers = (players || []).filter(p => p.team_id === team.id);
        let teamTotal = 0;
        
        for (const player of teamPlayers) {
          const current = player.current_stats;
          const baseline = player.baseline_stats;
          if (!current || !baseline) continue;
          
          let gain = 0;
          const metric = tile.metric?.toLowerCase();
          
          if (tile.type === 'xp' || tile.type === 'level') {
            // Skill XP gain
            const currentXp = current?.skills?.[metric]?.experience || 0;
            const baselineXp = baseline?.skills?.[metric]?.experience || 0;
            gain = currentXp - baselineXp;
          } else if (tile.type === 'kills' || tile.type === 'kc') {
            // Boss KC gain
            const currentKc = current?.bosses?.[metric]?.kills || 0;
            const baselineKc = baseline?.bosses?.[metric]?.kills || 0;
            gain = currentKc - baselineKc;
          }
          
          teamTotal += Math.max(0, gain);
        }
        
        teamProgress[team.id] = teamTotal;
      }
      
      // Update progress in database
      for (const team of (teams || [])) {
        const currentValue = teamProgress[team.id] || 0;
        let completed = false;
        
        if (isCompetition) {
          // Competition tile: highest value wins (determined at event end)
          const maxValue = Math.max(...Object.values(teamProgress));
          completed = currentValue > 0 && currentValue === maxValue;
        } else {
          // Target tile: first to reach target wins
          completed = currentValue >= tile.target_value;
        }
        
        // Upsert progress
        const { data: existing } = await supabase.from('progress')
          .select('*')
          .eq('tile_id', tile.id)
          .eq('team_id', team.id);
        
        if (existing && existing.length > 0) {
          // Don't overwrite if already completed (unless competition)
          if (!existing[0].completed || isCompetition) {
            await supabase.from('progress')
              .update({ 
                current_value: currentValue, 
                completed,
                completed_at: completed ? new Date().toISOString() : null
              })
              .eq('id', existing[0].id);
          }
        } else {
          await supabase.from('progress')
            .insert({ 
              tile_id: tile.id, 
              team_id: team.id, 
              current_value: currentValue, 
              completed,
              completed_at: completed ? new Date().toISOString() : null
            });
        }
      }
      
      results.push({ tile: tile.name, type: tile.type, isCompetition, teamProgress });
    }
    
    await logActivity('PROGRESS_SYNC', `Progress beregnet for ${results.length} tiles`);
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ BINGO EVENT ============

app.post('/api/bingo/start', async (req, res) => {
  try {
    const { admin_password, duration_hours = 168 } = req.body;
    const config = await getConfig();
    
    if (admin_password !== config.admin_password && admin_password !== ADMIN_PASSWORD) {
      return res.status(403).json({ error: 'Invalid admin password' });
    }
    
    const now = new Date();
    const endTime = new Date(now.getTime() + duration_hours * 60 * 60 * 1000);
    
    const { data: existing } = await supabase.from('config').select('id').limit(1);
    if (existing && existing.length > 0) {
      await supabase.from('config')
        .update({ event_start: now.toISOString(), event_end: endTime.toISOString() })
        .eq('id', existing[0].id);
    }
    
    // Save baseline stats for all players
    const { data: players } = await supabase.from('players').select('*');
    for (const player of (players || [])) {
      await supabase.from('players')
        .update({ 
          baseline_stats: player.current_stats,
          baseline_timestamp: now.toISOString()
        })
        .eq('id', player.id);
    }
    
    await logActivity('BINGO_STARTED', `Bingo event startet (${duration_hours} timer)`);
    
    res.json({ 
      success: true, 
      event_start: now.toISOString(),
      event_end: endTime.toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ BOARDS ============

app.get('/api/boards', async (req, res) => {
  try {
    const { data: boards } = await supabase.from('boards').select('*');
    res.json(boards || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/boards', async (req, res) => {
  try {
    const { name } = req.body;
    const { data: tiles } = await supabase.from('tiles').select('*');
    
    const { data: board, error } = await supabase.from('boards')
      .insert({ name, tiles })
      .select()
      .single();
    
    if (error) throw error;
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/boards/:id/load', async (req, res) => {
  try {
    const boardId = parseInt(req.params.id);
    const { data: board } = await supabase.from('boards').select('*').eq('id', boardId).single();
    
    if (!board) return res.status(404).json({ error: 'Board not found' });
    
    // Clear existing tiles
    await supabase.from('tiles').delete().neq('id', 0);
    
    // Insert board tiles
    if (board.tiles && board.tiles.length > 0) {
      const tilesToInsert = board.tiles.map(t => ({
        name: t.name,
        description: t.description,
        type: t.type,
        metric: t.metric,
        target_value: t.target_value,
        points: t.points,
        image_url: t.image_url,
        position: t.position
      }));
      await supabase.from('tiles').insert(tilesToInsert);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ UNDO ============

app.post('/api/admin/undo', async (req, res) => {
  try {
    const { admin_password } = req.body;
    const config = await getConfig();
    
    if (admin_password !== config.admin_password && admin_password !== ADMIN_PASSWORD) {
      return res.status(403).json({ error: 'Invalid admin password' });
    }
    
    // Undo not implemented for Supabase yet
    res.json({ success: false, message: 'Undo not available with Supabase' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ POT ============

app.get('/api/pot', async (req, res) => {
  try {
    const config = await getConfig();
    res.json({ 
      value: config.pot_value || 100000000, 
      donor: config.pot_donor || 'Anonym' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/pot', async (req, res) => {
  try {
    const { value, donor } = req.body;
    const { data: existing } = await supabase.from('config').select('id').limit(1);
    
    if (existing && existing.length > 0) {
      await supabase.from('config')
        .update({ pot_value: value, pot_donor: donor })
        .eq('id', existing[0].id);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ BINGO STATUS ============

app.get('/api/bingo/status', async (req, res) => {
  try {
    const config = await getConfig();
    res.json({
      active: !!config.event_start,
      event_start: config.event_start,
      event_end: config.event_end
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ APPROVED PROOFS ============

app.get('/api/proofs/approved', async (req, res) => {
  try {
    const { data: proofs } = await supabase.from('proofs')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    res.json(proofs || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
