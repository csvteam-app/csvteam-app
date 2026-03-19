-- =============================================================
-- GESTIONALE LEZIONI V2 — SQL Migration
-- CSV Team App · Supabase/PostgreSQL
-- Tabella: lesson_packages (pacchetti crediti)
-- =============================================================

-- ─── PULIZIA ─────────────────────────────────────────────────
DROP TABLE IF EXISTS public.lesson_packages CASCADE;

-- ─── LESSON PACKAGES (Pacchetti crediti acquistati) ──────────
CREATE TABLE public.lesson_packages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    package_type    lesson_type NOT NULL DEFAULT 'single',  -- riuso enum 'single' | 'pair'
    total_credits   int NOT NULL CHECK (total_credits > 0),
    used_credits    int NOT NULL DEFAULT 0 CHECK (used_credits >= 0),
    purchased_at    timestamptz NOT NULL DEFAULT now(),
    expires_at      timestamptz,                           -- NULL = non scade mai
    notes           text,                                  -- es. "Pacchetto 10 lezioni singole"
    created_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT credits_not_exceed CHECK (used_credits <= total_credits)
);

CREATE INDEX IF NOT EXISTS idx_packages_athlete ON public.lesson_packages(athlete_id);
CREATE INDEX IF NOT EXISTS idx_packages_type    ON public.lesson_packages(package_type);

-- ─── RLS ─────────────────────────────────────────────────────
ALTER TABLE public.lesson_packages ENABLE ROW LEVEL SECURITY;

-- Coach: CRUD completo
DROP POLICY IF EXISTS "pkg_coach_all" ON public.lesson_packages;
CREATE POLICY "pkg_coach_all" ON public.lesson_packages
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach')
    );

-- Atleta: solo lettura dei propri pacchetti
DROP POLICY IF EXISTS "pkg_athlete_read" ON public.lesson_packages;
CREATE POLICY "pkg_athlete_read" ON public.lesson_packages
    FOR SELECT TO authenticated
    USING (athlete_id = auth.uid());

-- =============================================================
-- DONE. Pronto per V2 Pacchetti & Crediti.
-- =============================================================
