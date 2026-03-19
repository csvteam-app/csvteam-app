-- Fix RLS per program_exercises
ALTER TABLE public.program_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all authenticated users on program_exercises" ON public.program_exercises;
CREATE POLICY "Enable read access for all authenticated users on program_exercises" 
ON public.program_exercises FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Enable insert access for all authenticated users on program_exercises" ON public.program_exercises;
CREATE POLICY "Enable insert access for all authenticated users on program_exercises" 
ON public.program_exercises FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all authenticated users on program_exercises" ON public.program_exercises;
CREATE POLICY "Enable update access for all authenticated users on program_exercises" 
ON public.program_exercises FOR UPDATE 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Enable delete access for all authenticated users on program_exercises" ON public.program_exercises;
CREATE POLICY "Enable delete access for all authenticated users on program_exercises" 
ON public.program_exercises FOR DELETE 
TO authenticated 
USING (true);
