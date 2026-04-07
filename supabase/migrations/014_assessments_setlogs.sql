-- Fitness assessment tracking
CREATE TABLE IF NOT EXISTS fitness_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_type text NOT NULL,
  result_value decimal,
  result_unit text,
  result_secondary decimal,
  result_secondary_unit text,
  alternatives_used text,
  compensations_noted jsonb,
  notes text,
  assessed_at timestamptz DEFAULT now(),
  next_due_at timestamptz
);

ALTER TABLE fitness_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own assessments" ON fitness_assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own assessments" ON fitness_assessments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Per-set workout logging
CREATE TABLE IF NOT EXISTS set_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid,
  exercise_id text NOT NULL,
  set_number integer NOT NULL,
  weight decimal,
  weight_unit text DEFAULT 'lbs',
  reps_completed integer,
  reps_prescribed integer,
  rpe decimal,
  pain_level text,
  pain_area text,
  pain_note text,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE set_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own sets" ON set_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sets" ON set_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sets" ON set_logs FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_set_logs_user_exercise ON set_logs(user_id, exercise_id, completed_at DESC);
