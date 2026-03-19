-- ============================================================
-- CSV TEAM — PHASE 8: WORKOUT LOGGING + EXERCISE EXTENSIONS
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. EXTEND EXERCISES TABLE
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS equipment_category TEXT DEFAULT 'barbell';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. WORKOUT SESSIONS
CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    program_day_id UUID NOT NULL REFERENCES program_days(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ws_athlete ON workout_sessions(athlete_id);
CREATE INDEX IF NOT EXISTS idx_ws_day ON workout_sessions(program_day_id);

-- 3. LOGBOOK SETS
CREATE TABLE IF NOT EXISTS logbook_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    program_exercise_id UUID NOT NULL REFERENCES program_exercises(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    set_number INT NOT NULL,
    weight NUMERIC(6,2) NOT NULL,
    reps INT NOT NULL,
    rpe NUMERIC(3,1),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ls_session ON logbook_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_ls_exercise ON logbook_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_ls_athlete_exercise ON logbook_sets(exercise_id, created_at DESC);

-- 4. RLS POLICIES
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE logbook_sets ENABLE ROW LEVEL SECURITY;

-- Workout Sessions: athletes see own, coaches see all
DROP POLICY IF EXISTS "athlete_own_sessions" ON workout_sessions;
CREATE POLICY "athlete_own_sessions" ON workout_sessions FOR ALL
USING (
    athlete_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
);

-- Logbook Sets: athletes see own (via session), coaches see all
DROP POLICY IF EXISTS "athlete_own_logbook" ON logbook_sets;
CREATE POLICY "athlete_own_logbook" ON logbook_sets FOR ALL
USING (
    EXISTS (SELECT 1 FROM workout_sessions ws WHERE ws.id = logbook_sets.session_id AND ws.athlete_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
);

-- Exercises: everyone can read, only coach/admin can write
DROP POLICY IF EXISTS "exercises_read" ON exercises;
CREATE POLICY "exercises_read" ON exercises FOR SELECT USING (true);

DROP POLICY IF EXISTS "exercises_write" ON exercises;
CREATE POLICY "exercises_write" ON exercises FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach')));

DROP POLICY IF EXISTS "exercises_update" ON exercises;
CREATE POLICY "exercises_update" ON exercises FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach')));

DROP POLICY IF EXISTS "exercises_delete" ON exercises;
CREATE POLICY "exercises_delete" ON exercises FOR DELETE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach')));

-- 5. STORAGE BUCKET (run separately if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('tutorial-videos', 'tutorial-videos', true)
-- ON CONFLICT DO NOTHING;
