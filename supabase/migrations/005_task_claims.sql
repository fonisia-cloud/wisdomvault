create table if not exists public.task_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id text not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, task_id)
);

alter table public.task_claims enable row level security;

drop policy if exists "task_claims_all_own" on public.task_claims;
create policy "task_claims_all_own" on public.task_claims
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.claim_daily_task(p_task_id text, p_reward integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  last_claim timestamptz;
begin
  uid := auth.uid();
  if uid is null then
    return false;
  end if;

  if p_reward is null or p_reward < 0 then
    return false;
  end if;

  select claimed_at into last_claim
  from public.task_claims
  where user_id = uid and task_id = p_task_id;

  if last_claim is not null and last_claim > now() - interval '24 hours' then
    return false;
  end if;

  insert into public.task_claims (user_id, task_id, claimed_at)
  values (uid, p_task_id, now())
  on conflict (user_id, task_id)
  do update set claimed_at = excluded.claimed_at;

  update public.profiles
  set coins = coins + p_reward
  where id = uid;

  return true;
end;
$$;

grant execute on function public.claim_daily_task(text, integer) to authenticated;
