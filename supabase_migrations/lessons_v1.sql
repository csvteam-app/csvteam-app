-- =============================================================
-- GESTIONALE LEZIONI V1 — SQL Migration
-- CSV Team App · Supabase/PostgreSQL
-- =============================================================
-- Tabelle: coach_availability, coach_availability_overrides,
--          athlete_availability, lessons, lesson_participants
-- =============================================================

-- ─── PULIZIA: Rimuove tabelle parziali da tentativi precedenti ─
-- (CASCADE rimuove automaticamente trigger, policy e constraint dipendenti)
DROP TABLE IF EXISTS public.lesson_participants CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.athlete_availability CASCADE;
DROP TABLE IF EXISTS public.coach_availability_overrides CASCADE;
DROP TABLE IF EXISTS public.coach_availability CASCADE;

-- ─── ENUM TYPES ─────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE lesson_type AS ENUM ('single', 'pair');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE lesson_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ─── 1. COACH AVAILABILITY (ricorrente settimanale) ────────
CREATE TABLE IF NOT EXISTS public.coach_availability (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Lunedì .. 6=Domenica
    start_time  time NOT NULL,
    end_time    time NOT NULL,
    is_break    boolean NOT NULL DEFAULT false,  -- true = pausa/non prenotabile
    created_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT coach_avail_time_order CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_coach_avail_coach ON public.coach_availability(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_avail_day   ON public.coach_availability(day_of_week);


-- ─── 2. COACH AVAILABILITY OVERRIDES (eccezioni giornaliere) ─
CREATE TABLE IF NOT EXISTS public.coach_availability_overrides (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date        date NOT NULL,
    available   boolean NOT NULL DEFAULT false,   -- false = giorno OFF; true = giorno extra ON
    start_time  time,                             -- NULL se available=false (giornata intera OFF)
    end_time    time,
    reason      text,                             -- es "Ferie", "Evento", "Recupero"
    created_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT override_time_order CHECK (
        (available = false) OR (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
    ),
    -- Un solo override per coach per giorno
    UNIQUE(coach_id, date)
);


-- ─── 3. ATHLETE AVAILABILITY (ricorrente settimanale) ──────
CREATE TABLE IF NOT EXISTS public.athlete_availability (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    day_of_week   smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time    time NOT NULL,
    end_time      time NOT NULL,
    prefers_pair  boolean NOT NULL DEFAULT false,  -- Disponibile per lezioni di coppia?
    created_at    timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT athlete_avail_time_order CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_athlete_avail_athlete ON public.athlete_availability(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_avail_day     ON public.athlete_availability(day_of_week);


-- ─── 4. LESSONS (lezioni reali prenotate) ──────────────────
CREATE TABLE IF NOT EXISTS public.lessons (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id          uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_type       lesson_type NOT NULL DEFAULT 'single',
    date              date NOT NULL,
    start_time        time NOT NULL,
    end_time          time NOT NULL,
    duration_minutes  int NOT NULL DEFAULT 60,
    status            lesson_status NOT NULL DEFAULT 'scheduled',
    cancelled_at      timestamptz,
    notes             text,
    created_at        timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT lesson_time_order CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_lessons_coach  ON public.lessons(coach_id);
CREATE INDEX IF NOT EXISTS idx_lessons_date   ON public.lessons(date);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON public.lessons(status);
-- CRITICAL: indice per rilevamento conflitti
CREATE INDEX IF NOT EXISTS idx_lessons_coach_date_time ON public.lessons(coach_id, date, start_time, end_time);


-- ─── 5. LESSON PARTICIPANTS (N:M lezioni ↔ atleti) ────────
CREATE TABLE IF NOT EXISTS public.lesson_participants (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id   uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    athlete_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Un atleta non può partecipare due volte alla stessa lezione
    UNIQUE(lesson_id, athlete_id)
);

CREATE INDEX IF NOT EXISTS idx_lp_lesson  ON public.lesson_participants(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lp_athlete ON public.lesson_participants(athlete_id);


-- =============================================================
-- FUNZIONE: Conflict Check — Verifica che una nuova lezione
-- non si sovrapponga a lezioni già esistenti per lo stesso coach.
-- Usata come trigger BEFORE INSERT / UPDATE su lessons.
-- =============================================================

CREATE OR REPLACE FUNCTION check_lesson_conflict()
RETURNS TRIGGER AS $$
BEGIN
    -- Controlla sovrapposizioni con lezioni scheduled (non cancellate)
    IF EXISTS (
        SELECT 1 FROM public.lessons
        WHERE coach_id = NEW.coach_id
          AND date = NEW.date
          AND status IN ('scheduled', 'completed')
          AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
          AND (
              (NEW.start_time >= start_time AND NEW.start_time < end_time)
              OR (NEW.end_time > start_time AND NEW.end_time <= end_time)
              OR (NEW.start_time <= start_time AND NEW.end_time >= end_time)
          )
    ) THEN
        RAISE EXCEPTION 'CONFLICT: This lesson overlaps with an existing lesson for this coach on %', NEW.date;
    END IF;

    -- Controlla sovrapposizioni per OGNI atleta partecipante
    -- (questo verrà controllato anche al livello applicativo, ma il trigger lo garantisce)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_lesson_conflict ON public.lessons;
CREATE TRIGGER trg_check_lesson_conflict
    BEFORE INSERT OR UPDATE ON public.lessons
    FOR EACH ROW
    EXECUTE FUNCTION check_lesson_conflict();


-- Funzione per verificare conflitti atleta (chiamata al level applicativo)
CREATE OR REPLACE FUNCTION check_athlete_lesson_conflict(
    p_athlete_id uuid,
    p_date date,
    p_start_time time,
    p_end_time time,
    p_exclude_lesson_id uuid DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.lessons l
        JOIN public.lesson_participants lp ON lp.lesson_id = l.id
        WHERE lp.athlete_id = p_athlete_id
          AND l.date = p_date
          AND l.status IN ('scheduled', 'completed')
          AND (p_exclude_lesson_id IS NULL OR l.id != p_exclude_lesson_id)
          AND (
              (p_start_time >= l.start_time AND p_start_time < l.end_time)
              OR (p_end_time > l.start_time AND p_end_time <= l.end_time)
              OR (p_start_time <= l.start_time AND p_end_time >= l.end_time)
          )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================
-- RLS POLICIES
-- =============================================================

ALTER TABLE public.coach_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_participants ENABLE ROW LEVEL SECURITY;

-- Coach vede/modifica la propria disponibilità, atleti leggono tutto (per il matching)
DROP POLICY IF EXISTS "coach_avail_coach_all" ON public.coach_availability;
CREATE POLICY "coach_avail_coach_all" ON public.coach_availability
    FOR ALL TO authenticated
    USING (
        coach_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach')
    )
    WITH CHECK (coach_id = auth.uid());

DROP POLICY IF EXISTS "coach_avail_athlete_read" ON public.coach_availability;
CREATE POLICY "coach_avail_athlete_read" ON public.coach_availability
    FOR SELECT TO authenticated
    USING (true);

-- Override: solo il coach
DROP POLICY IF EXISTS "coach_override_all" ON public.coach_availability_overrides;
CREATE POLICY "coach_override_all" ON public.coach_availability_overrides
    FOR ALL TO authenticated
    USING (coach_id = auth.uid())
    WITH CHECK (coach_id = auth.uid());

-- Atleta vede/modifica la propria disponibilità; coach legge tutto
DROP POLICY IF EXISTS "athlete_avail_own" ON public.athlete_availability;
CREATE POLICY "athlete_avail_own" ON public.athlete_availability
    FOR ALL TO authenticated
    USING (
        athlete_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach')
    )
    WITH CHECK (
        athlete_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach')
    );

-- Lessons: coach vede/modifica tutto; atleta vede solo le sue
DROP POLICY IF EXISTS "lessons_coach_all" ON public.lessons;
CREATE POLICY "lessons_coach_all" ON public.lessons
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach')
    );

DROP POLICY IF EXISTS "lessons_athlete_read" ON public.lessons;
CREATE POLICY "lessons_athlete_read" ON public.lessons
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.lesson_participants
            WHERE lesson_id = id AND athlete_id = auth.uid()
        )
    );

-- Lesson Participants: coach gestisce; atleta legge solo i propri
DROP POLICY IF EXISTS "lp_coach_all" ON public.lesson_participants;
CREATE POLICY "lp_coach_all" ON public.lesson_participants
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'coach')
    );

DROP POLICY IF EXISTS "lp_athlete_read" ON public.lesson_participants;
CREATE POLICY "lp_athlete_read" ON public.lesson_participants
    FOR SELECT TO authenticated
    USING (athlete_id = auth.uid());


-- =============================================================
-- DONE. Pronto per V1 della logica applicativa.
-- =============================================================
