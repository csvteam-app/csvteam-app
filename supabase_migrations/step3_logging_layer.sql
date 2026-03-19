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

