-- Migration to add subscription integration fields to `profiles` table

-- Add columns for subscription state
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_plan text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

-- Update the handle_new_user trigger function to optionally accept these if passed in raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at, subscription_status, subscription_plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NOW(),
    COALESCE(NEW.raw_user_meta_data->>'subscription_status', 'inactive'),
    NEW.raw_user_meta_data->>'subscription_plan'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
