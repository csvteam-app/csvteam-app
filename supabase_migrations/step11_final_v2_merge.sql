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

-- Lezioni completed: l'atleta legge e scrive le proprie
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

-- Gamification profiles: l'atleta legge/scrive il proprio
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
