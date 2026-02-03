-- OSRS Bingo Database Schema for Supabase

-- Config table
CREATE TABLE IF NOT EXISTS config (
  id SERIAL PRIMARY KEY,
  name TEXT DEFAULT 'OSRS Bingo',
  grid_size INTEGER DEFAULT 7,
  active BOOLEAN DEFAULT true,
  admin_password TEXT DEFAULT 'changeme',
  site_pin TEXT DEFAULT '1234',
  event_start TIMESTAMPTZ,
  event_end TIMESTAMPTZ,
  sounds_enabled BOOLEAN DEFAULT true,
  dark_mode BOOLEAN DEFAULT false,
  pot_value BIGINT DEFAULT 100000000,
  pot_donor TEXT DEFAULT 'Anonym',
  rules TEXT DEFAULT ''
);

-- Insert default config
INSERT INTO config (name) VALUES ('OSRS Bingo') ON CONFLICT DO NOTHING;

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3b82f6',
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  wom_id INTEGER,
  wom_data JSONB,
  current_stats JSONB,
  baseline_stats JSONB,
  baseline_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tiles table
CREATE TABLE IF NOT EXISTS tiles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'custom',
  metric TEXT,
  target_value INTEGER DEFAULT 1,
  points INTEGER DEFAULT 1,
  image_url TEXT,
  position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress table
CREATE TABLE IF NOT EXISTS progress (
  id SERIAL PRIMARY KEY,
  tile_id INTEGER REFERENCES tiles(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  current_value INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tile_id, team_id)
);

-- Proofs table
CREATE TABLE IF NOT EXISTS proofs (
  id SERIAL PRIMARY KEY,
  tile_id INTEGER REFERENCES tiles(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  player_name TEXT,
  image_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Boards (saved tile configurations)
CREATE TABLE IF NOT EXISTS boards (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  tiles JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs
CREATE TABLE IF NOT EXISTS action_logs (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  details TEXT,
  actor TEXT DEFAULT 'System',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  player_name TEXT,
  team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tile votes
CREATE TABLE IF NOT EXISTS tile_votes (
  id SERIAL PRIMARY KEY,
  tile_id INTEGER REFERENCES tiles(id) ON DELETE CASCADE,
  player_name TEXT,
  vote INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tile_id, player_name)
);

-- Failed PIN attempts (for lockout)
CREATE TABLE IF NOT EXISTS failed_pin_attempts (
  id SERIAL PRIMARY KEY,
  client_ip TEXT NOT NULL UNIQUE,
  count INTEGER DEFAULT 0,
  locked BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE proofs ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since we handle auth in backend)
CREATE POLICY "Allow all" ON teams FOR ALL USING (true);
CREATE POLICY "Allow all" ON players FOR ALL USING (true);
CREATE POLICY "Allow all" ON tiles FOR ALL USING (true);
CREATE POLICY "Allow all" ON progress FOR ALL USING (true);
CREATE POLICY "Allow all" ON proofs FOR ALL USING (true);
CREATE POLICY "Allow all" ON boards FOR ALL USING (true);
CREATE POLICY "Allow all" ON action_logs FOR ALL USING (true);
CREATE POLICY "Allow all" ON chat_messages FOR ALL USING (true);
CREATE POLICY "Allow all" ON tile_votes FOR ALL USING (true);
CREATE POLICY "Allow all" ON config FOR ALL USING (true);
CREATE POLICY "Allow all" ON failed_pin_attempts FOR ALL USING (true);
