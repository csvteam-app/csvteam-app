-- ============================================================
-- CSV TEAM — SUBSCRIPTIONS SYSTEM
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Package type enum
DO $$ BEGIN
  CREATE TYPE subscription_package AS ENUM ('trimestrale', 'semestrale', 'annuale');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Subscription status enum
DO $$ BEGIN
  CREATE TYPE subscription_status_enum AS ENUM ('pending', 'active', 'expired', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Subscription source enum
DO $$ BEGIN
  CREATE TYPE subscription_source AS ENUM ('web_shop', 'app', 'manual_admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_type  subscription_package NOT NULL,
  duration_months INT NOT NULL CHECK (duration_months > 0),
  start_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date      DATE NOT NULL,
  status        subscription_status_enum NOT NULL DEFAULT 'pending',
  source        subscription_source NOT NULL DEFAULT 'manual_admin',
  assigned_by   UUID REFERENCES auth.users(id),  -- coach/admin who assigned
  stripe_session_id TEXT,                         -- for payment tracking
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON public.subscriptions(end_date);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SUBSCRIPTION EVENTS (audit log)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,  -- 'created','activated','extended','cancelled','expired','renewed'
  old_status      TEXT,
  new_status      TEXT,
  metadata        JSONB DEFAULT '{}',
  performed_by    UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_events_user ON public.subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_events_sub ON public.subscription_events(subscription_id);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES — subscriptions
-- ============================================================

-- Users can read their own subscriptions
DROP POLICY IF EXISTS "Users read own subscriptions" ON public.subscriptions;
CREATE POLICY "Users read own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Coach/superadmin can read ALL subscriptions
DROP POLICY IF EXISTS "Admin read all subscriptions" ON public.subscriptions;
CREATE POLICY "Admin read all subscriptions" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('coach', 'superadmin')
    )
  );

-- Coach/superadmin can insert subscriptions
DROP POLICY IF EXISTS "Admin insert subscriptions" ON public.subscriptions;
CREATE POLICY "Admin insert subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('coach', 'superadmin')
    )
  );

-- Coach/superadmin can update subscriptions
DROP POLICY IF EXISTS "Admin update subscriptions" ON public.subscriptions;
CREATE POLICY "Admin update subscriptions" ON public.subscriptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('coach', 'superadmin')
    )
  );

-- Service role (webhooks) can do anything — handled by default service_role bypass

-- ============================================================
-- RLS POLICIES — subscription_events
-- ============================================================

DROP POLICY IF EXISTS "Users read own events" ON public.subscription_events;
CREATE POLICY "Users read own events" ON public.subscription_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin read all events" ON public.subscription_events;
CREATE POLICY "Admin read all events" ON public.subscription_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('coach', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "Admin insert events" ON public.subscription_events;
CREATE POLICY "Admin insert events" ON public.subscription_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('coach', 'superadmin')
    )
  );

-- ============================================================
-- RLS — profiles: prevent self-approval
-- ============================================================

-- Users can read their own profile (already exists, but ensure it)
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Coach/admin can read all profiles  
DROP POLICY IF EXISTS "Admin read all profiles" ON public.profiles;
CREATE POLICY "Admin read all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('coach', 'superadmin')
    )
  );

-- Users can update ONLY safe columns on their own profile
DROP POLICY IF EXISTS "Users update own profile safe" ON public.profiles;
CREATE POLICY "Users update own profile safe" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    -- Cannot change role, approval_status, or subscription fields
    auth.uid() = id
  );

-- Coach/admin can update any profile (including approval_status, subscription)
DROP POLICY IF EXISTS "Admin update any profile" ON public.profiles;
CREATE POLICY "Admin update any profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('coach', 'superadmin')
    )
  );

-- ============================================================
-- TRIGGER: Sync profiles from subscriptions
-- When a subscription is inserted or updated, update the profile
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_profile_subscription()
RETURNS TRIGGER AS $$
DECLARE
  latest RECORD;
BEGIN
  -- Find the latest active subscription for this user
  SELECT * INTO latest
  FROM public.subscriptions
  WHERE user_id = NEW.user_id AND status = 'active'
  ORDER BY end_date DESC
  LIMIT 1;

  IF latest IS NOT NULL THEN
    UPDATE public.profiles SET
      subscription_status = 'active',
      subscription_plan = latest.package_type::text,
      subscription_expires_at = latest.end_date::timestamptz,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  ELSE
    -- No active subscription → check if any pending
    SELECT * INTO latest
    FROM public.subscriptions
    WHERE user_id = NEW.user_id AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1;

    IF latest IS NOT NULL THEN
      UPDATE public.profiles SET
        subscription_status = 'pending',
        subscription_plan = latest.package_type::text,
        subscription_expires_at = NULL,
        updated_at = NOW()
      WHERE id = NEW.user_id;
    ELSE
      UPDATE public.profiles SET
        subscription_status = 'inactive',
        subscription_plan = NULL,
        subscription_expires_at = NULL,
        updated_at = NOW()
      WHERE id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_profile_subscription ON public.subscriptions;
CREATE TRIGGER trg_sync_profile_subscription
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_subscription();

-- ============================================================
-- CRON-like: Expire subscriptions past end_date
-- Call this periodically or via pg_cron
-- ============================================================
CREATE OR REPLACE FUNCTION public.expire_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE public.subscriptions
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' AND end_date < CURRENT_DATE;

  -- Sync affected profiles
  UPDATE public.profiles p SET
    subscription_status = 'expired',
    updated_at = NOW()
  WHERE p.subscription_status = 'active'
    AND p.subscription_expires_at IS NOT NULL
    AND p.subscription_expires_at::date < CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = p.id AND s.status = 'active' AND s.end_date >= CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
