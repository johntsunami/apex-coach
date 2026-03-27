-- ═══════════════════════════════════════════════════════════════
-- Exercise Image Storage — run in Supabase SQL Editor
-- https://supabase.com/dashboard/project/prwvkrftyeeshsgcfnay/sql
-- ═══════════════════════════════════════════════════════════════

-- 1. Create storage bucket (public so images load without auth)
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-images', 'exercise-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS: anyone can read
CREATE POLICY "Public read exercise images"
ON storage.objects FOR SELECT
USING (bucket_id = 'exercise-images');

-- 3. RLS: authenticated users can upload/update/delete
CREATE POLICY "Auth users upload exercise images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'exercise-images' AND auth.role() = 'authenticated');

CREATE POLICY "Auth users update exercise images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'exercise-images' AND auth.role() = 'authenticated');

CREATE POLICY "Auth users delete exercise images"
ON storage.objects FOR DELETE
USING (bucket_id = 'exercise-images' AND auth.role() = 'authenticated');

-- 4. Table to track which exercises have custom image overrides
CREATE TABLE IF NOT EXISTS public.exercise_image_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id TEXT NOT NULL UNIQUE,
  image_url TEXT,
  image_url2 TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.exercise_image_overrides ENABLE ROW LEVEL SECURITY;

-- Anyone can read overrides (images are public)
CREATE POLICY "Anyone can read image overrides"
ON public.exercise_image_overrides FOR SELECT
USING (true);

-- Authenticated users can manage overrides
CREATE POLICY "Auth users manage image overrides"
ON public.exercise_image_overrides FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Auth users update image overrides"
ON public.exercise_image_overrides FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users delete image overrides"
ON public.exercise_image_overrides FOR DELETE
USING (auth.role() = 'authenticated');
