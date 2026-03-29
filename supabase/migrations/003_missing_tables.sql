-- ═══════════════════════════════════════════════════════════════
-- Migration 003: Create all tables referenced by app code
-- These tables are used by features added after the initial schema:
-- exercise swaps, overtraining detection, cardio tracking,
-- VO2 max tests, YouTube video overrides, reassessment logs, error logs
-- ═══════════════════════════════════════════════════════════════

-- Exercise swap history (ExerciseSwap.jsx)
CREATE TABLE IF NOT EXISTS exercise_swaps (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    original_exercise_id text NOT NULL,
    replacement_exercise_id text NOT NULL,
    original_pattern text,
    original_body_part text,
    reason text,
    context text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE exercise_swaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own swaps" ON exercise_swaps FOR ALL USING (auth.uid() = user_id);

-- Overtraining assessments (overtrainingDetector.js)
CREATE TABLE IF NOT EXISTS overtraining_assessments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    level integer NOT NULL DEFAULT 0,
    severity integer NOT NULL DEFAULT 0,
    signal_count integer NOT NULL DEFAULT 0,
    signals jsonb DEFAULT '[]'::jsonb,
    force_deload boolean DEFAULT false,
    reversal_detected boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE overtraining_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own OT assessments" ON overtraining_assessments FOR ALL USING (auth.uid() = user_id);

-- Cardio sessions (cardio.js)
CREATE TABLE IF NOT EXISTS cardio_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    session_type text NOT NULL DEFAULT 'Walking',
    duration_minutes integer NOT NULL DEFAULT 0,
    distance numeric,
    avg_heart_rate integer,
    rpe integer,
    zone integer,
    notes text DEFAULT '',
    created_at timestamptz DEFAULT now()
);
ALTER TABLE cardio_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cardio" ON cardio_sessions FOR ALL USING (auth.uid() = user_id);

-- VO2 max test results (cardio.js)
CREATE TABLE IF NOT EXISTS vo2_tests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    test_type text NOT NULL,
    time_minutes numeric NOT NULL,
    heart_rate integer,
    vo2_max numeric NOT NULL,
    category text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE vo2_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own VO2 tests" ON vo2_tests FOR ALL USING (auth.uid() = user_id);

-- YouTube video overrides for exercises (YouTubePlayer.jsx)
CREATE TABLE IF NOT EXISTS exercise_youtube_overrides (
    exercise_id text PRIMARY KEY,
    youtube_video_id text NOT NULL,
    updated_at timestamptz DEFAULT now()
);
-- No RLS — shared resource (exercise videos are not user-specific)

-- Reassessment change logs (reassessment.js)
CREATE TABLE IF NOT EXISTS reassessment_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    conditions_added integer DEFAULT 0,
    conditions_removed integer DEFAULT 0,
    exercises_blocked integer DEFAULT 0,
    exercises_unlocked integer DEFAULT 0,
    caps_paused integer DEFAULT 0,
    phase_regressed boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE reassessment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reassessment logs" ON reassessment_logs FOR ALL USING (auth.uid() = user_id);

-- Error logs for crash tracking (ErrorBoundary.jsx)
CREATE TABLE IF NOT EXISTS error_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid,
    error_message text,
    error_stack text,
    component_stack text,
    created_at timestamptz DEFAULT now()
);
-- No RLS on error_logs — allow anonymous error reporting
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert errors" ON error_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users read own errors" ON error_logs FOR SELECT USING (auth.uid() = user_id);
