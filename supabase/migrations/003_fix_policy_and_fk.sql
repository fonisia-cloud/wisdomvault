-- Fix migration conflicts when RLS policies depend on user_id type.
-- Run this after 002_align_legacy_schema.sql fails with policy dependency errors.

-- 1) Temporarily drop policies that reference user_id/id

drop policy if exists "mistakes_all_own" on public.mistakes;
drop policy if exists "rewards_all_own" on public.rewards;
drop policy if exists "chat_messages_all_own" on public.chat_messages;
drop policy if exists "app_settings_all_own" on public.app_settings;
drop policy if exists "parent_settings_all_own" on public.parent_settings;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;

-- 2) Ensure required columns exist (idempotent)

alter table if exists public.mistakes add column if not exists image_url text;
alter table if exists public.mistakes add column if not exists tags text[] not null default '{}';
alter table if exists public.mistakes add column if not exists subject text not null default '未分类';
alter table if exists public.mistakes add column if not exists difficulty integer not null default 3;
alter table if exists public.mistakes add column if not exists question_text text not null default '';
alter table if exists public.mistakes add column if not exists note text not null default '';
alter table if exists public.mistakes add column if not exists status text not null default 'pending';
alter table if exists public.mistakes add column if not exists created_at timestamptz not null default now();
alter table if exists public.mistakes add column if not exists updated_at timestamptz not null default now();

alter table if exists public.rewards add column if not exists title text;
alter table if exists public.rewards add column if not exists price integer not null default 0;
alter table if exists public.rewards add column if not exists icon text not null default 'redeem';
alter table if exists public.rewards add column if not exists color text not null default 'blue';
alter table if exists public.rewards add column if not exists created_at timestamptz not null default now();
alter table if exists public.rewards add column if not exists updated_at timestamptz not null default now();

alter table if exists public.chat_messages add column if not exists role text not null default 'user';
alter table if exists public.chat_messages add column if not exists content text not null default '';
alter table if exists public.chat_messages add column if not exists created_at timestamptz not null default now();

alter table if exists public.app_settings add column if not exists font_size text not null default 'medium';
alter table if exists public.app_settings add column if not exists theme_color text not null default 'primary';
alter table if exists public.app_settings add column if not exists created_at timestamptz not null default now();
alter table if exists public.app_settings add column if not exists updated_at timestamptz not null default now();

alter table if exists public.parent_settings add column if not exists pin text not null default '0000';
alter table if exists public.parent_settings add column if not exists daily_time_limit integer not null default 60;
alter table if exists public.parent_settings add column if not exists is_rest_mode boolean not null default false;
alter table if exists public.parent_settings add column if not exists created_at timestamptz not null default now();
alter table if exists public.parent_settings add column if not exists updated_at timestamptz not null default now();

-- 3) Convert user_id type to uuid

alter table if exists public.mistakes alter column user_id type uuid using user_id::uuid;
alter table if exists public.rewards alter column user_id type uuid using user_id::uuid;
alter table if exists public.chat_messages alter column user_id type uuid using user_id::uuid;
alter table if exists public.app_settings alter column user_id type uuid using user_id::uuid;
alter table if exists public.parent_settings alter column user_id type uuid using user_id::uuid;

-- 4) Rebind foreign keys from legacy app_users to auth.users

alter table if exists public.mistakes drop constraint if exists mistakes_user_id_fkey;
alter table if exists public.rewards drop constraint if exists rewards_user_id_fkey;
alter table if exists public.chat_messages drop constraint if exists chat_messages_user_id_fkey;
alter table if exists public.app_settings drop constraint if exists app_settings_user_id_fkey;
alter table if exists public.parent_settings drop constraint if exists parent_settings_user_id_fkey;

alter table if exists public.mistakes
  add constraint mistakes_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table if exists public.rewards
  add constraint rewards_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table if exists public.chat_messages
  add constraint chat_messages_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table if exists public.app_settings
  add constraint app_settings_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table if exists public.parent_settings
  add constraint parent_settings_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- 5) Recreate RLS policies

alter table if exists public.profiles enable row level security;
alter table if exists public.mistakes enable row level security;
alter table if exists public.rewards enable row level security;
alter table if exists public.app_settings enable row level security;
alter table if exists public.parent_settings enable row level security;
alter table if exists public.chat_messages enable row level security;

create policy "profiles_select_own" on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
for insert
with check (auth.uid() = id);

create policy "mistakes_all_own" on public.mistakes
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "rewards_all_own" on public.rewards
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "app_settings_all_own" on public.app_settings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "parent_settings_all_own" on public.parent_settings
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "chat_messages_all_own" on public.chat_messages
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 6) Constraints and trigger helpers

alter table if exists public.mistakes drop constraint if exists mistakes_status_check;
alter table if exists public.mistakes
  add constraint mistakes_status_check check (status in ('pending', 'completed'));

alter table if exists public.mistakes drop constraint if exists mistakes_difficulty_check;
alter table if exists public.mistakes
  add constraint mistakes_difficulty_check check (difficulty between 1 and 5);
