-- Run this if your project had legacy tables before this app integration.
-- It patches column/constraint mismatches without dropping existing data.

create extension if not exists "pgcrypto";

-- mistakes table compatibility
alter table if exists public.mistakes add column if not exists image_url text;
alter table if exists public.mistakes add column if not exists tags text[] not null default '{}';
alter table if exists public.mistakes add column if not exists subject text not null default '未分类';
alter table if exists public.mistakes add column if not exists difficulty integer not null default 3;
alter table if exists public.mistakes add column if not exists question_text text not null default '';
alter table if exists public.mistakes add column if not exists note text not null default '';
alter table if exists public.mistakes add column if not exists status text not null default 'pending';
alter table if exists public.mistakes add column if not exists created_at timestamptz not null default now();
alter table if exists public.mistakes add column if not exists updated_at timestamptz not null default now();

-- rewards table compatibility
alter table if exists public.rewards add column if not exists title text;
alter table if exists public.rewards add column if not exists price integer not null default 0;
alter table if exists public.rewards add column if not exists icon text not null default 'redeem';
alter table if exists public.rewards add column if not exists color text not null default 'blue';
alter table if exists public.rewards add column if not exists created_at timestamptz not null default now();
alter table if exists public.rewards add column if not exists updated_at timestamptz not null default now();

-- chat messages table compatibility
alter table if exists public.chat_messages add column if not exists role text not null default 'user';
alter table if exists public.chat_messages add column if not exists content text not null default '';
alter table if exists public.chat_messages add column if not exists created_at timestamptz not null default now();

-- app settings compatibility
alter table if exists public.app_settings add column if not exists font_size text not null default 'medium';
alter table if exists public.app_settings add column if not exists theme_color text not null default 'primary';
alter table if exists public.app_settings add column if not exists created_at timestamptz not null default now();
alter table if exists public.app_settings add column if not exists updated_at timestamptz not null default now();

-- parent settings compatibility
alter table if exists public.parent_settings add column if not exists pin text not null default '0000';
alter table if exists public.parent_settings add column if not exists daily_time_limit integer not null default 60;
alter table if exists public.parent_settings add column if not exists is_rest_mode boolean not null default false;
alter table if exists public.parent_settings add column if not exists created_at timestamptz not null default now();
alter table if exists public.parent_settings add column if not exists updated_at timestamptz not null default now();

-- convert user_id to uuid where needed
alter table if exists public.mistakes alter column user_id type uuid using user_id::uuid;
alter table if exists public.rewards alter column user_id type uuid using user_id::uuid;
alter table if exists public.chat_messages alter column user_id type uuid using user_id::uuid;
alter table if exists public.app_settings alter column user_id type uuid using user_id::uuid;
alter table if exists public.parent_settings alter column user_id type uuid using user_id::uuid;

-- remove legacy foreign keys to old app_users table, then bind to auth.users
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

-- sanity checks
alter table if exists public.mistakes
  add constraint mistakes_status_check check (status in ('pending', 'completed')) not valid;
alter table if exists public.mistakes validate constraint mistakes_status_check;

alter table if exists public.mistakes
  add constraint mistakes_difficulty_check check (difficulty between 1 and 5) not valid;
alter table if exists public.mistakes validate constraint mistakes_difficulty_check;
