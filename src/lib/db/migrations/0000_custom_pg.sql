-- Custom PostgreSQL objects that Drizzle Kit cannot generate.
-- This migration runs AFTER the Drizzle-generated schema migration.
-- ────────────────────────────────────────────────────────────────

-- Extensions
create extension if not exists "btree_gist";
create extension if not exists "uuid-ossp";

-- ─── Functions ──────────────────────────────────────────────────

-- Auto-update updated_at on row modification
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Build a tsrange from date + time for overlap checks
create or replace function public.reservation_tsrange(
  p_date      date,
  p_start     time,
  p_end       time
) returns tsrange as $$
  select tsrange(
    (p_date + p_start)::timestamp,
    (p_date + p_end)::timestamp,
    '[)'
  );
$$ language sql immutable strict;

-- Sync cession status when a reservation is inserted/updated
-- CRITICAL: CLAUDE.md mandates this trigger — do NOT replicate in app code
create or replace function public.sync_cession_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'confirmed' then
    update cessions
    set    status = 'reserved'
    where  spot_id = new.spot_id
      and  date    = new.date
      and  status  = 'available';
  elsif new.status = 'cancelled' then
    update cessions
    set    status = 'available'
    where  spot_id = new.spot_id
      and  date    = new.date
      and  status  = 'reserved';
  end if;
  return new;
end;
$$;

-- ─── Triggers ───────────────────────────────────────────────────

-- updated_at triggers on all tables that have the column
create trigger handle_updated_at before update on profiles
  for each row execute function handle_updated_at();

create trigger handle_updated_at before update on spots
  for each row execute function handle_updated_at();

create trigger handle_updated_at before update on reservations
  for each row execute function handle_updated_at();

create trigger handle_updated_at before update on cessions
  for each row execute function handle_updated_at();

create trigger handle_updated_at before update on visitor_reservations
  for each row execute function handle_updated_at();

create trigger handle_updated_at before update on cession_rules
  for each row execute function handle_updated_at();

create trigger handle_updated_at before update on system_config
  for each row execute function handle_updated_at();

create trigger handle_updated_at before update on user_preferences
  for each row execute function handle_updated_at();

create trigger handle_updated_at before update on entities
  for each row execute function handle_updated_at();

create trigger handle_updated_at before update on documents
  for each row execute function handle_updated_at();

create trigger handle_updated_at before update on leave_requests
  for each row execute function handle_updated_at();

-- Cession status sync trigger
create trigger trg_sync_cession_status
  after insert or update of status
  on public.reservations
  for each row execute function public.sync_cession_status();

-- ─── Exclusion Constraint (time-slot overlap prevention) ────────

alter table public.reservations
  add constraint reservations_no_overlap
  exclude using gist (
    spot_id   with =,
    reservation_tsrange(date, start_time, end_time) with &&
  )
  where (status = 'confirmed' and start_time is not null);
