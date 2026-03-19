-- ============================================================
-- FIX PART A: Missing Tables & Columns
-- Paste into Supabase SQL Editor and click RUN
-- ============================================================

-- 1. athlete_programs (MISSING - needed by views and frontend)
CREATE TABLE IF NOT EXISTS athlete_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_athlete_programs_athlete ON athlete_programs(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_programs_program ON athlete_programs(program_id);

ALTER TABLE athlete_programs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "athlete_programs_access" ON athlete_programs;
CREATE POLICY "athlete_programs_access" ON athlete_programs FOR ALL
USING (
    athlete_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
);

-- 2. Ensure workout_logs has session_date (may already exist from partial run)
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS session_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS duration_minutes INT;
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT true;
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS rpe INT;

-- 3. Ensure workout_checkins exists
CREATE TABLE IF NOT EXISTS workout_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
    pump_rating INT CHECK (pump_rating BETWEEN 1 AND 5),
    energy_rating INT CHECK (energy_rating BETWEEN 1 AND 5),
    difficulty TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workout_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "checkin_visibility" ON workout_checkins;
CREATE POLICY "checkin_visibility" ON workout_checkins FOR ALL
USING (
    athlete_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
);
