-- ============================================================
-- CSV TEAM — PHASE 4: COACHING NUTRITION LAYER
-- Executable in Supabase SQL Editor
-- ============================================================

-- A. COACH-ATHLETE ASSIGNMENTS (If not already robustly existing)
CREATE TABLE IF NOT EXISTS coach_athlete_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(coach_id, athlete_id)
);
CREATE INDEX IF NOT EXISTS idx_coach_athlete_assignments_coach ON coach_athlete_assignments(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_athlete_assignments_athlete ON coach_athlete_assignments(athlete_id);

-- B. NUTRITION TARGETS EXTENSION
-- Safely add columns to the existing table so we don't drop existing data
ALTER TABLE nutrition_targets ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE nutrition_targets ADD COLUMN IF NOT EXISTS fiber NUMERIC(5,1) DEFAULT 0;
ALTER TABLE nutrition_targets ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE nutrition_targets ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE nutrition_targets ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE nutrition_targets ADD COLUMN IF NOT EXISTS notes TEXT;

-- Drop any previous simple unique constraint if we want historical rows.
-- Note: if there's a unique constraint on athlete_id, we need a composite one for history.
-- Using DO block to safely drop unique constraints on athlete_id.
DO $$ 
DECLARE row RECORD;
BEGIN
    FOR row IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'nutrition_targets'::regclass AND contype = 'u' 
    LOOP
        EXECUTE 'ALTER TABLE nutrition_targets DROP CONSTRAINT IF EXISTS ' || quote_ident(row.conname);
    END LOOP;
END $$;

-- Enforce only ONE active target per athlete at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_target_per_athlete 
ON nutrition_targets (athlete_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_nt_athlete_dates ON nutrition_targets(athlete_id, start_date DESC);

-- C. TARGET HISTORY SNAPSHOT ON DAILY LOGS
-- This ensures that a daily log is permanently tied to the exact macros assigned on that day.
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS target_calories NUMERIC(6,1);
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS target_protein NUMERIC(5,1);
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS target_carbs NUMERIC(5,1);
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS target_fat NUMERIC(5,1);
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS target_fiber NUMERIC(5,1);
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS active_nutrition_target_id UUID REFERENCES nutrition_targets(id) ON DELETE SET NULL;

-- D. COACH ADHERENCE METRICS (MATERIALIZED-LIKE VIEW)
-- We rebuild the view from Phase 3 to be much more powerful using the daily log snapshots
DROP VIEW IF EXISTS coach_nutrition_metrics;
CREATE OR REPLACE VIEW coach_nutrition_metrics AS
SELECT 
    dl.id as daily_log_id,
    dl.athlete_id,
    p.full_name as athlete_name,
    c.coach_id,
    dl.log_date,
    dl.total_calories,
    dl.total_protein,
    dl.total_carbs,
    dl.total_fat,
    dl.total_fiber,
    dl.target_calories,
    dl.target_protein,
    dl.target_carbs,
    dl.target_fat,
    dl.target_fiber,
    
    -- Remaining calculations
    (dl.target_calories - dl.total_calories) as calories_remaining,
    (dl.target_protein - dl.total_protein) as protein_remaining,
    (dl.target_carbs - dl.total_carbs) as carbs_remaining,
    (dl.target_fat - dl.total_fat) as fat_remaining,

    -- Adherence Percentages
    CASE WHEN dl.target_calories > 0 THEN ROUND((dl.total_calories / dl.target_calories) * 100, 1) ELSE 0 END as calorie_adherence_pct,
    CASE WHEN dl.target_protein > 0 THEN ROUND((dl.total_protein / dl.target_protein) * 100, 1) ELSE 0 END as protein_adherence_pct,
    CASE WHEN dl.target_carbs > 0 THEN ROUND((dl.total_carbs / dl.target_carbs) * 100, 1) ELSE 0 END as carbs_adherence_pct,
    CASE WHEN dl.target_fat > 0 THEN ROUND((dl.total_fat / dl.target_fat) * 100, 1) ELSE 0 END as fat_adherence_pct,
    
    (SELECT COUNT(*) FROM log_meals WHERE daily_log_id = dl.id) as logged_meals_count,
    dl.completion_status,
    
    -- Smart Flags
    CASE WHEN (dl.target_calories > 0 AND dl.total_calories < (dl.target_calories * 0.90)) THEN true ELSE false END as is_under_target,
    CASE WHEN (dl.target_calories > 0 AND dl.total_calories > (dl.target_calories * 1.10)) THEN true ELSE false END as is_over_target

FROM daily_logs dl
LEFT JOIN profiles p ON p.id = dl.athlete_id
LEFT JOIN coach_athlete_assignments c ON c.athlete_id = dl.athlete_id AND c.status = 'active';


-- ============================================================
-- SQL RPC FUNCTIONS (THE BRAIN)
-- ============================================================

-- 1. Helper: Snapshot active targets into a daily log on creation
CREATE OR REPLACE FUNCTION set_daily_log_target_snapshot()
RETURNS TRIGGER AS $$
DECLARE
    v_target RECORD;
BEGIN
    -- Find the currently active target for this athlete that covers the log_date
    SELECT * INTO v_target FROM nutrition_targets 
    WHERE athlete_id = NEW.athlete_id 
      AND is_active = true 
      AND start_date <= NEW.log_date
    ORDER BY start_date DESC LIMIT 1;
    
    IF v_target IS NOT NULL THEN
        NEW.active_nutrition_target_id := v_target.id;
        NEW.target_calories := v_target.calories;
        NEW.target_protein := v_target.protein;
        NEW.target_carbs := v_target.carbs;
        NEW.target_fat := v_target.fats;
        NEW.target_fiber := v_target.fiber;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_daily_log_targets ON daily_logs;
CREATE TRIGGER trg_set_daily_log_targets BEFORE INSERT ON daily_logs FOR EACH ROW EXECUTE FUNCTION set_daily_log_target_snapshot();

-- 2. Coach assigns a new nutrition target (automatically closes previous)
CREATE OR REPLACE FUNCTION assign_nutrition_target(
    p_athlete_id UUID, 
    p_coach_id UUID, 
    p_calories NUMERIC, 
    p_protein NUMERIC, 
    p_carbs NUMERIC, 
    p_fat NUMERIC, 
    p_fiber NUMERIC, 
    p_start_date DATE, 
    p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_new_id UUID;
BEGIN
    -- Deactivate any previously active target for this athlete
    UPDATE nutrition_targets 
    SET is_active = false, end_date = p_start_date - INTERVAL '1 day', updated_at = NOW() 
    WHERE athlete_id = p_athlete_id AND is_active = true;

    -- Insert the new target
    INSERT INTO nutrition_targets (athlete_id, coach_id, calories, protein, carbs, fats, fiber, start_date, is_active, notes)
    VALUES (p_athlete_id, p_coach_id, p_calories, p_protein, p_carbs, p_fat, COALESCE(p_fiber, 0), p_start_date, true, p_notes)
    RETURNING id INTO v_new_id;

    -- Update today's daily log (if it exists) to reflect the new target snapshot
    IF p_start_date <= CURRENT_DATE THEN
        UPDATE daily_logs 
        SET active_nutrition_target_id = v_new_id,
            target_calories = p_calories,
            target_protein = p_protein,
            target_carbs = p_carbs,
            target_fat = p_fat,
            target_fiber = COALESCE(p_fiber, 0)
        WHERE athlete_id = p_athlete_id AND log_date = CURRENT_DATE;
    END IF;

    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Get Active Target for Client
CREATE OR REPLACE FUNCTION get_active_nutrition_target(p_athlete_id UUID, p_target_date DATE)
RETURNS SETOF nutrition_targets AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM nutrition_targets 
    WHERE athlete_id = p_athlete_id 
      AND start_date <= p_target_date 
      AND (end_date IS NULL OR end_date >= p_target_date)
    ORDER BY start_date DESC LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE coach_athlete_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_targets ENABLE ROW LEVEL SECURITY;

-- Assignments: Coaches see all their assignments; Athletes see their own
DROP POLICY IF EXISTS "coach_read_assignments" ON coach_athlete_assignments;
CREATE POLICY "coach_read_assignments" ON coach_athlete_assignments FOR SELECT USING (coach_id = auth.uid() OR athlete_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Nutrition Targets: Athletes read their own; Coaches read active assignments
DROP POLICY IF EXISTS "coach_athlete_read_nt" ON nutrition_targets;
CREATE POLICY "coach_athlete_read_nt" ON nutrition_targets FOR SELECT USING (athlete_id = auth.uid() OR coach_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin') OR EXISTS (SELECT 1 FROM coach_athlete_assignments WHERE coach_athlete_assignments.athlete_id = nutrition_targets.athlete_id AND coach_athlete_assignments.coach_id = auth.uid() AND status = 'active'));

DROP POLICY IF EXISTS "coach_insert_nt" ON nutrition_targets;
CREATE POLICY "coach_insert_nt" ON nutrition_targets FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach')));

DROP POLICY IF EXISTS "coach_update_nt" ON nutrition_targets;
CREATE POLICY "coach_update_nt" ON nutrition_targets FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach')));
