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
    task_type TEXT NOT NULL, -- 'steps', 'workout', 'nutrition', 'photo'
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(athlete_id, date, task_type)
);

CREATE TABLE IF NOT EXISTS user_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL, -- e.g. 'theme_synthwave'
    item_type TEXT NOT NULL, -- e.g. 'theme', 'badge', 'coach_call'
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
    meal_type TEXT, -- e.g. 'breakfast', 'lunch'
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
