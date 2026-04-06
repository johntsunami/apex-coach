-- Bug report system for beta testers
CREATE TABLE IF NOT EXISTS bug_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  page_context text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'minor',
  device_info jsonb DEFAULT '{}'::jsonb,
  screenshot_url text,
  status text DEFAULT 'new',
  developer_notes text,
  resolved_at timestamptz
);

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own reports
CREATE POLICY "Users can create bug reports" ON bug_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON bug_reports
  FOR SELECT USING (auth.uid() = user_id);

-- Users can't edit/delete reports (only devs can)

-- Storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('bug-screenshots', 'bug-screenshots', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload bug screenshots" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'bug-screenshots' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view bug screenshots" ON storage.objects
  FOR SELECT USING (bucket_id = 'bug-screenshots');
