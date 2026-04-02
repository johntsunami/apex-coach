-- ═══════════════════════════════════════════════════════════════
-- APEX Coach — Baseline Fitness Assessment Tables
-- Stores 7-test baseline results, power records, bodyweight mastery
-- ═══════════════════════════════════════════════════════════════

-- Baseline fitness test results
CREATE TABLE IF NOT EXISTS baseline_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_date TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Overall composite score (0-100)
  overall_score INT,
  capability_tags TEXT[] DEFAULT '{}',

  -- Test 1: Push-Up Test
  pushup_value INT,
  pushup_modification TEXT,           -- null, 'wall_pushup', 'incline_pushup', 'fist_pushup'
  pushup_skipped BOOLEAN DEFAULT FALSE,
  pushup_skip_reason TEXT,
  pushup_percentile INT,

  -- Test 2: Bodyweight Squat Test
  squat_value INT,
  squat_depth TEXT,                    -- 'full', 'parallel', 'quarter'
  squat_compensations TEXT[],          -- 'knees_cave', 'forward_lean', 'heels_rise', 'back_round'
  squat_modification TEXT,             -- null, 'wall_sit', 'chair_sts', 'box_squat'
  squat_skipped BOOLEAN DEFAULT FALSE,
  squat_percentile INT,

  -- Test 3: Pull-Up / Hang Test
  pullup_value INT,
  pullup_tier TEXT,                    -- 'A' (pull-ups), 'B' (chin-ups), 'C' (dead hang), 'D' (rows)
  pullup_modification TEXT,            -- null, 'band_row', 'supported_row'
  pullup_skipped BOOLEAN DEFAULT FALSE,
  pullup_band_color TEXT,              -- for band row modification
  pullup_angle TEXT,                   -- for inverted row modification
  pullup_percentile INT,

  -- Test 4: Plank Hold
  plank_value INT,                     -- seconds
  plank_fault TEXT,                    -- 'sag', 'pike', 'shaking', 'pain'
  plank_modification TEXT,             -- null, 'draw_in', 'dead_bug'
  plank_skipped BOOLEAN DEFAULT FALSE,
  plank_percentile INT,

  -- Test 5: Glute Bridge Hold
  glute_bridge_value INT,              -- seconds
  glute_bridge_bilateral BOOLEAN DEFAULT TRUE,
  glute_bridge_single_leg_value INT,   -- seconds (tested if bilateral >60s)
  glute_bridge_modification TEXT,      -- null, 'prone_squeeze', 'modified_bridge'
  glute_bridge_skipped BOOLEAN DEFAULT FALSE,
  glute_bridge_percentile INT,

  -- Test 6: Single Leg Balance
  balance_left_open INT,               -- seconds
  balance_right_open INT,              -- seconds
  balance_left_closed INT,             -- seconds
  balance_right_closed INT,            -- seconds
  balance_asymmetry_pct DECIMAL(5,2),  -- calculated asymmetry percentage
  balance_falls_risk BOOLEAN DEFAULT FALSE,
  balance_modification TEXT,           -- null, 'tandem'
  balance_skipped BOOLEAN DEFAULT FALSE,
  balance_percentile INT,

  -- Test 7: 30-Second Sit-to-Stand
  sit_to_stand_value INT,              -- count in 30 seconds
  sit_to_stand_skipped BOOLEAN DEFAULT FALSE,
  sit_to_stand_percentile INT,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_baseline_tests_user ON baseline_tests(user_id, test_date DESC);

-- Row Level Security
ALTER TABLE baseline_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own baseline tests"
  ON baseline_tests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own baseline tests"
  ON baseline_tests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own baseline tests"
  ON baseline_tests FOR UPDATE
  USING (auth.uid() = user_id);

-- Power & bodyweight mastery records
CREATE TABLE IF NOT EXISTS user_exercise_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  record_date TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Performance records
  single_set_max_reps INT,
  max_height_inches DECIMAL(5,1),
  max_distance_feet DECIMAL(5,1),
  max_hold_seconds INT,
  power_output_estimate DECIMAL(8,2),

  -- Context
  bodyweight_lbs DECIMAL(5,1),
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exercise_records_user ON user_exercise_records(user_id, exercise_id, record_date DESC);

ALTER TABLE user_exercise_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exercise records"
  ON user_exercise_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise records"
  ON user_exercise_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);
