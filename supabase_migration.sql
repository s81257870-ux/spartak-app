-- ============================================================
-- Spartak App — Supabase Migration
-- This file is IDEMPOTENT — safe to re-run at any time.
-- Each section only applies changes that don't already exist.
-- ============================================================

-- 1. Add position column to players
ALTER TABLE players ADD COLUMN IF NOT EXISTS position text NOT NULL DEFAULT 'CM';

-- Update positions for all 18 players by name
UPDATE players SET position = 'CM' WHERE name = 'Anton Ørsted Petersen';
UPDATE players SET position = 'HM' WHERE name = 'David Fraenkel';
UPDATE players SET position = 'A'  WHERE name = 'Emil Traberg Keppie';
UPDATE players SET position = 'VB' WHERE name = 'Frederik Overgaard Kiilerich';
UPDATE players SET position = 'HB' WHERE name = 'Frederik Valdemar Kjeldgaard';
UPDATE players SET position = 'CM' WHERE name = 'Jens Albert Møller Frandsen';
UPDATE players SET position = 'VM' WHERE name = 'Jonas Bockhoff Clausen';
UPDATE players SET position = 'A'  WHERE name = 'Jonathan Olsen';
UPDATE players SET position = 'MV' WHERE name = 'Kristian Milas Hadberg';
UPDATE players SET position = 'HM' WHERE name = 'Mathias Hermann Bloch';
UPDATE players SET position = 'CM' WHERE name = 'Mathias Hp';
UPDATE players SET position = 'VB' WHERE name = 'Mikkel Pedersen';
UPDATE players SET position = 'HB' WHERE name = 'Nicolai Hesselberg';
UPDATE players SET position = 'A'  WHERE name = 'Rasmus Beyer';
UPDATE players SET position = 'VM' WHERE name = 'Rasmus Tue Nielsen';
UPDATE players SET position = 'CM' WHERE name = 'Sebastian Telvig';
UPDATE players SET position = 'MV' WHERE name = 'Simon Blom';
UPDATE players SET position = 'A'  WHERE name = 'Tobias Fosmark';

-- 2. Extend matches table with missing columns
ALTER TABLE matches ADD COLUMN IF NOT EXISTS score_us     integer  NOT NULL DEFAULT 0;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS score_them   integer  NOT NULL DEFAULT 0;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_completed boolean  NOT NULL DEFAULT false;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS formation    text     NOT NULL DEFAULT '1-2-3-1';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS man_of_the_match uuid REFERENCES players(id) ON DELETE SET NULL;

-- 3. Create lineup_slots table
CREATE TABLE IF NOT EXISTS lineup_slots (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id   uuid        NOT NULL REFERENCES matches(id)  ON DELETE CASCADE,
  player_id  uuid        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  position   text,                           -- NULL for bench players
  slot_type  text        NOT NULL DEFAULT 'starter', -- 'starter' | 'bench'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, player_id)               -- one slot per player per match
);

-- Partial unique index: one player per position per match (starters only)
CREATE UNIQUE INDEX IF NOT EXISTS lineup_slots_position_idx
  ON lineup_slots(match_id, position)
  WHERE position IS NOT NULL;

CREATE INDEX IF NOT EXISTS lineup_slots_match_idx ON lineup_slots(match_id);

-- 4. Add assist column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS assist_player_id uuid REFERENCES players(id) ON DELETE SET NULL;

-- 5. Enable Realtime for the three tables (safe to re-run)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE lineup_slots;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE events;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE matches;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Migration 2 — Live score from events
-- Run this after the initial migration above
-- ============================================================

-- 6. Add team column to events ('us' = Spartak goal, 'them' = opponent goal)
ALTER TABLE events ADD COLUMN IF NOT EXISTS team text NOT NULL DEFAULT 'us'
  CHECK (team IN ('us', 'them'));

-- 7. Make player_id nullable so opponent goals can be stored without a player
ALTER TABLE events ALTER COLUMN player_id DROP NOT NULL;

-- ============================================================
-- Migration 3 — Match attendance / signup
-- ============================================================

-- 8. Add signed_up column to matches (array of player UUIDs)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS signed_up uuid[] NOT NULL DEFAULT '{}';

-- ============================================================
-- Migration 4 — Startopstilling (starting 7 from attendance)
-- ============================================================

-- 9. Track which signed-up players are in the starting lineup
ALTER TABLE matches ADD COLUMN IF NOT EXISTS starters uuid[] NOT NULL DEFAULT '{}';

-- ============================================================
-- Migration 5 — Bødekasse (fine system)
-- ============================================================

-- 10. Create fines table (previously only stored in localStorage)
CREATE TABLE IF NOT EXISTS fines (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id    uuid        NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  fine_type_id text        NOT NULL,
  label        text        NOT NULL,
  amount       integer     NOT NULL CHECK (amount >= 0),
  date         date        NOT NULL,
  note         text,
  paid         boolean     NOT NULL DEFAULT false,
  match_id     uuid        REFERENCES matches(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fines_player_idx ON fines(player_id);
CREATE INDEX IF NOT EXISTS fines_date_idx   ON fines(date DESC);

-- 11. Enable RLS + Realtime for fines
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public read/write" ON fines FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE fines;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
