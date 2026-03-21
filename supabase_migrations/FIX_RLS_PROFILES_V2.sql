-- ============================================================
-- FIX V2: RLS infinite recursion on profiles table
-- Problem: SELECT on profiles triggers "infinite recursion in policy"
-- Solution: 
--   1. Drop ALL policies on profiles
--   2. Recreate clean, simple policies 
--   3. Create get_my_profile() RPC as fallback
-- ============================================================

-- 1. DROP ALL existing policies on profiles (nuclear cleanup)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- 2. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Simple, non-recursive policies
-- SELECT: any authenticated user can read any profile (needed for coach views)
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: users can only insert their own profile
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE: users can only update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: only the user themselves (or service role)
CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- 4. Create a SECURITY DEFINER function to get own profile (bypasses RLS)
-- This is a failsafe: if RLS has issues, the app can call this instead
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM profiles WHERE id = auth.uid();
$$;

-- 5. Fix the role CHECK constraint to allow 'superadmin'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('athlete', 'coach', 'superadmin', 'client'));

-- 6. Ensure coach accounts are correctly set
UPDATE public.profiles SET role = 'coach', approval_status = 'approved'
WHERE email IN ('coach@csvteam.com', 'admin@csvteam.com', 'amministrazione@csvteam.com', 'danielecsv2001@gmail.com')
  AND role != 'coach';

-- ============================================================
-- DONE! Run this in Supabase SQL Editor.
-- ============================================================
