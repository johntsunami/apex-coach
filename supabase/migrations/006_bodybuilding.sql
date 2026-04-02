-- ═══════════════════════════════════════════════════════════════
-- Migration 006: Bodybuilding & Physique Development Track
-- Adds physique category, weak points, hypertrophy experience,
-- and competition status tracking
-- ═══════════════════════════════════════════════════════════════

-- Add physique/hypertrophy fields to profiles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    BEGIN ALTER TABLE profiles ADD COLUMN IF NOT EXISTS physique_category text; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hypertrophy_experience text; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weak_points text[] DEFAULT '{}'; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE profiles ADD COLUMN IF NOT EXISTS competition_status text DEFAULT 'not_competing'; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_split text; EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

-- Expand user_goals to include physique-specific fields
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_goals') THEN
    BEGIN ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS physique_category text; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS weak_points text[] DEFAULT '{}'; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE user_goals ADD COLUMN IF NOT EXISTS hypertrophy_experience text; EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

-- Hypertrophy periodization tracking
CREATE TABLE IF NOT EXISTS hypertrophy_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL, -- 'accumulation', 'intensification', 'deload'
  block_number INT NOT NULL DEFAULT 1,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  volume_peak JSONB DEFAULT '{}', -- {muscle: max_sets_reached}
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hyp_blocks_user ON hypertrophy_blocks(user_id, start_date DESC);
ALTER TABLE hypertrophy_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own hyp blocks" ON hypertrophy_blocks FOR ALL USING (auth.uid() = user_id);
