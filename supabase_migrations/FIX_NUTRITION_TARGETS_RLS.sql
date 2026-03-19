-- ============================================================
-- FIX: Ensure nutrition_targets RLS policies exist
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Verify RLS is enabled
ALTER TABLE nutrition_targets ENABLE ROW LEVEL SECURITY;

-- 2. Check existing policies (run this first to see what's there)
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'nutrition_targets';

-- 3. Create SELECT policy: athletes read their own, coaches read assigned
DROP POLICY IF EXISTS "coach_athlete_read_nt" ON nutrition_targets;
CREATE POLICY "coach_athlete_read_nt" ON nutrition_targets 
FOR SELECT USING (
    athlete_id = auth.uid() 
    OR coach_id = auth.uid() 
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
    OR EXISTS (
        SELECT 1 FROM coach_athlete_assignments 
        WHERE coach_athlete_assignments.athlete_id = nutrition_targets.athlete_id 
        AND coach_athlete_assignments.coach_id = auth.uid() 
        AND status = 'active'
    )
);

-- 4. Create INSERT policy: only coaches/superadmin can insert
DROP POLICY IF EXISTS "coach_insert_nt" ON nutrition_targets;
CREATE POLICY "coach_insert_nt" ON nutrition_targets 
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
);

-- 5. Create UPDATE policy: only coaches/superadmin can update
DROP POLICY IF EXISTS "coach_update_nt" ON nutrition_targets;
CREATE POLICY "coach_update_nt" ON nutrition_targets 
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
);
