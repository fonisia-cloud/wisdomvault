create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '探索者',
  xp integer not null default 0,
  coins integer not null default 0,
  energy integer not null default 10,
  max_energy integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_xp_check check (xp >= 0),
  constraint profiles_coins_check check (coins >= 0),
  constraint profiles_energy_check check (energy >= 0),
  constraint profiles_max_energy_check check (max_energy > 0)
);

create table if not exists public.mistakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  tags text[] not null default '{}',
  difficulty integer not null default 3,
  question_text text not null default '',
  note text not null default '',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mistakes_difficulty_check check (difficulty between 1 and 5),
  constraint mistakes_status_check check (status in ('pending', 'completed'))
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  price integer not null,
  icon text not null default 'redeem',
  color text not null default 'blue',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rewards_price_check check (price >= 0)
);

create table if not exists public.app_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  font_size text not null default 'medium',
  theme_color text not null default 'primary',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_settings_font_size_check check (font_size in ('small', 'medium', 'large')),
  constraint app_settings_theme_color_check check (theme_color in ('primary', 'blue', 'green'))
);

create table if not exists public.parent_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pin text not null default '0000',
  daily_time_limit integer not null default 60,
  is_rest_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parent_settings_daily_time_limit_check check (daily_time_limit between 15 and 240),
  constraint parent_settings_pin_check check (pin ~ '^[0-9]{4}$')
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mistake_id uuid null references public.mistakes(id) on delete set null,
  role text not null,
  content text not null,
  created_at timestamptz not null default now(),
  constraint chat_messages_role_check check (role in ('system', 'user', 'assistant'))
);

create index if not exists idx_mistakes_user_id_created_at on public.mistakes(user_id, created_at desc);
create index if not exists idx_rewards_user_id_created_at on public.rewards(user_id, created_at asc);
create index if not exists idx_chat_messages_user_mistake_created_at on public.chat_messages(user_id, mistake_id, created_at asc);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();

drop trigger if exists trg_mistakes_updated_at on public.mistakes;
create trigger trg_mistakes_updated_at
before update on public.mistakes
for each row
execute function public.update_updated_at_column();

drop trigger if exists trg_rewards_updated_at on public.rewards;
create trigger trg_rewards_updated_at
before update on public.rewards
for each row
execute function public.update_updated_at_column();

drop trigger if exists trg_app_settings_updated_at on public.app_settings;
create trigger trg_app_settings_updated_at
before update on public.app_settings
for each row
execute function public.update_updated_at_column();

drop trigger if exists trg_parent_settings_updated_at on public.parent_settings;
create trigger trg_parent_settings_updated_at
before update on public.parent_settings
for each row
execute function public.update_updated_at_column();

alter table public.profiles enable row level security;
alter table public.mistakes enable row level security;
alter table public.rewards enable row level security;
alter table public.app_settings enable row level security;
alter table public.parent_settings enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "mistakes_all_own" on public.mistakes;
create policy "mistakes_all_own" on public.mistakes
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "rewards_all_own" on public.rewards;
create policy "rewards_all_own" on public.rewards
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "app_settings_all_own" on public.app_settings;
create policy "app_settings_all_own" on public.app_settings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "parent_settings_all_own" on public.parent_settings;
create policy "parent_settings_all_own" on public.parent_settings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "chat_messages_all_own" on public.chat_messages;
create policy "chat_messages_all_own" on public.chat_messages
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_name text;
begin
  safe_name := coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), '探索者');

  insert into public.profiles (id, display_name)
  values (new.id, safe_name)
  on conflict (id) do nothing;

  insert into public.app_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.parent_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
