-- ============================================================
-- CSV TEAM: FIX SICUREZZA RLS — PRE-LANCIO
-- ============================================================
-- AZIONE: Rimuove SOLO le policy _all_access (USING(true) FOR ALL)
-- create da FULL_SCHEMA_FIX.sql su 24 tabelle.
-- Le policy restrittive di FINAL_COACH_MIGRATION.sql restano attive.
-- ============================================================

-- ─── FASE 1: DROP policy _all_access da FULL_SCHEMA_FIX.sql ─
DO $$ DECLARE tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'programs','program_days','program_exercises','athlete_programs',
        'workout_sessions','logbook_sets','workout_checkins','workout_logs',
        'exercise_logs','daily_logs','log_meals','nutrition_targets',
        'nutrition_logs','food_items','chat_messages','lessons',
        'user_progress_logs','gamification_profiles','daily_tasks_log',
        'coaching_appointments','coach_athlete_assignments',
        'client_nutrition_alerts','exercises','status_dictionary'
    ]) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
            tbl || '_all_access', tbl);
    END LOOP;
END $$;

-- ─── FASE 2: DROP policy open da FIX_ALL_RLS.sql ───────────
DO $$ DECLARE tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'programs','program_days','exercises',
        'program_exercises','athlete_programs'
    ]) LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON public.%I',
            'Enable read access for all authenticated users on ' || tbl, tbl
        );
    END LOOP;
END $$;

-- ─── FASE 3: DROP policy CRUD open da FIX_RLS_PROGRAM_EXERCISES ─
DROP POLICY IF EXISTS "Enable read access for all authenticated users on program_exercises" ON public.program_exercises;
DROP POLICY IF EXISTS "Enable insert access for all authenticated users on program_exercises" ON public.program_exercises;
DROP POLICY IF EXISTS "Enable update access for all authenticated users on program_exercises" ON public.program_exercises;
DROP POLICY IF EXISTS "Enable delete access for all authenticated users on program_exercises" ON public.program_exercises;

-- ─── FASE 4: Ricrea policy corrette per tabelle CONDIVISE ───
-- programs: SELECT open (atleti devono caricare scheda), WRITE solo coach
DROP POLICY IF EXISTS "programs_select" ON public.programs;
CREATE POLICY "programs_select" ON public.programs
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "programs_write" ON public.programs;
CREATE POLICY "programs_write" ON public.programs
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coach','superadmin')));
DROP POLICY IF EXISTS "programs_update" ON public.programs;
CREATE POLICY "programs_update" ON public.programs
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coach','superadmin')));
DROP POLICY IF EXISTS "programs_delete" ON public.programs;
CREATE POLICY "programs_delete" ON public.programs
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coach','superadmin')));

-- program_days: SELECT open, WRITE solo coach
DROP POLICY IF EXISTS "program_days_select" ON public.program_days;
CREATE POLICY "program_days_select" ON public.program_days
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "program_days_write" ON public.program_days;
CREATE POLICY "program_days_write" ON public.program_days
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coach','superadmin')));
DROP POLICY IF EXISTS "program_days_update" ON public.program_days;
CREATE POLICY "program_days_update" ON public.program_days
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coach','superadmin')));
DROP POLICY IF EXISTS "program_days_delete" ON public.program_days;
CREATE POLICY "program_days_delete" ON public.program_days
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coach','superadmin')));

-- program_exercises: SELECT open, WRITE solo coach
DROP POLICY IF EXISTS "program_exercises_select" ON public.program_exercises;
CREATE POLICY "program_exercises_select" ON public.program_exercises
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "program_exercises_write" ON public.program_exercises;
CREATE POLICY "program_exercises_write" ON public.program_exercises
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coach','superadmin')));
DROP POLICY IF EXISTS "program_exercises_update" ON public.program_exercises;
CREATE POLICY "program_exercises_update" ON public.program_exercises
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coach','superadmin')));
DROP POLICY IF EXISTS "program_exercises_delete" ON public.program_exercises;
CREATE POLICY "program_exercises_delete" ON public.program_exercises
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coach','superadmin')));


-- ============================================================
-- VERIFICA FINALE — Esegui dopo lo script per confermare
-- ============================================================
-- SELECT tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND policyname LIKE '%all_access%'
-- ORDER BY tablename;
-- Risultato atteso: 0 righe
-- ============================================================
