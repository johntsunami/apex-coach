-- Power Rings progress tracking + detraining system
CREATE TABLE IF NOT EXISTS power_rings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  strength_value decimal(4,3) DEFAULT 0.000,
  mobility_value decimal(4,3) DEFAULT 0.000,
  endurance_value decimal(4,3) DEFAULT 0.000,
  recovery_value decimal(4,3) DEFAULT 0.000,
  power_level integer DEFAULT 0,
  ascension_count integer DEFAULT 0,
  color_palette integer DEFAULT 0,
  last_session_date timestamptz,
  last_decay_check timestamptz DEFAULT now(),
  sessions_since_return integer DEFAULT 0,
  return_volume_multiplier decimal(3,2) DEFAULT 1.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE power_rings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own rings" ON power_rings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own rings" ON power_rings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rings" ON power_rings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Profile additions for detraining state
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phase_before_break integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS capability_tags_backup jsonb;
