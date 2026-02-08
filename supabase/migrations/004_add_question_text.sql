alter table if exists public.mistakes
  add column if not exists question_text text not null default '';
