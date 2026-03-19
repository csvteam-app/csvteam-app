-- Full RLS Fix per l'app atleti
DO $$ 
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['programs', 'program_days', 'exercises', 'program_exercises', 'athlete_programs'])
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all authenticated users on %I" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "Enable read access for all authenticated users on %I" ON public.%I FOR SELECT TO authenticated USING (true)', tbl, tbl);
    END LOOP;
END $$;
