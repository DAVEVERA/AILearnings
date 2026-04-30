-- ============================================================
--  Oostendorp Meets AI — Supabase Database Setup (idempotent)
--  Plak dit script in: Supabase Dashboard → SQL Editor → Run
--  Veilig om meerdere keren uit te voeren.
-- ============================================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT,
  department      TEXT,
  department_id   TEXT,
  role            TEXT,
  ai_experience   TEXT,
  learning_style  TEXT,
  available_time  INTEGER,
  current_tools   TEXT[],
  main_challenge  TEXT,
  learning_goal   TEXT,
  analysis_result JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gebruiker leest eigen profiel"    ON public.profiles;
DROP POLICY IF EXISTS "Gebruiker schrijft eigen profiel" ON public.profiles;
DROP POLICY IF EXISTS "Gebruiker updatet eigen profiel"  ON public.profiles;

CREATE POLICY "Gebruiker leest eigen profiel"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Gebruiker schrijft eigen profiel"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Gebruiker updatet eigen profiel"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- 2. MODULE_PROGRESS
CREATE TABLE IF NOT EXISTS public.module_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id   TEXT NOT NULL,
  level           TEXT NOT NULL,
  module_index    INTEGER NOT NULL,
  score           INTEGER DEFAULT 0,
  completed       BOOLEAN DEFAULT FALSE,
  time_spent      INTEGER DEFAULT 0,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, department_id, level, module_index)
);

ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gebruiker leest eigen voortgang"   ON public.module_progress;
DROP POLICY IF EXISTS "Gebruiker schrijft eigen voortgang" ON public.module_progress;
DROP POLICY IF EXISTS "Gebruiker updatet eigen voortgang"  ON public.module_progress;

CREATE POLICY "Gebruiker leest eigen voortgang"
  ON public.module_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Gebruiker schrijft eigen voortgang"
  ON public.module_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Gebruiker updatet eigen voortgang"
  ON public.module_progress FOR UPDATE USING (auth.uid() = user_id);


-- 3. USER_BADGES
CREATE TABLE IF NOT EXISTS public.user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id   TEXT NOT NULL,
  earned_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gebruiker leest eigen badges"   ON public.user_badges;
DROP POLICY IF EXISTS "Gebruiker schrijft eigen badges" ON public.user_badges;

CREATE POLICY "Gebruiker leest eigen badges"
  ON public.user_badges FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Gebruiker schrijft eigen badges"
  ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
