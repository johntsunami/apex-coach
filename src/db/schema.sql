-- ═══════════════════════════════════════════════════════════════
-- APEX Coach — Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════

-- ── PROFILES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  assessment_completed boolean DEFAULT false,
  fitness_level text CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  current_phase integer DEFAULT 1,
  current_week integer DEFAULT 1,
  training_days_per_week integer,
  session_duration_minutes integer,
  parq_cleared boolean DEFAULT false,
  parq_flags jsonb DEFAULT '[]'::jsonb,
  functional_limitations jsonb DEFAULT '{}'::jsonb,
  treatment_history jsonb DEFAULT '{}'::jsonb,
  medications jsonb DEFAULT '[]'::jsonb,
  red_flags jsonb DEFAULT '[]'::jsonb,
  medical_clearance boolean DEFAULT false
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name)
  VALUES (new.id, new.raw_user_meta_data->>'first_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── USER CONDITIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_conditions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  condition_key text NOT NULL,
  severity integer CHECK (severity BETWEEN 1 AND 5) DEFAULT 2,
  status text CHECK (status IN ('active', 'managing', 'rehab', 'resolved')) DEFAULT 'active',
  body_area text,
  notes text,
  pain_behavior jsonb DEFAULT '{}'::jsonb,
  directional_preference text,
  timeline jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE user_conditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own conditions" ON user_conditions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conditions" ON user_conditions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conditions" ON user_conditions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conditions" ON user_conditions FOR DELETE USING (auth.uid() = user_id);

-- ── USER COMPENSATIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_compensations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  compensation_key text NOT NULL,
  identified_at timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  resolved_at timestamptz
);

ALTER TABLE user_compensations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own compensations" ON user_compensations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own compensations" ON user_compensations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own compensations" ON user_compensations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own compensations" ON user_compensations FOR DELETE USING (auth.uid() = user_id);

-- ── USER GOALS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  muscle_group text NOT NULL,
  goal_type text CHECK (goal_type IN ('size', 'strength', 'maintain', 'none')) DEFAULT 'none',
  compensatory_additions jsonb DEFAULT '[]'::jsonb
);

ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own goals" ON user_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON user_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON user_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON user_goals FOR DELETE USING (auth.uid() = user_id);

-- ── USER EQUIPMENT ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_equipment (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  equipment_key text NOT NULL
);

ALTER TABLE user_equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own equipment" ON user_equipment FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own equipment" ON user_equipment FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own equipment" ON user_equipment FOR DELETE USING (auth.uid() = user_id);

-- ── USER ROM ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_rom (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  joint text NOT NULL,
  rating text CHECK (rating IN ('full', 'limited', 'painful')) DEFAULT 'full',
  assessed_at timestamptz DEFAULT now()
);

ALTER TABLE user_rom ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own rom" ON user_rom FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rom" ON user_rom FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rom" ON user_rom FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rom" ON user_rom FOR DELETE USING (auth.uid() = user_id);

-- ── USER PREFERENCES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL UNIQUE,
  favorite_exercises jsonb DEFAULT '[]'::jsonb,
  disliked_exercises jsonb DEFAULT '[]'::jsonb,
  pain_flagged_exercises jsonb DEFAULT '[]'::jsonb,
  sport_interests jsonb DEFAULT '[]'::jsonb
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own prefs" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prefs" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prefs" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- ── SESSIONS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  date date DEFAULT CURRENT_DATE,
  location text,
  duration_minutes integer,
  safety_level text,
  difficulty_selected text DEFAULT 'standard',
  rtt_score integer,
  ctp_score integer,
  check_in_data jsonb DEFAULT '{}'::jsonb,
  exercises_completed jsonb DEFAULT '[]'::jsonb,
  exercises_skipped jsonb DEFAULT '[]'::jsonb,
  volume_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── SESSION REFLECTIONS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS session_reflections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES sessions ON DELETE CASCADE,
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  difficulty_rating integer,
  pain_rating integer,
  enjoyment_rating integer,
  form_confidence integer,
  overall text CHECK (overall IN ('too_easy', 'just_right', 'too_hard')),
  starred_exercises jsonb DEFAULT '[]'::jsonb,
  flagged_exercises jsonb DEFAULT '[]'::jsonb,
  pain_flagged_exercises jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE session_reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reflections" ON session_reflections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reflections" ON session_reflections FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── USER EXERCISE PROGRESS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_exercise_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  exercise_id text NOT NULL,
  times_completed integer DEFAULT 0,
  mastered boolean DEFAULT false,
  pain_flagged boolean DEFAULT false,
  pain_flag_count integer DEFAULT 0,
  favorite boolean DEFAULT false,
  last_completed timestamptz,
  best_load numeric,
  current_load numeric,
  progression_unlocked boolean DEFAULT false,
  UNIQUE(user_id, exercise_id)
);

ALTER TABLE user_exercise_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON user_exercise_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_exercise_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_exercise_progress FOR UPDATE USING (auth.uid() = user_id);

-- ── CAPABILITY TAGS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS capability_tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  tag text NOT NULL,
  earned_at timestamptz DEFAULT now(),
  criteria_met text,
  UNIQUE(user_id, tag)
);

ALTER TABLE capability_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tags" ON capability_tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tags" ON capability_tags FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── WEEKLY VOLUME ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_volume (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  week_start date NOT NULL,
  muscle_group text NOT NULL,
  total_sets integer DEFAULT 0,
  is_deload boolean DEFAULT false,
  UNIQUE(user_id, week_start, muscle_group)
);

ALTER TABLE weekly_volume ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own volume" ON weekly_volume FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own volume" ON weekly_volume FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own volume" ON weekly_volume FOR UPDATE USING (auth.uid() = user_id);

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

-- ── WEEKLY PLANS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  week_start date NOT NULL,
  training_split text NOT NULL,
  days_per_week integer NOT NULL,
  phase integer NOT NULL,
  day_plans jsonb NOT NULL DEFAULT '[]'::jsonb,
  rotation_indices jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own weekly_plans" ON weekly_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weekly_plans" ON weekly_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weekly_plans" ON weekly_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own weekly_plans" ON weekly_plans FOR DELETE USING (auth.uid() = user_id);

-- Add status field to sessions for tracking not_started/in_progress/completed
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed' CHECK (status IN ('not_started', 'in_progress', 'completed'));
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_type text DEFAULT 'primary' CHECK (session_type IN ('primary', 'supplemental'));
