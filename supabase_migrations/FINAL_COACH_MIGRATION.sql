-- ============================================================
-- FULL COACH V2 MIGRATION SCRIPT
-- ============================================================

-- ============================================================
-- CSV TEAM — PHASE 3: LOGGING LAYER & MEAL TEMPLATES
-- Executable in Supabase SQL Editor
-- ============================================================

-- 1. FAVORITE FOODS --------------------------------------
CREATE TABLE IF NOT EXISTS favorite_foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(athlete_id, food_id)
);
CREATE INDEX IF NOT EXISTS idx_favorite_foods_athlete ON favorite_foods(athlete_id);

-- 2. RECENT FOODS ----------------------------------------
CREATE TABLE IF NOT EXISTS recent_foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    use_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(athlete_id, food_id)
);
CREATE INDEX IF NOT EXISTS idx_recent_foods_athlete_last_used ON recent_foods(athlete_id, last_used_at DESC);

-- 3. SAVED MEALS (TEMPLATES) -----------------------------
CREATE TABLE IF NOT EXISTS saved_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    meal_type TEXT,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_saved_meals_athlete ON saved_meals(athlete_id);

-- 4. SAVED MEAL ITEMS ------------------------------------
CREATE TABLE IF NOT EXISTS saved_meal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    saved_meal_id UUID NOT NULL REFERENCES saved_meals(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
    quantity NUMERIC(7,2) NOT NULL,
    quantity_unit TEXT DEFAULT 'g',
    grams NUMERIC(7,2) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_saved_meal_items_meal ON saved_meal_items(saved_meal_id);

-- 5. DAILY LOGS ------------------------------------------
CREATE TABLE IF NOT EXISTS daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    total_calories NUMERIC(7,1) DEFAULT 0,
    total_protein NUMERIC(7,1) DEFAULT 0,
    total_carbs NUMERIC(7,1) DEFAULT 0,
    total_fat NUMERIC(7,1) DEFAULT 0,
    total_fiber NUMERIC(7,1) DEFAULT 0,
    completion_status TEXT DEFAULT 'empty' CHECK (completion_status IN ('empty', 'partial', 'complete')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(athlete_id, log_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_logs_athlete_date ON daily_logs(athlete_id, log_date);

-- 6. LOG MEALS (CONTAINERS) ------------------------------
CREATE TABLE IF NOT EXISTS log_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    meal_type TEXT NOT NULL,
    custom_name TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_log_meals_daily_log ON log_meals(daily_log_id);
CREATE INDEX IF NOT EXISTS idx_log_meals_athlete ON log_meals(athlete_id);

-- 7. LOG MEAL ITEMS (ACTUAL FOODS LOGGED) ----------------
CREATE TABLE IF NOT EXISTS log_meal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    log_meal_id UUID NOT NULL REFERENCES log_meals(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    food_id UUID REFERENCES food_items(id) ON DELETE SET NULL,
    custom_food_name TEXT, 
    quantity NUMERIC(7,2) NOT NULL,
    quantity_unit TEXT DEFAULT 'g',
    grams NUMERIC(7,2) NOT NULL,
    calories NUMERIC(7,1) NOT NULL,
    protein NUMERIC(7,1) NOT NULL,
    carbs NUMERIC(7,1) NOT NULL,
    fat NUMERIC(7,1) NOT NULL,
    fiber NUMERIC(7,1) DEFAULT 0,
    source_type TEXT DEFAULT 'manual',
    source_reference_id UUID,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_log_meal_items_meal ON log_meal_items(log_meal_id);
CREATE INDEX IF NOT EXISTS idx_log_meal_items_athlete ON log_meal_items(athlete_id);

-- 8. COACH ADHERENCE METRICS (VIEW) ----------------------
CREATE OR REPLACE VIEW coach_nutrition_metrics AS
SELECT 
    dl.id as daily_log_id,
    dl.athlete_id,
    dl.log_date,
    dl.total_calories,
    dl.total_protein,
    dl.total_carbs,
    dl.total_fat,
    dl.completion_status,
    nt.calories as target_calories,
    nt.protein as target_protein,
    nt.carbs as target_carbs,
    nt.fats as target_fat,
    CASE WHEN nt.calories > 0 THEN ROUND((dl.total_calories / nt.calories) * 100, 1) ELSE 0 END as calorie_adherence_pct,
    CASE WHEN nt.protein > 0 THEN ROUND((dl.total_protein / nt.protein) * 100, 1) ELSE 0 END as protein_adherence_pct,
    (SELECT COUNT(*) FROM log_meals WHERE daily_log_id = dl.id) as logged_meals_count,
    CASE WHEN dl.total_calories > 0 THEN true ELSE false END as is_day_logged
FROM daily_logs dl
LEFT JOIN nutrition_targets nt ON nt.athlete_id = dl.athlete_id;

-- ============================================================
-- TRIGGERS & AUTO-CALCULATIONS
-- ============================================================

-- A. Auto-update Daily Logs totals when meal items change
CREATE OR REPLACE FUNCTION recalculate_daily_log_totals(p_daily_log_id UUID)
RETURNS VOID AS $$
DECLARE
    v_cals NUMERIC := 0; v_pro NUMERIC := 0; v_car NUMERIC := 0; v_fat NUMERIC := 0; v_fib NUMERIC := 0; v_count INT := 0;
    v_status TEXT := 'empty';
BEGIN
    SELECT COALESCE(SUM(calories), 0), COALESCE(SUM(protein), 0), COALESCE(SUM(carbs), 0), COALESCE(SUM(fat), 0), COALESCE(SUM(fiber), 0), COUNT(id)
    INTO v_cals, v_pro, v_car, v_fat, v_fib, v_count
    FROM log_meal_items lmi JOIN log_meals lm ON lmi.log_meal_id = lm.id 
    WHERE lm.daily_log_id = p_daily_log_id;

    IF v_count > 0 THEN v_status := 'partial'; END IF;

    UPDATE daily_logs SET total_calories = v_cals, total_protein = v_pro, total_carbs = v_car, total_fat = v_fat, total_fiber = v_fib, completion_status = v_status, updated_at = NOW()
    WHERE id = p_daily_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trg_update_daily_log()
RETURNS TRIGGER AS $$
DECLARE
    v_dl_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN SELECT daily_log_id INTO v_dl_id FROM log_meals WHERE id = OLD.log_meal_id;
    ELSE SELECT daily_log_id INTO v_dl_id FROM log_meals WHERE id = NEW.log_meal_id; END IF;
    
    IF v_dl_id IS NOT NULL THEN PERFORM recalculate_daily_log_totals(v_dl_id); END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_meal_item_changes_after_insert ON log_meal_items;
CREATE TRIGGER trg_log_meal_item_changes_after_insert AFTER INSERT OR UPDATE OR DELETE ON log_meal_items FOR EACH ROW EXECUTE FUNCTION trg_update_daily_log();

-- B. Auto-upsert Recent Foods when a food is logged
CREATE OR REPLACE FUNCTION trg_upsert_recent_food()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO recent_foods (athlete_id, food_id, last_used_at, use_count, created_at, updated_at)
    VALUES (NEW.athlete_id, NEW.food_id, NOW(), 1, NOW(), NOW())
    ON CONFLICT (athlete_id, food_id) 
    DO UPDATE SET last_used_at = NOW(), use_count = recent_foods.use_count + 1, updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recent_foods_update ON log_meal_items;
CREATE TRIGGER trg_recent_foods_update AFTER INSERT ON log_meal_items FOR EACH ROW WHEN (NEW.food_id IS NOT NULL) EXECUTE FUNCTION trg_upsert_recent_food();


-- ============================================================
-- SQL RPC FUNCTIONS (API FOR FRONTEND)
-- ============================================================

-- 1. Get or Create Daily Log
CREATE OR REPLACE FUNCTION create_or_get_daily_log(p_athlete_id UUID, p_log_date DATE)
RETURNS UUID AS $$
DECLARE
    v_dl_id UUID;
BEGIN
    SELECT id INTO v_dl_id FROM daily_logs WHERE athlete_id = p_athlete_id AND log_date = p_log_date;
    IF v_dl_id IS NULL THEN
        INSERT INTO daily_logs (athlete_id, log_date) VALUES (p_athlete_id, p_log_date) RETURNING id INTO v_dl_id;
        INSERT INTO log_meals (daily_log_id, athlete_id, meal_type, sort_order) VALUES
        (v_dl_id, p_athlete_id, 'breakfast', 0), (v_dl_id, p_athlete_id, 'lunch', 1), (v_dl_id, p_athlete_id, 'snack', 2), (v_dl_id, p_athlete_id, 'dinner', 3);
    END IF;
    RETURN v_dl_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add Food to Meal (Smart calculation)
CREATE OR REPLACE FUNCTION add_food_to_meal(p_log_meal_id UUID, p_food_id UUID, p_grams NUMERIC, p_source_type TEXT DEFAULT 'manual')
RETURNS UUID AS $$
DECLARE
    v_athlete_id UUID; v_food RECORD; v_cals NUMERIC; v_pro NUMERIC; v_car NUMERIC; v_fat NUMERIC; v_fib NUMERIC; v_new_item_id UUID;
BEGIN
    SELECT athlete_id INTO v_athlete_id FROM log_meals WHERE id = p_log_meal_id;
    IF v_athlete_id IS NULL THEN RAISE EXCEPTION 'Meal not found'; END IF;

    SELECT * INTO v_food FROM food_items WHERE id = p_food_id;
    IF v_food IS NULL THEN RAISE EXCEPTION 'Food not found'; END IF;

    v_cals := ROUND((v_food.calories_per_100g * p_grams) / 100, 1);
    v_pro := ROUND((v_food.protein_per_100g * p_grams) / 100, 1);
    v_car := ROUND((v_food.carbs_per_100g * p_grams) / 100, 1);
    v_fat := ROUND((v_food.fat_per_100g * p_grams) / 100, 1);
    v_fib := ROUND((COALESCE(v_food.fiber_per_100g, 0) * p_grams) / 100, 1);

    INSERT INTO log_meal_items (log_meal_id, athlete_id, food_id, quantity, quantity_unit, grams, calories, protein, carbs, fat, fiber, source_type)
    VALUES (p_log_meal_id, v_athlete_id, p_food_id, p_grams, 'g', p_grams, v_cals, v_pro, v_car, v_fat, v_fib, COALESCE(p_source_type, 'manual'))
    RETURNING id INTO v_new_item_id;

    RETURN v_new_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Duplicate Meal
CREATE OR REPLACE FUNCTION duplicate_meal(p_source_log_meal_id UUID, p_target_daily_log_id UUID, p_target_meal_type TEXT)
RETURNS UUID AS $$
DECLARE
    v_new_meal_id UUID; v_athlete_id UUID;
BEGIN
    SELECT athlete_id INTO v_athlete_id FROM log_meals WHERE id = p_source_log_meal_id;
    
    INSERT INTO log_meals (daily_log_id, athlete_id, meal_type, sort_order)
    VALUES (p_target_daily_log_id, v_athlete_id, p_target_meal_type, 99)
    RETURNING id INTO v_new_meal_id;
    
    INSERT INTO log_meal_items (log_meal_id, athlete_id, food_id, custom_food_name, quantity, quantity_unit, grams, calories, protein, carbs, fat, fiber, source_type, sort_order)
    SELECT v_new_meal_id, athlete_id, food_id, custom_food_name, quantity, quantity_unit, grams, calories, protein, carbs, fat, fiber, 'duplicate_meal', sort_order
    FROM log_meal_items WHERE log_meal_id = p_source_log_meal_id;
    
    RETURN v_new_meal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Copy Previous Day
CREATE OR REPLACE FUNCTION copy_previous_day(p_athlete_id UUID, p_source_date DATE, p_target_date DATE)
RETURNS UUID AS $$
DECLARE
    v_source_dl_id UUID; v_target_dl_id UUID; v_meal RECORD; v_new_meal_id UUID;
BEGIN
    SELECT id INTO v_source_dl_id FROM daily_logs WHERE athlete_id = p_athlete_id AND log_date = p_source_date;
    IF v_source_dl_id IS NULL THEN RAISE EXCEPTION 'Source day not found'; END IF;
    
    SELECT id INTO v_target_dl_id FROM daily_logs WHERE athlete_id = p_athlete_id AND log_date = p_target_date;
    IF v_target_dl_id IS NULL THEN INSERT INTO daily_logs (athlete_id, log_date) VALUES (p_athlete_id, p_target_date) RETURNING id INTO v_target_dl_id; END IF;

    FOR v_meal IN SELECT * FROM log_meals WHERE daily_log_id = v_source_dl_id LOOP
        INSERT INTO log_meals (daily_log_id, athlete_id, meal_type, custom_name, sort_order)
        VALUES (v_target_dl_id, p_athlete_id, v_meal.meal_type, v_meal.custom_name, v_meal.sort_order)
        RETURNING id INTO v_new_meal_id;
        
        INSERT INTO log_meal_items (log_meal_id, athlete_id, food_id, custom_food_name, quantity, quantity_unit, grams, calories, protein, carbs, fat, fiber, source_type, sort_order)
        SELECT v_new_meal_id, athlete_id, food_id, custom_food_name, quantity, quantity_unit, grams, calories, protein, carbs, fat, fiber, 'copy_previous_day', sort_order
        FROM log_meal_items WHERE log_meal_id = v_meal.id;
    END LOOP;
    
    RETURN v_target_dl_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE favorite_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_meal_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_coach_access_fav" ON favorite_foods;
CREATE POLICY "owner_coach_access_fav" ON favorite_foods FOR ALL USING (athlete_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach')));

DROP POLICY IF EXISTS "owner_coach_access_rec" ON recent_foods;
CREATE POLICY "owner_coach_access_rec" ON recent_foods FOR ALL USING (athlete_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach')));

DROP POLICY IF EXISTS "owner_coach_access_sm" ON saved_meals;
CREATE POLICY "owner_coach_access_sm" ON saved_meals FOR ALL USING (athlete_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach')));

DROP POLICY IF EXISTS "owner_coach_access_smi" ON saved_meal_items;
CREATE POLICY "owner_coach_access_smi" ON saved_meal_items FOR ALL USING (EXISTS (SELECT 1 FROM saved_meals WHERE saved_meals.id = saved_meal_items.saved_meal_id AND (saved_meals.athlete_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach')))));

DROP POLICY IF EXISTS "owner_coach_access_dl" ON daily_logs;
CREATE POLICY "owner_coach_access_dl" ON daily_logs FOR ALL USING (athlete_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach')));

DROP POLICY IF EXISTS "owner_coach_access_lm" ON log_meals;
CREATE POLICY "owner_coach_access_lm" ON log_meals FOR ALL USING (athlete_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach')));

DROP POLICY IF EXISTS "owner_coach_access_lmi" ON log_meal_items;
CREATE POLICY "owner_coach_access_lmi" ON log_meal_items FOR ALL USING (athlete_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach')));



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
-- Safely add columns to the existing table so we dont drop existing data
ALTER TABLE nutrition_targets ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE nutrition_targets ADD COLUMN IF NOT EXISTS fiber NUMERIC(5,1) DEFAULT 0;
ALTER TABLE nutrition_targets ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE nutrition_targets ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE nutrition_targets ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE nutrition_targets ADD COLUMN IF NOT EXISTS notes TEXT;

-- Drop any previous simple unique constraint if we want historical rows.
-- Note: if theres a unique constraint on athlete_id, we need a composite one for history.
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

    -- Update todays daily log (if it exists) to reflect the new target snapshot
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


-- ============================================================
-- CSV TEAM — PHASE 5: COACHING ANALYTICS & SMART ALERTS
-- Executable in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. ALERT RULES & CONFIGURATION
-- ============================================================
CREATE TABLE IF NOT EXISTS nutrition_alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_code TEXT UNIQUE NOT NULL,
    rule_name TEXT NOT NULL,
    description TEXT,
    default_enabled BOOLEAN DEFAULT true,
    threshold_value NUMERIC(7,2),
    threshold_unit TEXT, -- e.g. %, days
    lookback_days INT DEFAULT 7,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed basic alert rules
INSERT INTO nutrition_alert_rules (rule_code, rule_name, description, threshold_value, threshold_unit, lookback_days, severity) VALUES
('no_logs', 'Client Not Logging', 'Has not logged any food for consecutive days', 2, 'days', 7, 'high'),
('low_logging', 'Low Logging Completion', 'Weekly days logged is below acceptable percentage', 60, '%', 7, 'medium'),
('low_protein', 'Under Eating Protein', 'Average protein adherence is dangerously low', 80, '%', 7, 'high'),
('under_calories', 'Under Eating Calories', 'Average calorie adherence is dangerously low', 80, '%', 7, 'high'),
('over_calories', 'Over Eating Calories', 'Average calorie adherence is too high', 115, '%', 7, 'medium')
ON CONFLICT (rule_code) DO NOTHING;

-- ============================================================
-- 2. CLIENT ACTIVE ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS client_nutrition_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    alert_rule_code TEXT NOT NULL REFERENCES nutrition_alert_rules(rule_code),
    severity TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
    alert_date DATE DEFAULT CURRENT_DATE,
    context_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    UNIQUE(athlete_id, alert_rule_code, alert_date)
);
CREATE INDEX IF NOT EXISTS idx_client_nutrition_alerts_active ON client_nutrition_alerts(coach_id, status);

-- ============================================================
-- 3. DAILY METRICS ROLLING HISTORY (VIEW)
-- Computes precise adherence per day for quick scanning
-- ============================================================
DROP VIEW IF EXISTS client_nutrition_daily_metrics;
CREATE OR REPLACE VIEW client_nutrition_daily_metrics AS
SELECT 
    dl.id as daily_log_id,
    dl.athlete_id,
    dl.log_date,
    dl.total_calories, dl.total_protein, dl.total_carbs, dl.total_fat, dl.completion_status,
    COALESCE(dl.target_calories, nt.calories, 0) as target_calories,
    COALESCE(dl.target_protein, nt.protein, 0) as target_protein,
    COALESCE(dl.target_carbs, nt.carbs, 0) as target_carbs,
    COALESCE(dl.target_fat, nt.fats, 0) as target_fat,
    
    CASE WHEN COALESCE(dl.target_calories, nt.calories, 0) > 0 THEN ROUND((dl.total_calories / COALESCE(dl.target_calories, nt.calories)) * 100, 1) ELSE 0 END as calorie_adherence_pct,
    CASE WHEN COALESCE(dl.target_protein, nt.protein, 0) > 0 THEN ROUND((dl.total_protein / COALESCE(dl.target_protein, nt.protein)) * 100, 1) ELSE 0 END as protein_adherence_pct,
    CASE WHEN COALESCE(dl.target_carbs, nt.carbs, 0) > 0 THEN ROUND((dl.total_carbs / COALESCE(dl.target_carbs, nt.carbs)) * 100, 1) ELSE 0 END as carbs_adherence_pct,
    CASE WHEN COALESCE(dl.target_fat, nt.fats, 0) > 0 THEN ROUND((dl.total_fat / COALESCE(dl.target_fat, nt.fats)) * 100, 1) ELSE 0 END as fat_adherence_pct,
    
    CASE WHEN dl.total_calories > 300 THEN true ELSE false END as is_logged,
    (SELECT COUNT(*) FROM log_meals WHERE daily_log_id = dl.id) as meals_logged_count
FROM daily_logs dl
LEFT JOIN nutrition_targets nt ON nt.id = dl.active_nutrition_target_id
WHERE dl.log_date >= (CURRENT_DATE - INTERVAL '30 days');

-- ============================================================
-- 4. COACH DASHBOARD SUMMARY (WEEKLY AGGREGATE VIEW)
-- The primary source of truth for the Coach assigned client list UI
-- ============================================================
DROP VIEW IF EXISTS coach_client_nutrition_summary;
CREATE OR REPLACE VIEW coach_client_nutrition_summary AS
WITH last_7_days AS (
    SELECT 
        athlete_id,
        MIN(log_date) as start_date,
        COUNT(log_date) as days_in_system,
        SUM(CASE WHEN is_logged THEN 1 ELSE 0 END) as days_logged,
        AVG(CASE WHEN is_logged THEN calorie_adherence_pct ELSE 0 END) as avg_cal_adherence,
        AVG(CASE WHEN is_logged THEN protein_adherence_pct ELSE 0 END) as avg_pro_adherence,
        MAX(CASE WHEN is_logged THEN log_date ELSE '2000-01-01'::date END) as last_log_date
    FROM client_nutrition_daily_metrics
    WHERE log_date >= (CURRENT_DATE - INTERVAL '7 days')
    GROUP BY athlete_id
)
SELECT 
    caa.coach_id,
    caa.athlete_id,
    p.full_name as athlete_name,
    t.calories as current_target_calories,
    t.protein as current_target_protein,
    t.carbs as current_target_carbs,
    t.fats as current_target_fat,
    
    COALESCE(l7.days_logged, 0) as weekly_days_logged,
    ROUND((COALESCE(l7.days_logged, 0)::numeric / 7.0) * 100, 1) as weekly_logging_completion_pct,
    ROUND(COALESCE(l7.avg_cal_adherence, 0), 1) as weekly_avg_calorie_adherence_pct,
    ROUND(COALESCE(l7.avg_pro_adherence, 0), 1) as weekly_avg_protein_adherence_pct,
    
    COALESCE(l7.last_log_date, '2000-01-01'::date) as last_log_date,
    CURRENT_DATE - COALESCE(NULLIF(l7.last_log_date, '2000-01-01'::date), CURRENT_DATE - 99) as days_since_last_log,
    
    (SELECT COUNT(*) FROM client_nutrition_alerts WHERE athlete_id = caa.athlete_id AND status = 'active') as active_alert_count,
    
    -- Composite Coach Score (0-100) based on Logging (40%) + Calories (30%) + Protein (30%)
    ROUND(
        ( ((COALESCE(l7.days_logged,0)::numeric/7.0) * 40) + 
          (LEAST(COALESCE(l7.avg_cal_adherence,0), 100) * 0.30) + 
          (LEAST(COALESCE(l7.avg_pro_adherence,0), 100) * 0.30) 
        ), 1) as coach_score,
        
    -- Dynamic Risk Status
    CASE 
        WHEN CURRENT_DATE - COALESCE(NULLIF(l7.last_log_date, '2000-01-01'::date), CURRENT_DATE - 99) >= 3 THEN 'urgent_attention'
        WHEN (COALESCE(l7.days_logged,0)::numeric/7.0) < 0.5 THEN 'urgent_attention'
        WHEN COALESCE(l7.avg_pro_adherence, 0) < 75 THEN 'moderate_attention'
        WHEN COALESCE(l7.avg_cal_adherence, 0) < 80 OR COALESCE(l7.avg_cal_adherence, 0) > 120 THEN 'minor_attention'
        ELSE 'on_track'
    END as risk_status

FROM coach_athlete_assignments caa
JOIN profiles p ON p.id = caa.athlete_id
LEFT JOIN nutrition_targets t ON t.athlete_id = caa.athlete_id AND t.is_active = true
LEFT JOIN last_7_days l7 ON l7.athlete_id = caa.athlete_id
WHERE caa.status = 'active';

-- ============================================================
-- 5. AUTOMATIC SYSTEM ALERTS EVALUATOR (BACKEND RPC)
-- Called via cron or when a coach opens the dashboard
-- ============================================================
CREATE OR REPLACE FUNCTION evaluate_all_coach_clients_alerts(p_coach_id UUID)
RETURNS VOID AS $$
DECLARE
    v_client RECORD;
    v_stats RECORD;
    v_alert_exists BOOLEAN;
BEGIN
    FOR v_client IN SELECT athlete_id FROM coach_athlete_assignments WHERE coach_id = p_coach_id AND status = 'active' LOOP
        
        -- Get 7 day stats
        SELECT 
            weekly_logging_completion_pct, 
            days_since_last_log, 
            weekly_avg_protein_adherence_pct,
            weekly_avg_calorie_adherence_pct
        INTO v_stats
        FROM coach_client_nutrition_summary
        WHERE athlete_id = v_client.athlete_id;

        IF v_stats IS NULL THEN CONTINUE; END IF;

        -- ALERT: no_logs (missed >= 2 days)
        IF v_stats.days_since_last_log >= 2 THEN
            INSERT INTO client_nutrition_alerts (athlete_id, coach_id, alert_rule_code, severity, context_json)
            VALUES (v_client.athlete_id, p_coach_id, 'no_logs', 'high', jsonb_build_object('days_since_last_log', v_stats.days_since_last_log))
            ON CONFLICT (athlete_id, alert_rule_code, alert_date) DO NOTHING;
        ELSE
            UPDATE client_nutrition_alerts SET status = 'resolved', resolved_at = NOW() WHERE athlete_id = v_client.athlete_id AND alert_rule_code = 'no_logs' AND status = 'active';
        END IF;

        -- ALERT: low_logging (< 60%)
        IF v_stats.weekly_logging_completion_pct < 60 THEN
            INSERT INTO client_nutrition_alerts (athlete_id, coach_id, alert_rule_code, severity, context_json)
            VALUES (v_client.athlete_id, p_coach_id, 'low_logging', 'medium', jsonb_build_object('completion_pct', v_stats.weekly_logging_completion_pct))
            ON CONFLICT (athlete_id, alert_rule_code, alert_date) DO NOTHING;
        ELSE
             UPDATE client_nutrition_alerts SET status = 'resolved', resolved_at = NOW() WHERE athlete_id = v_client.athlete_id AND alert_rule_code = 'low_logging' AND status = 'active';
        END IF;

        -- ALERT: low_protein (< 80%) AND client has logged at least a bit (avoid double alerting with low_logging)
        IF v_stats.weekly_avg_protein_adherence_pct < 80 AND v_stats.weekly_logging_completion_pct > 25 THEN
            INSERT INTO client_nutrition_alerts (athlete_id, coach_id, alert_rule_code, severity, context_json)
            VALUES (v_client.athlete_id, p_coach_id, 'low_protein', 'high', jsonb_build_object('protein_pct', v_stats.weekly_avg_protein_adherence_pct))
            ON CONFLICT (athlete_id, alert_rule_code, alert_date) DO NOTHING;
        ELSE
             UPDATE client_nutrition_alerts SET status = 'resolved', resolved_at = NOW() WHERE athlete_id = v_client.athlete_id AND alert_rule_code = 'low_protein' AND status = 'active';
        END IF;

    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 6. RLS (ROW LEVEL SECURITY)
-- ============================================================
ALTER TABLE nutrition_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_nutrition_alerts ENABLE ROW LEVEL SECURITY;

-- Rules are read-only for coaches, editable by superadmin
CREATE POLICY "read_alert_rules" ON nutrition_alert_rules FOR SELECT USING (true);

-- Alerts can be viewed by assigned coach or superadmin
CREATE POLICY "coach_read_alerts" ON client_nutrition_alerts FOR SELECT USING (coach_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));
CREATE POLICY "coach_update_alerts" ON client_nutrition_alerts FOR UPDATE USING (coach_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));



-- ============================================================
-- CSV TEAM — PHASE 6: TRAFFIC LIGHT ANALYTICS SYSTEM
-- Training Adherence + Performance + Overall Client Status
-- Executable in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. WORKOUT LOGS (Session-level — one per completed workout)
-- This is the missing bridge between the program and performance.
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
    program_day_id UUID REFERENCES program_days(id) ON DELETE SET NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_minutes INT,
    notes TEXT,
    completed BOOLEAN DEFAULT true,
    rpe INT CHECK (rpe BETWEEN 1 AND 10), -- Rate of Perceived Exertion
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_workout_logs_athlete_date ON workout_logs(athlete_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_logs_program ON workout_logs(program_id, athlete_id);
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_coach_workout_logs" ON workout_logs;
CREATE POLICY "owner_coach_workout_logs" ON workout_logs FOR ALL USING (
    athlete_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
    OR EXISTS (SELECT 1 FROM coach_athlete_assignments WHERE coach_id = auth.uid() AND athlete_id = workout_logs.athlete_id AND status = 'active')
);

-- ============================================================
-- 2. EXERCISE LOGS (Set-level — multiple rows per workout_log)
-- This is the logbook: what did the client actually lift?
-- ============================================================
CREATE TABLE IF NOT EXISTS exercise_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_log_id UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    set_number INT NOT NULL,
    reps_completed INT,
    weight_kg NUMERIC(6,2),
    weight_lbs NUMERIC(6,2),
    rir INT,    -- Reps In Reserve
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout ON exercise_logs(workout_log_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_athlete_exercise ON exercise_logs(athlete_id, exercise_id, created_at DESC);
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_coach_exercise_logs" ON exercise_logs;
CREATE POLICY "owner_coach_exercise_logs" ON exercise_logs FOR ALL USING (
    athlete_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
    OR EXISTS (SELECT 1 FROM coach_athlete_assignments WHERE coach_id = auth.uid() AND athlete_id = exercise_logs.athlete_id AND status = 'active')
);

-- ============================================================
-- 3. PROGRAM WEEKLY FREQUENCY HELPER
-- Calculates how many training days a program expects per week
-- ============================================================
CREATE OR REPLACE VIEW program_weekly_frequency AS
SELECT 
    p.id as program_id,
    p.name as program_name,
    COUNT(pd.id) as total_days,
    -- Assume a program is designed to be done on a weekly cycle
    -- (e.g., a 4-day program = 4 sessions per week)
    COUNT(pd.id) as expected_sessions_per_week
FROM programs p
LEFT JOIN program_days pd ON pd.program_id = p.id
GROUP BY p.id, p.name;

-- ============================================================
-- 4. TRAINING ADHERENCE VIEW (Last 7 days)
-- ============================================================
CREATE OR REPLACE VIEW client_training_adherence AS
SELECT 
    ap.athlete_id,
    ap.program_id,
    pwf.expected_sessions_per_week,
    COUNT(wl.id) FILTER (WHERE wl.session_date >= CURRENT_DATE - 7) as sessions_last_7d,
    COUNT(wl.id) FILTER (WHERE wl.session_date >= CURRENT_DATE - 14) as sessions_last_14d,
    MAX(wl.session_date) as last_workout_date,
    CURRENT_DATE - MAX(wl.session_date) as days_since_last_workout,
    
    -- Adherence percentage: sessions done / expected in same window
    CASE 
        WHEN pwf.expected_sessions_per_week > 0 
        THEN ROUND((COUNT(wl.id) FILTER (WHERE wl.session_date >= CURRENT_DATE - 7)::numeric / pwf.expected_sessions_per_week) * 100, 1)
        ELSE NULL 
    END as training_adherence_pct,

    -- Traffic Light
    CASE
        WHEN pwf.expected_sessions_per_week IS NULL OR MAX(wl.session_date) IS NULL THEN 'gray'
        WHEN (COUNT(wl.id) FILTER (WHERE wl.session_date >= CURRENT_DATE - 7)::numeric / pwf.expected_sessions_per_week) >= 0.85 THEN 'green'
        WHEN (COUNT(wl.id) FILTER (WHERE wl.session_date >= CURRENT_DATE - 7)::numeric / pwf.expected_sessions_per_week) >= 0.60 THEN 'yellow'
        ELSE 'red'
    END as training_traffic_light

FROM athlete_programs ap
LEFT JOIN program_weekly_frequency pwf ON pwf.program_id = ap.program_id
LEFT JOIN workout_logs wl ON wl.athlete_id = ap.athlete_id AND wl.program_id = ap.program_id AND wl.completed = true
WHERE ap.assigned_at = (
    SELECT MAX(ap2.assigned_at) FROM athlete_programs ap2 WHERE ap2.athlete_id = ap.athlete_id
)
GROUP BY ap.athlete_id, ap.program_id, pwf.expected_sessions_per_week;

-- ============================================================
-- 5. PERFORMANCE METRICS VIEW
-- Based on exercise-level set volume and load progression
-- Uses last 3 logged sessions per exercise to compute trend
-- ============================================================
CREATE OR REPLACE VIEW client_performance_metrics AS
WITH ranked_exercise_sessions AS (
    SELECT 
        el.athlete_id,
        el.exercise_id,
        wl.session_date,
        -- Volume load = sum of (weight × reps) per exercise per session
        SUM(COALESCE(el.weight_kg, 0) * COALESCE(el.reps_completed, 0)) as volume_load,
        ROW_NUMBER() OVER (PARTITION BY el.athlete_id, el.exercise_id ORDER BY wl.session_date DESC) as session_rank
    FROM exercise_logs el
    JOIN workout_logs wl ON wl.id = el.workout_log_id
    GROUP BY el.athlete_id, el.exercise_id, wl.session_date
),
recent_trend AS (
    SELECT 
        athlete_id,
        exercise_id,
        MAX(CASE WHEN session_rank = 1 THEN volume_load END) as latest_volume,
        MAX(CASE WHEN session_rank = 2 THEN volume_load END) as prev_volume,
        MAX(CASE WHEN session_rank = 3 THEN volume_load END) as prev2_volume,
        COUNT(*) as session_count
    FROM ranked_exercise_sessions
    WHERE session_rank <= 3
    GROUP BY athlete_id, exercise_id
),
exercise_classification AS (
    SELECT
        athlete_id,
        exercise_id,
        session_count,
        CASE
            WHEN session_count < 2 THEN 'no_data'
            WHEN latest_volume > COALESCE(prev_volume, 0) THEN 'improving'
            WHEN latest_volume = COALESCE(prev_volume, 0) THEN 'stable'
            ELSE 'declining'
        END as trend
    FROM recent_trend
)
SELECT
    athlete_id,
    COUNT(*) as exercises_evaluated,
    SUM(CASE WHEN trend = 'improving' THEN 1 ELSE 0 END) as improving_count,
    SUM(CASE WHEN trend = 'stable' THEN 1 ELSE 0 END) as stable_count,
    SUM(CASE WHEN trend = 'declining' THEN 1 ELSE 0 END) as declining_count,
    SUM(CASE WHEN trend = 'no_data' THEN 1 ELSE 0 END) as no_data_count,
    
    -- Performance Score (0–100): weights improving highest
    ROUND(
        CASE WHEN COUNT(*) > 0 
        THEN (
            (SUM(CASE WHEN trend = 'improving' THEN 1 ELSE 0 END)::numeric * 100 +
             SUM(CASE WHEN trend = 'stable' THEN 1 ELSE 0 END)::numeric * 70 +
             SUM(CASE WHEN trend = 'declining' THEN 1 ELSE 0 END)::numeric * 20)
            / COUNT(*)
        ) ELSE 0 END, 1
    ) as performance_score,
    
    -- Traffic Light
    CASE
        WHEN COUNT(*) = 0 OR SUM(CASE WHEN trend = 'no_data' THEN 1 ELSE 0 END) > COUNT(*) * 0.8 THEN 'gray'
        WHEN SUM(CASE WHEN trend = 'declining' THEN 1 ELSE 0 END) > COUNT(*) * 0.5 THEN 'red'
        WHEN SUM(CASE WHEN trend = 'declining' THEN 1 ELSE 0 END) > COUNT(*) * 0.25 THEN 'yellow'
        WHEN SUM(CASE WHEN trend = 'improving' THEN 1 ELSE 0 END) > 0 OR SUM(CASE WHEN trend = 'stable' THEN 1 ELSE 0 END) > 0 THEN 'green'
        ELSE 'gray'
    END as performance_traffic_light

FROM exercise_classification
GROUP BY athlete_id;

-- ============================================================
-- 6. MASTER COACH CLIENT STATUS VIEW
-- The single source of truth for the Coach Dashboard
-- Combines Nutrition + Training + Performance traffic lights
-- ============================================================
DROP VIEW IF EXISTS coach_client_overall_status;
CREATE OR REPLACE VIEW coach_client_overall_status AS
SELECT
    caa.coach_id,
    caa.athlete_id,
    p.full_name as athlete_name,
    p.email as athlete_email,
    
    -- === NUTRITION ===
    cnm.weekly_logging_completion_pct as nutrition_logging_pct,
    cnm.weekly_avg_calorie_adherence_pct as nutrition_calorie_pct,
    cnm.weekly_avg_protein_adherence_pct as nutrition_protein_pct,
    cnm.coach_score as nutrition_score,
    cnm.last_log_date as last_nutrition_log,
    CASE
        WHEN cnm.risk_status = 'on_track' THEN 'green'
        WHEN cnm.risk_status IN ('minor_attention') THEN 'yellow'
        WHEN cnm.risk_status IN ('moderate_attention', 'urgent_attention') THEN 'red'
        ELSE 'gray'
    END as nutrition_traffic_light,
    
    -- === TRAINING ===
    cta.training_adherence_pct,
    cta.last_workout_date,
    cta.days_since_last_workout,
    cta.sessions_last_7d,
    COALESCE(cta.training_traffic_light, 'gray') as training_traffic_light,
    
    -- === PERFORMANCE ===
    pm.performance_score,
    pm.improving_count, pm.stable_count, pm.declining_count,
    COALESCE(pm.performance_traffic_light, 'gray') as performance_traffic_light,
    
    -- === ALERTS ===
    (SELECT COUNT(*) FROM client_nutrition_alerts WHERE athlete_id = caa.athlete_id AND status = 'active') as active_alert_count,
    
    -- === OVERALL TRAFFIC LIGHT (Nutrition 40% + Training 35% + Performance 25%) ===
    CASE
        -- Any red in a major category forces overall red
        WHEN (CASE WHEN cnm.risk_status IN ('urgent_attention') THEN true ELSE false END)
          OR COALESCE(cta.training_traffic_light, 'gray') = 'red'
          OR COALESCE(pm.performance_traffic_light, 'gray') = 'red' THEN 'red'
        -- Multiple yellows = overall yellow
        WHEN (CASE WHEN cnm.risk_status IN ('minor_attention','moderate_attention') THEN true ELSE false END)
          OR COALESCE(cta.training_traffic_light, 'gray') = 'yellow'
          OR COALESCE(pm.performance_traffic_light, 'gray') = 'yellow' THEN 'yellow'
        -- All gray = gray
        WHEN COALESCE(cta.training_traffic_light, 'gray') = 'gray'
         AND COALESCE(pm.performance_traffic_light, 'gray') = 'gray'
         AND cnm.coach_score IS NULL THEN 'gray'
        ELSE 'green'
    END as overall_traffic_light,

    -- Composite score (for sorting)
    ROUND(
        (COALESCE(cnm.coach_score, 0) * 0.40) +
        (COALESCE(cta.training_adherence_pct, 0) * 0.35) +
        (COALESCE(pm.performance_score, 0) * 0.25)
    , 1) as composite_score,
    
    NOW() as updated_at

FROM coach_athlete_assignments caa
JOIN profiles p ON p.id = caa.athlete_id
LEFT JOIN coach_client_nutrition_summary cnm ON cnm.athlete_id = caa.athlete_id
LEFT JOIN client_training_adherence cta ON cta.athlete_id = caa.athlete_id
LEFT JOIN client_performance_metrics pm ON pm.athlete_id = caa.athlete_id
WHERE caa.status = 'active';


-- ============================================================
-- CSV TEAM — PHASE 7: FRONTEND PRESENTATION LAYER
-- UI-Ready Traffic Light API mapping
-- Executable in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. STATUS DICTIONARY (Lookup table for UI Tokens)
-- Keeps the frontend perfectly aligned with the backend meaning
-- ============================================================
CREATE TABLE IF NOT EXISTS status_dictionary (
    status_code TEXT PRIMARY KEY,
    sort_weight INT NOT NULL,
    -- Coach UI
    label_coach TEXT NOT NULL,
    description_coach TEXT NOT NULL,
    action_coach TEXT,
    -- Client UI
    label_client TEXT NOT NULL,
    -- Design Tokens
    dot_color_token TEXT NOT NULL,
    badge_bg_token TEXT NOT NULL,
    badge_text_token TEXT NOT NULL
);

INSERT INTO status_dictionary (status_code, sort_weight, label_coach, description_coach, action_coach, label_client, dot_color_token, badge_bg_token, badge_text_token) VALUES
('red', 100, 'Critical', 'Significativo scostamento dai target previsti', 'Verifica log e contatta', 'Da riallineare', 'status-red', 'status-red-soft', 'status-red-text'),
('yellow', 200, 'Attention', 'Lieve scostamento dai target o trend in calo', 'Monitora prossimi giorni', 'Quasi in target', 'status-yellow', 'status-yellow-soft', 'status-yellow-text'),
('green', 300, 'On Track', 'Perfettamente in linea con il programma', 'Nessuna azione', 'In linea', 'status-green', 'status-green-soft', 'status-green-text'),
('gray', 400, 'No Data', 'Dati insufficienti per una valutazione', 'Richiedi compilazione log', 'Nessun dato', 'status-gray', 'status-gray-soft', 'status-gray-text')
ON CONFLICT (status_code) DO UPDATE SET 
    label_coach = EXCLUDED.label_coach, 
    label_client = EXCLUDED.label_client,
    action_coach = EXCLUDED.action_coach;

-- ============================================================
-- 2. FRONTEND-READY COACH DASHBOARD VIEW
-- Enriches the raw metrics from Phase 6 with luxury UI tokens
-- ============================================================
DROP VIEW IF EXISTS api_coach_dashboard;
CREATE OR REPLACE VIEW api_coach_dashboard AS
SELECT 
    s.coach_id,
    s.athlete_id,
    s.athlete_name,
    
    -- METRICS SUMMARY
    s.nutrition_score,
    s.training_adherence_pct,
    s.performance_score,
    s.composite_score,
    s.last_nutrition_log,
    s.last_workout_date,
    s.active_alert_count,
    
    -- ==========================================
    -- OVERALL STATUS (Highest Priority for Sorting)
    -- ==========================================
    s.overall_traffic_light as overall_status_code,
    dic_o.sort_weight as overall_sort_weight,
    dic_o.label_coach as overall_label,
    dic_o.dot_color_token as overall_dot_token,
    dic_o.badge_bg_token as overall_bg_token,
    dic_o.badge_text_token as overall_text_token,
    
    -- ==========================================
    -- NUTRITION STATUS
    -- ==========================================
    s.nutrition_traffic_light as nutrition_status_code,
    dic_n.label_coach as nutrition_label,
    dic_n.dot_color_token as nutrition_dot_token,
    dic_n.action_coach as nutrition_action,
    
    -- ==========================================
    -- TRAINING STATUS
    -- ==========================================
    s.training_traffic_light as training_status_code,
    dic_t.label_coach as training_label,
    dic_t.dot_color_token as training_dot_token,
    dic_t.action_coach as training_action,
    
    -- ==========================================
    -- PERFORMANCE STATUS
    -- ==========================================
    s.performance_traffic_light as performance_status_code,
    dic_p.label_coach as performance_label,
    dic_p.dot_color_token as performance_dot_token,
    dic_p.action_coach as performance_action

FROM coach_client_overall_status s
LEFT JOIN status_dictionary dic_o ON dic_o.status_code = s.overall_traffic_light
LEFT JOIN status_dictionary dic_n ON dic_n.status_code = s.nutrition_traffic_light
LEFT JOIN status_dictionary dic_t ON dic_t.status_code = s.training_traffic_light
LEFT JOIN status_dictionary dic_p ON dic_p.status_code = s.performance_traffic_light;

-- ============================================================
-- 3. FRONTEND-READY CLIENT HOME VIEW
-- Exposes the softer, motivational labels for the athlete app
-- ============================================================
DROP VIEW IF EXISTS api_client_status_summary;
CREATE OR REPLACE VIEW api_client_status_summary AS
SELECT 
    s.athlete_id,
    
    -- Overall Soft Status
    s.overall_traffic_light as status_code,
    dic_o.label_client as status_label,
    dic_o.badge_bg_token,
    dic_o.badge_text_token,
    
    -- Section: Nutrition
    s.nutrition_traffic_light as nutrition_status_code,
    dic_n.label_client as nutrition_label,
    dic_n.dot_color_token as nutrition_dot_token,
    
    -- Section: Training
    s.training_traffic_light as training_status_code,
    dic_t.label_client as training_label,
    dic_t.dot_color_token as training_dot_token,
    
    -- Section: Performance
    s.performance_traffic_light as performance_status_code,
    dic_p.label_client as performance_label,
    dic_p.dot_color_token as performance_dot_token

FROM coach_client_overall_status s
LEFT JOIN status_dictionary dic_o ON dic_o.status_code = s.overall_traffic_light
LEFT JOIN status_dictionary dic_n ON dic_n.status_code = s.nutrition_traffic_light
LEFT JOIN status_dictionary dic_t ON dic_t.status_code = s.training_traffic_light
LEFT JOIN status_dictionary dic_p ON dic_p.status_code = s.performance_traffic_light;

-- Enable RLS for dictionary (read-only for all authenticated users)
ALTER TABLE status_dictionary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_status_dict" ON status_dictionary;
CREATE POLICY "public_read_status_dict" ON status_dictionary FOR SELECT USING (true);


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
-- INSERT INTO storage.buckets (id, name, public) VALUES (tutorial-videos, tutorial-videos, true)
-- ON CONFLICT DO NOTHING;


-- ============================================================
-- CSV TEAM — PHASE 9: FULL V2 SYSTEM (Gamification, Chat, Progress, Lessons, Nutrition)
-- Run in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. CHAT SYSTEM
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_athlete ON chat_messages(athlete_id);
CREATE INDEX IF NOT EXISTS idx_chat_sender ON chat_messages(sender_id);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_visibility" ON chat_messages;
CREATE POLICY "chat_visibility" ON chat_messages FOR ALL
USING (
    athlete_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
);

-- ============================================================
-- 2. PROGRESS & CHECKINS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_progress_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight_kg NUMERIC(5,2),
    bodyfat_percent NUMERIC(4,1),
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(athlete_id, date)
);
CREATE INDEX IF NOT EXISTS idx_progress_athlete ON user_progress_logs(athlete_id);

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

ALTER TABLE user_progress_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "progress_visibility" ON user_progress_logs;
CREATE POLICY "progress_visibility" ON user_progress_logs FOR ALL
USING (
    athlete_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
);

ALTER TABLE workout_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "checkin_visibility" ON workout_checkins;
CREATE POLICY "checkin_visibility" ON workout_checkins FOR ALL
USING (
    athlete_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
);

-- ============================================================
-- 3. GAMIFICATION & LEAGUES
-- ============================================================
CREATE TABLE IF NOT EXISTS gamification_profiles (
    athlete_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    xp INT DEFAULT 0,
    current_league TEXT DEFAULT 'bronze',
    streak_days INT DEFAULT 0,
    last_active_date DATE,
    wallet_balance INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_tasks_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    task_type TEXT NOT NULL, -- steps, workout, nutrition, photo
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(athlete_id, date, task_type)
);

CREATE TABLE IF NOT EXISTS user_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL, -- e.g. theme_synthwave
    item_type TEXT NOT NULL, -- e.g. theme, badge, coach_call
    is_active BOOLEAN DEFAULT false,
    purchased_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gamification_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gamification_visibility" ON gamification_profiles;
CREATE POLICY "gamification_visibility" ON gamification_profiles FOR ALL
USING (
    athlete_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
);

ALTER TABLE daily_tasks_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "daily_tasks_visibility" ON daily_tasks_log;
CREATE POLICY "daily_tasks_visibility" ON daily_tasks_log FOR ALL
USING (
    athlete_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
);

ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory_visibility" ON user_inventory;
CREATE POLICY "inventory_visibility" ON user_inventory FOR ALL
USING (
    athlete_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
);

-- ============================================================
-- 4. ACADEMY LESSONS
-- ============================================================
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    video_url TEXT,
    content_text TEXT,
    order_index INT DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_lessons_completed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(athlete_id, lesson_id)
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lessons_read_all" ON lessons;
CREATE POLICY "lessons_read_all" ON lessons FOR SELECT USING (true);
DROP POLICY IF EXISTS "lessons_write_coach" ON lessons;
CREATE POLICY "lessons_write_coach" ON lessons FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach')));

ALTER TABLE user_lessons_completed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_lessons_visibility" ON user_lessons_completed;
CREATE POLICY "user_lessons_visibility" ON user_lessons_completed FOR ALL
USING (
    athlete_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
);

-- ============================================================
-- 5. NUTRITION LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS nutrition_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    food_id UUID REFERENCES food_items(id),
    custom_food_name TEXT,
    amount_g NUMERIC(6,1) NOT NULL,
    kcal NUMERIC(6,1) NOT NULL,
    protein_g NUMERIC(6,1) NOT NULL,
    carbs_g NUMERIC(6,1) NOT NULL,
    fat_g NUMERIC(6,1) NOT NULL,
    meal_type TEXT, -- e.g. breakfast, lunch
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_nutrition_athlete_date ON nutrition_logs(athlete_id, date);

ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nutrition_visibility" ON nutrition_logs;
CREATE POLICY "nutrition_visibility" ON nutrition_logs FOR ALL
USING (
    athlete_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
);

-- Trigger to auto-create gamification_profile when new profile is created
CREATE OR REPLACE FUNCTION public.handle_new_gamification_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.gamification_profiles (athlete_id)
    VALUES (new.id)
    ON CONFLICT (athlete_id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_gamification ON public.profiles;
CREATE TRIGGER on_auth_user_created_gamification
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_gamification_profile();


-- ============================================================
-- CSV TEAM — PHASE 10: COACHING APPOINTMENTS & CREDITS
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. ADD CREDITS TO PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credit_singola_remaining INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credit_coppia_remaining INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lesson_preference TEXT DEFAULT 'singola';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS availability TEXT[] DEFAULT '{}';


-- 2. COACHING APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.coaching_appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  time TEXT NOT NULL,
  duration INT DEFAULT 45,
  client1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client2_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type TEXT DEFAULT 'singola', -- singola, coppia
  package_used TEXT,
  status TEXT DEFAULT 'prenotata', -- prenotata, svolta, annullata, no-show
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS FOR APPOINTMENTS
ALTER TABLE public.coaching_appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointments_visibility" ON public.coaching_appointments;
CREATE POLICY "appointments_visibility" ON public.coaching_appointments FOR ALL
USING (
    client1_id = auth.uid() 
    OR client2_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
);


-- ============================================================
-- CSV TEAM — PHASE 9 & 10: V2 FEATURES MERGE (GAMIFICATION, LESSONS, NUTRITION, APPOINTMENTS)
-- Incolla questo intero script in Supabase SQL Editor e clicca "RUN"
-- ============================================================

-- 1. GAMIFICAZIONE
CREATE TABLE IF NOT EXISTS public.gamification_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp INT DEFAULT 0,
  level INT DEFAULT 1,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_active_date DATE,
  wallet_balance INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_tasks_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  completed_date DATE NOT NULL,
  xp_awarded INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, task_type, completed_date)
);

-- Trigger per auto-creare il profilo gamification per ogni nuovo atleta
CREATE OR REPLACE FUNCTION public.create_gamification_profile()
RETURNS trigger AS $$
BEGIN
  IF NEW.role = 'athlete' THEN
    INSERT INTO public.gamification_profiles (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_gamification ON public.profiles;
CREATE TRIGGER on_auth_user_created_gamification
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_gamification_profile();


-- 2. ACADEMY & LEZIONI
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  category TEXT DEFAULT 'Generale',
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_lessons_completed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, lesson_id)
);


-- 3. LOG NUTRIZIONE
CREATE TABLE IF NOT EXISTS public.nutrition_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  food_id UUID,
  custom_food_name TEXT,
  amount_g NUMERIC(8,2) NOT NULL,
  kcal NUMERIC(8,2) DEFAULT 0,
  protein_g NUMERIC(8,2) DEFAULT 0,
  carbs_g NUMERIC(8,2) DEFAULT 0,
  fat_g NUMERIC(8,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 4. APPUNTAMENTI COACHING & CREDITI
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credit_singola_remaining INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credit_coppia_remaining INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lesson_preference TEXT DEFAULT 'singola';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS availability TEXT[] DEFAULT '{}';


CREATE TABLE IF NOT EXISTS public.coaching_appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  time TEXT NOT NULL,
  duration INT DEFAULT 45,
  client1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client2_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type TEXT DEFAULT 'singola', 
  package_used TEXT,
  status TEXT DEFAULT 'prenotata', 
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 5. ATTIVAZIONE ROW-LEVEL SECURITY E POLICIES PUBBLICHE/ADMIN
ALTER TABLE public.gamification_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lessons_completed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_appointments ENABLE ROW LEVEL SECURITY;

-- Lezioni: tutti possono leggere
DROP POLICY IF EXISTS "lessons_read" ON public.lessons;
CREATE POLICY "lessons_read" ON public.lessons FOR SELECT USING (true);

-- Lezioni completed: latleta legge e scrive le proprie
DROP POLICY IF EXISTS "lessons_completed_visibility" ON public.user_lessons_completed;
CREATE POLICY "lessons_completed_visibility" ON public.user_lessons_completed FOR ALL
USING (
    athlete_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
);

-- Appuntamenti: solo coinvolti
DROP POLICY IF EXISTS "appointments_visibility" ON public.coaching_appointments;
CREATE POLICY "appointments_visibility" ON public.coaching_appointments FOR ALL
USING (
    client1_id = auth.uid() 
    OR client2_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
);

-- Gamification profiles: latleta legge/scrive il proprio
DROP POLICY IF EXISTS "gamification_profiles_access" ON public.gamification_profiles;
CREATE POLICY "gamification_profiles_access" ON public.gamification_profiles FOR ALL
USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
);

-- Gamification daily logs
DROP POLICY IF EXISTS "daily_tasks_log_access" ON public.daily_tasks_log;
CREATE POLICY "daily_tasks_log_access" ON public.daily_tasks_log FOR ALL
USING (
    athlete_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
);

-- Nutrition logs
DROP POLICY IF EXISTS "nutrition_logs_access" ON public.nutrition_logs;
CREATE POLICY "nutrition_logs_access" ON public.nutrition_logs FOR ALL
USING (
    athlete_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
);


