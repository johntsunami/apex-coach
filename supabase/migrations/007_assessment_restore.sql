-- ═══════════════════════════════════════════════════════════════
-- Migration 007: Store full assessment data in profiles for
-- cross-device restore. Ensures returning users don't repeat
-- the assessment when logging in on a new device.
-- ═══════════════════════════════════════════════════════════════

-- Add assessment_data JSONB column to store full assessment for restore
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    BEGIN ALTER TABLE profiles ADD COLUMN IF NOT EXISTS assessment_data jsonb; EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;
