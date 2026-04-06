-- Plan quality review storage
CREATE TABLE IF NOT EXISTS plan_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  plan_date date,
  created_at timestamptz DEFAULT now(),
  rule_check_score integer,
  rule_violations jsonb DEFAULT '[]'::jsonb,
  ai_grade text,
  ai_critical_issues jsonb,
  ai_warnings jsonb,
  ai_suggestions jsonb,
  ai_summary text,
  auto_fixes_applied jsonb,
  reviewed_by text DEFAULT 'automated'
);

ALTER TABLE plan_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developer can manage plan reviews" ON plan_reviews
  FOR ALL USING (auth.jwt() ->> 'email' = 'johncarrus@gmail.com');
