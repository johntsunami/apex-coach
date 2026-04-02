-- ═══════════════════════════════════════════════════════════════
-- Migration 005: Enhanced Cardio — NASM CPT 7th Ed alignment
-- Adds resting measurements, YMCA step test data, zone tracking,
-- calorie estimates, route/location to cardio sessions
-- ═══════════════════════════════════════════════════════════════

-- Add new columns to vo2_tests for YMCA step test and resting data
ALTER TABLE vo2_tests ADD COLUMN IF NOT EXISTS recovery_hr integer;
ALTER TABLE vo2_tests ADD COLUMN IF NOT EXISTS starting_zone integer;
ALTER TABLE vo2_tests ADD COLUMN IF NOT EXISTS resting_hr integer;
ALTER TABLE vo2_tests ADD COLUMN IF NOT EXISTS bp_systolic integer;
ALTER TABLE vo2_tests ADD COLUMN IF NOT EXISTS bp_diastolic integer;
ALTER TABLE vo2_tests ADD COLUMN IF NOT EXISTS hr_max_formula text DEFAULT 'regression';
ALTER TABLE vo2_tests ADD COLUMN IF NOT EXISTS hr_max_calculated integer;

-- Add enhanced fields to cardio_sessions
ALTER TABLE cardio_sessions ADD COLUMN IF NOT EXISTS zone_label text;
ALTER TABLE cardio_sessions ADD COLUMN IF NOT EXISTS calories integer;
ALTER TABLE cardio_sessions ADD COLUMN IF NOT EXISTS route text;

-- Add resting measurement fields to profiles (if profiles table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    BEGIN ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resting_hr integer; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bp_systolic integer; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bp_diastolic integer; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hr_max_formula text DEFAULT 'regression'; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight_lbs numeric; EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;
