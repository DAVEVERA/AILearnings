-- ═══════════════════════════════════════════════════════════════════════════
--  AILearnings Platform — Supabase Migration
--  Uitvoeren via: Supabase Dashboard → SQL Editor → Paste & Run
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. PROFILES (gekoppeld aan Supabase Auth users)
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  name            text not null,
  department      text not null default '',
  department_id   text not null default '',
  role            text not null default '',
  ai_experience   text not null default 'geen',
  learning_style  text not null default 'mix',
  available_time  text not null default '30',
  current_tools   text[] not null default '{}',
  main_challenge  text not null default '',
  learning_goal   text not null default '',
  analysis_result jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-update updated_at trigger
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure update_updated_at();

-- 2. MODULE VOORTGANG
create table if not exists public.module_progress (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  module_id           text not null,
  department_id       text not null,
  level               text not null,
  module_index        int  not null,
  completed           boolean not null default false,
  score               int,
  max_score           int,
  time_spent_seconds  int,
  started_at          timestamptz,
  completed_at        timestamptz,
  attempts            int not null default 0,
  answers             int[],
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique(user_id, module_id)
);

create trigger module_progress_updated_at
  before update on public.module_progress
  for each row execute procedure update_updated_at();

create index if not exists idx_module_progress_user     on public.module_progress(user_id);
create index if not exists idx_module_progress_completed on public.module_progress(user_id, completed);

-- 3. BADGES
create table if not exists public.user_badges (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  badge_id   text not null,
  earned_at  timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, badge_id)
);

create index if not exists idx_user_badges_user on public.user_badges(user_id);

-- 4. ROW LEVEL SECURITY (RLS)
alter table public.profiles        enable row level security;
alter table public.module_progress enable row level security;
alter table public.user_badges     enable row level security;

-- Elke gebruiker ziet alleen zijn eigen data
create policy "profiles_own"  on public.profiles
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "progress_own"  on public.module_progress
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "badges_own"    on public.user_badges
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5. Automatisch profiel aanmaken bij registratie
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end; $$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
