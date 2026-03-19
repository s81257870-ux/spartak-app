-- ============================================================
-- Spartak App — Supabase Migration
-- Run this entire script in the Supabase SQL Editor
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

-- 5. Enable Realtime for the three tables
ALTER PUBLICATION supabase_realtime ADD TABLE lineup_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
