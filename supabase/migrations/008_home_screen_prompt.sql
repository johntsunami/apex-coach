-- ═══════════════════════════════════════════════════════════════
-- Migration 008: Add home_screen_prompt_dismissed to profiles
-- Tracks whether the user permanently dismissed the PWA install
-- prompt, so it persists across devices via Supabase.
-- ═══════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    BEGIN ALTER TABLE profiles ADD COLUMN IF NOT EXISTS home_screen_prompt_dismissed boolean DEFAULT false; EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;
