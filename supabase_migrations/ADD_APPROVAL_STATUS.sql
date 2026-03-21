-- Migration: Add approval_status column to profiles
-- Enables admin-controlled user activation (pending → approved / rejected)

-- 1. Add the column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending';

-- 2. All existing users are already approved (grandfather them in)
UPDATE public.profiles
  SET approval_status = 'approved'
  WHERE approval_status = 'pending';

-- 3. Ensure valid values via CHECK constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_approval_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- 4. Update handle_new_user trigger so new signups start as 'pending'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at, approval_status, subscription_status, subscription_plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NOW(),
    'pending',
    COALESCE(NEW.raw_user_meta_data->>'subscription_status', 'inactive'),
    NEW.raw_user_meta_data->>'subscription_plan'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
