-- ═══════════════════════════════════════════════════════════════
-- Migration 002: Assessment Improvements + PT Protocol System
-- Adds clinical assessment columns and PT tracking tables
-- ═══════════════════════════════════════════════════════════════

-- ── ASSESSMENT COLUMNS ON user_conditions ────────────────────
ALTER TABLE user_conditions
  ADD COLUMN IF NOT EXISTS pain_behavior jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS directional_preference text,
  ADD COLUMN IF NOT EXISTS timeline jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN user_conditions.pain_behavior IS 'Pain type, triggers, relievers, worst time, trend';
COMMENT ON COLUMN user_conditions.directional_preference IS 'extension|flexion|neutral — McKenzie vs Williams';
COMMENT ON COLUMN user_conditions.timeline IS 'Onset phase (acute/subacute/chronic), injury type, surgery history';

-- ── ASSESSMENT COLUMNS ON profiles ───────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS functional_limitations jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS treatment_history jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS medications jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS red_flags jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS medical_clearance boolean DEFAULT false;

COMMENT ON COLUMN profiles.functional_limitations IS 'Rated abilities: sit 30min, stand, walk, stairs, etc.';
COMMENT ON COLUMN profiles.treatment_history IS 'Previous PT, what helped/hurt, current PT, doctor clearance';
COMMENT ON COLUMN profiles.medications IS 'Active medications affecting exercise (beta-blockers, blood thinners, etc.)';
COMMENT ON COLUMN profiles.red_flags IS 'Clinical red flags requiring medical evaluation';
COMMENT ON COLUMN profiles.medical_clearance IS 'User confirmed medical clearance after red flag screening';

-- ── PT PROTOCOLS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pt_protocols (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  condition_key text NOT NULL,
  protocol_name text NOT NULL,
  protocol_type text CHECK (protocol_type IN ('mckenzie_extension', 'williams_flexion', 'neutral_stabilization', 'joint_rom', 'joint_strengthening', 'neurological', 'chronic_pain', 'general')) DEFAULT 'general',
  current_phase integer DEFAULT 1 CHECK (current_phase BETWEEN 1 AND 4),
  phase_started_at timestamptz DEFAULT now(),
  exercises jsonb DEFAULT '[]'::jsonb,
  frequency_per_day integer DEFAULT 2,
  session_duration_minutes integer DEFAULT 15,
  graduation_criteria jsonb DEFAULT '[]'::jsonb,
  pain_baseline integer CHECK (pain_baseline BETWEEN 0 AND 10),
  functional_goals jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  graduated_at timestamptz,
  UNIQUE(user_id, condition_key)
);

ALTER TABLE pt_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own pt_protocols" ON pt_protocols FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pt_protocols" ON pt_protocols FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pt_protocols" ON pt_protocols FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pt_protocols" ON pt_protocols FOR DELETE USING (auth.uid() = user_id);

-- ── PT SESSIONS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pt_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  protocol_id uuid REFERENCES pt_protocols ON DELETE CASCADE NOT NULL,
  session_type text CHECK (session_type IN ('morning', 'midday', 'evening', 'as_needed')) DEFAULT 'morning',
  exercises_completed jsonb DEFAULT '[]'::jsonb,
  pain_before integer CHECK (pain_before BETWEEN 0 AND 10),
  pain_after integer CHECK (pain_after BETWEEN 0 AND 10),
  rom_measurement jsonb,
  notes text,
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE pt_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own pt_sessions" ON pt_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pt_sessions" ON pt_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pt_sessions" ON pt_sessions FOR UPDATE USING (auth.uid() = user_id);

-- ── PT REMINDERS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pt_reminders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  protocol_id uuid REFERENCES pt_protocols ON DELETE CASCADE NOT NULL,
  reminder_time time NOT NULL,
  enabled boolean DEFAULT true,
  last_sent timestamptz
);

ALTER TABLE pt_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own pt_reminders" ON pt_reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pt_reminders" ON pt_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pt_reminders" ON pt_reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pt_reminders" ON pt_reminders FOR DELETE USING (auth.uid() = user_id);

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pt_protocols_user ON pt_protocols(user_id);
CREATE INDEX IF NOT EXISTS idx_pt_sessions_protocol ON pt_sessions(protocol_id);
CREATE INDEX IF NOT EXISTS idx_pt_sessions_user_date ON pt_sessions(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_pt_reminders_user ON pt_reminders(user_id);
