-- QR contest schema. Apply ONLY to the dedicated staging Supabase project after review.
-- No store tables are modified by this migration.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.contest_prizes (
  id uuid primary key default gen_random_uuid(),
  prize_order smallint not null unique check (prize_order between 1 and 3),
  prize_name text not null,
  created_at timestamptz not null default now()
);

insert into public.contest_prizes (prize_order, prize_name)
values (3, '3rd Prize'), (2, '2nd Prize'), (1, '1st Prize')
on conflict (prize_order) do nothing;

create table if not exists public.contest_entries (
  id uuid primary key default gen_random_uuid(),
  prize_id uuid not null references public.contest_prizes(id),
  claim_token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'completed', 'expired')),
  assigned_at timestamptz not null default now(),
  claim_deadline timestamptz not null default (now() + interval '24 hours'),
  completed_at timestamptz,
  expired_at timestamptz
);
create index if not exists contest_entries_prize_status_idx
  on public.contest_entries (prize_id, status, claim_deadline);
create index if not exists contest_entries_deadline_idx
  on public.contest_entries (claim_deadline) where status = 'pending';

create table if not exists public.contest_claims (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null unique references public.contest_entries(id),
  full_name text not null check (char_length(trim(full_name)) between 2 and 100),
  kd_batch_number text check (kd_batch_number is null or char_length(trim(kd_batch_number)) between 1 and 50),
  phone_number text not null check (char_length(trim(phone_number)) between 7 and 25),
  review text check (review is null or char_length(review) <= 2000),
  submitted_at timestamptz not null default now()
);

create table if not exists public.contest_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- HMACs of visitor IPs are stored instead of raw IP addresses.
create table if not exists public.contest_assignment_rate_limits (
  client_hash text primary key check (char_length(client_hash) = 64 and client_hash !~ '[^0-9a-f]'),
  window_started_at timestamptz not null default now(),
  assignment_count integer not null default 0 check (assignment_count between 0 and 2),
  last_assigned_at timestamptz
);

alter table public.contest_prizes enable row level security;
alter table public.contest_entries enable row level security;
alter table public.contest_claims enable row level security;
alter table public.contest_admins enable row level security;
alter table public.contest_assignment_rate_limits enable row level security;

-- No direct browser access, including to personal claim details or token hashes.
revoke all on public.contest_prizes, public.contest_entries, public.contest_claims, public.contest_admins, public.contest_assignment_rate_limits from anon, authenticated;
grant all on public.contest_prizes, public.contest_entries, public.contest_claims, public.contest_admins, public.contest_assignment_rate_limits to service_role;

create or replace function public.contest_assign_prize(p_token_hash text, p_client_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prize public.contest_prizes%rowtype;
  v_entry_id uuid;
  v_rate public.contest_assignment_rate_limits%rowtype;
  v_now timestamptz := pg_catalog.now();
begin
  if p_token_hash is null or length(p_token_hash) <> 64 then
    raise exception 'Invalid claim token';
  end if;
  if p_client_hash is null or char_length(p_client_hash) <> 64 or p_client_hash ~ '[^0-9a-f]' then
    raise exception 'Invalid client fingerprint';
  end if;

  -- Serialize allocation and rate checks to handle concurrent requests safely.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('gadgetopedia_qr_contest'));

  insert into public.contest_assignment_rate_limits (client_hash)
  values (p_client_hash)
  on conflict (client_hash) do nothing;

  select r.* into v_rate
    from public.contest_assignment_rate_limits r
   where r.client_hash = p_client_hash
   for update;

  if v_rate.window_started_at <= v_now - interval '1 hour' then
    update public.contest_assignment_rate_limits
       set window_started_at = v_now, assignment_count = 0, last_assigned_at = null
     where client_hash = p_client_hash;
    v_rate.window_started_at := v_now;
    v_rate.assignment_count := 0;
    v_rate.last_assigned_at := null;
  end if;

  if v_rate.assignment_count >= 2
     or (v_rate.last_assigned_at is not null and v_rate.last_assigned_at > v_now - interval '30 seconds') then
    return pg_catalog.jsonb_build_object('available', false, 'reason', 'rate_limited');
  end if;

  update public.contest_entries
     set status = 'expired', expired_at = v_now
   where status = 'pending' and claim_deadline <= v_now;

  select p.* into v_prize
    from public.contest_prizes p
   where not exists (
     select 1 from public.contest_entries e
      where e.prize_id = p.id and e.status in ('pending', 'completed')
   )
   order by p.prize_order desc
   limit 1
   for update;

  if not found then
    return pg_catalog.jsonb_build_object('available', false);
  end if;

  insert into public.contest_entries (prize_id, claim_token_hash)
  values (v_prize.id, p_token_hash)
  returning id into v_entry_id;

  update public.contest_assignment_rate_limits
     set assignment_count = assignment_count + 1, last_assigned_at = v_now
   where client_hash = p_client_hash;

  return pg_catalog.jsonb_build_object(
    'available', true,
    'entry_id', v_entry_id,
    'prize_name', v_prize.prize_name,
    'claim_deadline', v_now + interval '24 hours'
  );
end;
$$;

create or replace function public.contest_submit_claim(
  p_entry_id uuid,
  p_token_hash text,
  p_full_name text,
  p_kd_batch_number text,
  p_phone_number text,
  p_review text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_entry public.contest_entries%rowtype;
begin
  select e.* into v_entry
    from public.contest_entries e
   where e.id = p_entry_id and e.claim_token_hash = p_token_hash
   for update;

  if not found then
    return pg_catalog.jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  if v_entry.status <> 'pending' then
    return pg_catalog.jsonb_build_object('ok', false, 'reason', v_entry.status);
  end if;

  if v_entry.claim_deadline <= pg_catalog.now() then
    update public.contest_entries
       set status = 'expired', expired_at = pg_catalog.now()
     where id = v_entry.id;
    return pg_catalog.jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  insert into public.contest_claims
    (entry_id, full_name, kd_batch_number, phone_number, review)
  values
    (v_entry.id, trim(p_full_name), nullif(trim(p_kd_batch_number), ''), trim(p_phone_number), nullif(trim(p_review), ''));

  update public.contest_entries
     set status = 'completed', completed_at = pg_catalog.now()
   where id = v_entry.id;

  return pg_catalog.jsonb_build_object('ok', true);
exception when unique_violation then
  return pg_catalog.jsonb_build_object('ok', false, 'reason', 'already_submitted');
end;
$$;

revoke all on function public.contest_assign_prize(text, text) from public, anon, authenticated;
revoke all on function public.contest_submit_claim(uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.contest_assign_prize(text, text) to service_role;
grant execute on function public.contest_submit_claim(uuid, text, text, text, text, text) to service_role;
