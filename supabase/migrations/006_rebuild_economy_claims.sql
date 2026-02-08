create or replace function public.claim_daily_task(
  p_task_id text,
  p_coin_reward integer,
  p_xp_reward integer default 0,
  p_energy_reward integer default 0
)
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

  if coalesce(p_coin_reward, 0) < 0 or coalesce(p_xp_reward, 0) < 0 or coalesce(p_energy_reward, 0) < 0 then
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
  set
    coins = coins + coalesce(p_coin_reward, 0),
    xp = xp + coalesce(p_xp_reward, 0),
    energy = least(max_energy, energy + coalesce(p_energy_reward, 0))
  where id = uid;

  return true;
end;
$$;

create or replace function public.claim_daily_task(
  p_task_id text,
  p_reward integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.claim_daily_task(p_task_id, p_reward, 0, 0);
end;
$$;

grant execute on function public.claim_daily_task(text, integer, integer, integer) to authenticated;
grant execute on function public.claim_daily_task(text, integer) to authenticated;
