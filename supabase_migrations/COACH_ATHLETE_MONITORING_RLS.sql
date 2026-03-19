-- ============================================================
-- CSV TEAM — COACH ATHLETE MONITORING: RLS POLICY VERIFICATION
-- Run in Supabase SQL Editor to ensure coach read access
-- to athlete logbook and diet diary data.
-- ============================================================

-- ── VERIFY & ENFORCE: workout_sessions ──────────────────────
-- Coaches can read all sessions, athletes only their own.
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_read_all_sessions" ON workout_sessions;
CREATE POLICY "coach_read_all_sessions" ON workout_sessions
    FOR SELECT USING (
        athlete_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('superadmin', 'coach')
        )
    );

-- ── VERIFY & ENFORCE: logbook_sets ──────────────────────────
-- Coaches can read all logbook sets.
ALTER TABLE logbook_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_read_all_logbook" ON logbook_sets;
CREATE POLICY "coach_read_all_logbook" ON logbook_sets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workout_sessions ws
            WHERE ws.id = logbook_sets.session_id
            AND ws.athlete_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('superadmin', 'coach')
        )
    );

-- ── VERIFY & ENFORCE: daily_logs ────────────────────────────
-- Coaches can read all daily diet logs.
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_read_all_daily_logs" ON daily_logs;
CREATE POLICY "coach_read_all_daily_logs" ON daily_logs
    FOR SELECT USING (
        athlete_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('superadmin', 'coach')
        )
    );

-- ── VERIFY & ENFORCE: log_meals ─────────────────────────────
ALTER TABLE log_meals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_read_all_log_meals" ON log_meals;
CREATE POLICY "coach_read_all_log_meals" ON log_meals
    FOR SELECT USING (
        athlete_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('superadmin', 'coach')
        )
    );

-- ── VERIFY & ENFORCE: log_meal_items ────────────────────────
ALTER TABLE log_meal_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_read_all_log_meal_items" ON log_meal_items;
CREATE POLICY "coach_read_all_log_meal_items" ON log_meal_items
    FOR SELECT USING (
        athlete_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('superadmin', 'coach')
        )
    );

-- ── VERIFY & ENFORCE: exercises (read used in joins) ─────────
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "everyone_read_exercises" ON exercises;
CREATE POLICY "everyone_read_exercises" ON exercises
    FOR SELECT USING (true);

-- ── GRANT USAGE TO AUTHENTICATED ────────────────────────────
-- Ensure the authenticated role can access the tables
GRANT SELECT ON workout_sessions TO authenticated;
GRANT SELECT ON logbook_sets TO authenticated;
GRANT SELECT ON daily_logs TO authenticated;
GRANT SELECT ON log_meals TO authenticated;
GRANT SELECT ON log_meal_items TO authenticated;
GRANT SELECT ON exercises TO authenticated;

-- ── SANITY CHECK QUERY ──────────────────────────────────────
-- Run this as a coach user to verify you can see athlete data:
-- SELECT COUNT(*) FROM workout_sessions;
-- SELECT COUNT(*) FROM logbook_sets;
-- SELECT COUNT(*) FROM daily_logs;
-- All should return > 0 if athletes have logged data.
