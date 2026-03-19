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
