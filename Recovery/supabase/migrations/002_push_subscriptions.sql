-- Recovery Journal - Push Subscriptions
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- ============================================
-- PUSH SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  morning_enabled BOOLEAN DEFAULT true,
  evening_enabled BOOLEAN DEFAULT true,
  morning_time TIME DEFAULT '08:00',
  evening_time TIME DEFAULT '20:00',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Index for looking up subscriptions by user
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions(user_id);

-- Index for cron job queries (find subscriptions needing notification)
CREATE INDEX IF NOT EXISTS idx_push_subs_morning ON public.push_subscriptions(morning_enabled, morning_time);
CREATE INDEX IF NOT EXISTS idx_push_subs_evening ON public.push_subscriptions(evening_enabled, evening_time);

-- Auto-update trigger
CREATE TRIGGER update_push_subs_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);
