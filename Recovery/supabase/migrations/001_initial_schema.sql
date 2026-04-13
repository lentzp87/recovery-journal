-- Recovery Journal - Initial Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- ============================================
-- USERS TABLE (extends Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  recovery_start_date DATE,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- JOURNAL ENTRIES
-- ============================================
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  title TEXT,
  content TEXT,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  gratitude TEXT,
  cravings_experienced BOOLEAN DEFAULT false,
  cravings_intensity INTEGER CHECK (cravings_intensity >= 1 AND cravings_intensity <= 10),
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

-- ============================================
-- STEP WORK (12-step program)
-- ============================================
CREATE TABLE IF NOT EXISTS public.step_work (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number >= 1 AND step_number <= 12),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  start_date DATE,
  completion_date DATE,
  reflection TEXT,
  sponsor_name TEXT,
  sponsor_contact TEXT,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, step_number)
);

-- ============================================
-- CHECK-INS (morning/evening)
-- ============================================
CREATE TABLE IF NOT EXISTS public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  check_in_type TEXT NOT NULL CHECK (check_in_type IN ('morning', 'evening')),
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  gratitude_items TEXT[],
  craving_level INTEGER CHECK (craving_level >= 1 AND craving_level <= 10),
  craving_notes TEXT,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, check_in_date, check_in_type)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_journal_user_date ON public.journal_entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_steps_user ON public.step_work(user_id, step_number);
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON public.check_ins(user_id, check_in_date DESC);

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_journal_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_steps_updated_at
  BEFORE UPDATE ON public.step_work
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_checkins_updated_at
  BEFORE UPDATE ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Journal entries policies
CREATE POLICY "Users can view own journal"
  ON public.journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own journal"
  ON public.journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal"
  ON public.journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal"
  ON public.journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Step work policies
CREATE POLICY "Users can view own steps"
  ON public.step_work FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own steps"
  ON public.step_work FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own steps"
  ON public.step_work FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own steps"
  ON public.step_work FOR DELETE
  USING (auth.uid() = user_id);

-- Check-ins policies
CREATE POLICY "Users can view own check-ins"
  ON public.check_ins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own check-ins"
  ON public.check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own check-ins"
  ON public.check_ins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own check-ins"
  ON public.check_ins FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
