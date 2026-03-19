-- ============================================================
-- CSV TEAM: FIX COMPLETO SCHEMA DATABASE
-- Crea TUTTE le tabelle e colonne mancanti
-- Esegui in Supabase SQL Editor — sicuro da rieseguire
-- ============================================================

-- ─────────────────────────────────────────
-- 1. PROFILES (dovrebbe esistere gia)
-- ─────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'athlete';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bodyweight NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bodyweight_kg NUMERIC;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lesson_preference TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credit_singola_remaining INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credit_coppia_remaining INTEGER DEFAULT 0;

-- ─────────────────────────────────────────
-- 2. PROGRAMS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- 3. PROGRAM_DAYS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS program_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    name TEXT,
    day_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE program_days ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE program_days ADD COLUMN IF NOT EXISTS day_order INTEGER DEFAULT 0;

-- ─────────────────────────────────────────
-- 4. EXERCISES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    primary_muscle_group TEXT DEFAULT 'chest',
    video_url TEXT,
    equipment_category TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS primary_muscle_group TEXT DEFAULT 'chest';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS equipment_category TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- ─────────────────────────────────────────
-- 5. PROGRAM_EXERCISES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS program_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id UUID REFERENCES program_days(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    sets INTEGER DEFAULT 3,
    reps TEXT DEFAULT '10',
    rest_seconds INTEGER DEFAULT 90,
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE program_exercises ADD COLUMN IF NOT EXISTS day_id UUID REFERENCES program_days(id) ON DELETE CASCADE;
ALTER TABLE program_exercises ADD COLUMN IF NOT EXISTS exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE;
ALTER TABLE program_exercises ADD COLUMN IF NOT EXISTS sets INTEGER DEFAULT 3;
ALTER TABLE program_exercises ADD COLUMN IF NOT EXISTS reps TEXT DEFAULT '10';
ALTER TABLE program_exercises ADD COLUMN IF NOT EXISTS rest_seconds INTEGER DEFAULT 90;
ALTER TABLE program_exercises ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE program_exercises ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- ─────────────────────────────────────────
-- 6. ATHLETE_PROGRAMS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS athlete_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE athlete_programs ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT now();

-- ─────────────────────────────────────────
-- 7. WORKOUT_SESSIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    program_day_id UUID REFERENCES program_days(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS program_day_id UUID REFERENCES program_days(id) ON DELETE SET NULL;
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- ─────────────────────────────────────────
-- 8. LOGBOOK_SETS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS logbook_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
    program_exercise_id UUID REFERENCES program_exercises(id) ON DELETE SET NULL,
    set_number INTEGER DEFAULT 1,
    reps INTEGER,
    weight NUMERIC,
    rpe NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE logbook_sets ADD COLUMN IF NOT EXISTS program_exercise_id UUID REFERENCES program_exercises(id) ON DELETE SET NULL;
ALTER TABLE logbook_sets ADD COLUMN IF NOT EXISTS rpe NUMERIC;
ALTER TABLE logbook_sets ADD COLUMN IF NOT EXISTS set_number INTEGER DEFAULT 1;

-- ─────────────────────────────────────────
-- 9. WORKOUT_CHECKINS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workout_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
    pump_rating INTEGER,
    energy_rating INTEGER,
    difficulty INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- 10. WORKOUT_LOGS (per le views analytics)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
    program_day_id UUID REFERENCES program_days(id) ON DELETE SET NULL,
    session_date DATE DEFAULT CURRENT_DATE,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS session_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE SET NULL;
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS program_day_id UUID REFERENCES program_days(id) ON DELETE SET NULL;
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;

-- ─────────────────────────────────────────
-- 11. EXERCISE_LOGS (per views analytics)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exercise_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
    weight_kg NUMERIC,
    reps_completed INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- 12. DAILY_LOGS + LOG_MEALS (nutrizione analytics)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    log_date DATE DEFAULT CURRENT_DATE,
    total_calories NUMERIC DEFAULT 0,
    total_protein NUMERIC DEFAULT 0,
    total_carbs NUMERIC DEFAULT 0,
    total_fat NUMERIC DEFAULT 0,
    target_calories NUMERIC,
    target_protein NUMERIC,
    target_carbs NUMERIC,
    target_fat NUMERIC,
    active_nutrition_target_id UUID,
    completion_status TEXT DEFAULT 'incomplete',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS log_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
    meal_type TEXT,
    food_name TEXT,
    amount_g NUMERIC,
    calories NUMERIC,
    protein NUMERIC,
    carbs NUMERIC,
    fat NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- 13. NUTRITION_TARGETS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nutrition_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    calories NUMERIC DEFAULT 2000,
    protein NUMERIC DEFAULT 150,
    carbs NUMERIC DEFAULT 200,
    fats NUMERIC DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE nutrition_targets ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE nutrition_targets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ─────────────────────────────────────────
-- 14. NUTRITION_LOGS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    food_id UUID,
    custom_food_name TEXT,
    amount_g NUMERIC,
    kcal NUMERIC,
    protein_g NUMERIC,
    carbs_g NUMERIC,
    fat_g NUMERIC,
    meal_type TEXT DEFAULT 'snack',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- 15. FOOD_ITEMS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    calories_per_g NUMERIC,
    protein_per_g NUMERIC,
    carbs_per_g NUMERIC,
    fat_per_g NUMERIC,
    serving_type TEXT DEFAULT 'grams',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- 16. CHAT_MESSAGES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- 17. LESSONS (Academy)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    category TEXT,
    video_url TEXT,
    content TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- ─────────────────────────────────────────
-- 18. USER_PROGRESS_LOGS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_progress_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    weight_kg NUMERIC,
    bodyfat_percent NUMERIC,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- 19. GAMIFICATION_PROFILES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gamification_profiles (
    athlete_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    xp INTEGER DEFAULT 0,
    wallet_balance INTEGER DEFAULT 0,
    current_league TEXT DEFAULT 'bronze',
    streak_days INTEGER DEFAULT 0,
    last_active_date DATE,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE gamification_profiles ADD COLUMN IF NOT EXISTS wallet_balance INTEGER DEFAULT 0;
ALTER TABLE gamification_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ─────────────────────────────────────────
-- 20. DAILY_TASKS_LOG
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_tasks_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL,
    completed_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- 21. COACHING_APPOINTMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaching_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    athlete_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 60,
    status TEXT DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- 22. COACH_ATHLETE_ASSIGNMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coach_athlete_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- 23. CLIENT_NUTRITION_ALERTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_nutrition_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    alert_type TEXT,
    message TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- 24. STATUS_DICTIONARY (traffic lights)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS status_dictionary (
    status_code TEXT PRIMARY KEY,
    label_coach TEXT,
    label_client TEXT,
    dot_color_token TEXT,
    badge_bg_token TEXT,
    badge_text_token TEXT,
    action_coach TEXT,
    sort_weight INTEGER DEFAULT 0
);

INSERT INTO status_dictionary (status_code, label_coach, label_client, dot_color_token, badge_bg_token, badge_text_token, action_coach, sort_weight) VALUES
    ('green', 'On Track', 'Tutto OK', '#4ade80', 'rgba(74,222,128,0.12)', '#4ade80', 'Nessuna azione richiesta', 4),
    ('yellow', 'Attenzione', 'Da migliorare', '#facc15', 'rgba(250,204,21,0.12)', '#facc15', 'Monitorare', 3),
    ('red', 'Critico', 'Critico', '#f87171', 'rgba(248,113,113,0.12)', '#f87171', 'Intervento urgente', 2),
    ('gray', 'Nessun dato', 'Nessun dato', '#6b7280', 'rgba(107,114,128,0.12)', '#6b7280', 'In attesa di dati', 1)
ON CONFLICT (status_code) DO NOTHING;

-- ─────────────────────────────────────────
-- ENABLE RLS (sicurezza base)
-- ─────────────────────────────────────────
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE logbook_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_athlete_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_nutrition_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────
-- RLS POLICIES (accesso aperto per authenticated users)
-- Per ogni tabella: SELECT, INSERT, UPDATE, DELETE
-- ─────────────────────────────────────────
DO $$
DECLARE
    tbl TEXT;
    pol TEXT;
BEGIN
    FOR tbl IN
        SELECT unnest(ARRAY[
            'programs','program_days','program_exercises','athlete_programs',
            'workout_sessions','logbook_sets','workout_checkins','workout_logs',
            'exercise_logs','daily_logs','log_meals','nutrition_targets',
            'nutrition_logs','food_items','chat_messages','lessons',
            'user_progress_logs','gamification_profiles','daily_tasks_log',
            'coaching_appointments','coach_athlete_assignments',
            'client_nutrition_alerts','exercises','status_dictionary'
        ])
    LOOP
        pol := tbl || '_all_access';
        -- Drop existing policy if exists, then create
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol, tbl);
            EXECUTE format(
                'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
                pol, tbl
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Skipped policy for %: %', tbl, SQLERRM;
        END;
    END LOOP;
END $$;

-- ─────────────────────────────────────────
-- DONE! Tutte le tabelle e colonne sono al completo.
-- ─────────────────────────────────────────
