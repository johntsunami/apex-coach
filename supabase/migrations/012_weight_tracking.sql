-- Weight tracking system
CREATE TABLE IF NOT EXISTS weight_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  logged_at timestamptz DEFAULT now(),
  weight_kg numeric(5,1) NOT NULL,
  notes text
);

ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own weight logs" ON weight_logs
  FOR ALL USING (auth.uid() = user_id);

-- Profile fields for body composition
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height_cm integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight_kg numeric(5,1);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS goal_weight_kg numeric(5,1);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight_goal_type text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_weight_goal_kg numeric(4,2);
