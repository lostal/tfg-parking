-- ============================================================
-- GRUPOSIETE Parking — Initial Schema Migration
-- ============================================================
-- Supports: P0-P7 (all priorities from CONTEXT.md)
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────

create type public.user_role as enum ('employee', 'management', 'admin');

create type public.spot_type as enum ('standard', 'management', 'visitor', 'disabled');

create type public.reservation_status as enum ('confirmed', 'cancelled');

create type public.cession_status as enum ('available', 'reserved', 'cancelled');

create type public.cession_rule_type as enum ('out_of_office', 'day_of_week');

-- ─── Profiles ────────────────────────────────────────────────
-- Extends auth.users with app-specific data.
-- Automatically created via trigger on auth.users insert.

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  avatar_url  text,
  role        public.user_role not null default 'employee',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'User profiles extending Supabase Auth. One per authenticated user.';

-- ─── Spots ───────────────────────────────────────────────────
-- Physical parking spots. Managed by admins.

create table public.spots (
  id          uuid primary key default uuid_generate_v4(),
  label       text not null unique,
  type        public.spot_type not null default 'standard',
  assigned_to uuid references public.profiles(id) on delete set null,
  is_active   boolean not null default true,
  -- SVG map positioning (P2)
  position_x  real,
  position_y  real,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.spots is 'Physical parking spots. assigned_to is set for management fixed spots.';

create index idx_spots_type on public.spots(type);
create index idx_spots_assigned_to on public.spots(assigned_to);

-- ─── Reservations ────────────────────────────────────────────
-- Employee reservations (one per person per day).

create table public.reservations (
  id          uuid primary key default uuid_generate_v4(),
  spot_id     uuid not null references public.spots(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  date        date not null,
  status      public.reservation_status not null default 'confirmed',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.reservations is 'Employee parking reservations. One active reservation per user per day.';

-- One confirmed reservation per spot per day
create unique index idx_reservations_spot_date
  on public.reservations(spot_id, date)
  where (status = 'confirmed');

-- One confirmed reservation per user per day
create unique index idx_reservations_user_date
  on public.reservations(user_id, date)
  where (status = 'confirmed');

create index idx_reservations_date on public.reservations(date);

-- ─── Cessions ────────────────────────────────────────────────
-- Management users ceding their assigned spot for specific dates.

create table public.cessions (
  id          uuid primary key default uuid_generate_v4(),
  spot_id     uuid not null references public.spots(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  date        date not null,
  status      public.cession_status not null default 'available',
  created_at  timestamptz not null default now()
);

comment on table public.cessions is 'Management spot cessions. When ceded, spot enters the available pool for that date.';

-- One cession per spot per day
create unique index idx_cessions_spot_date
  on public.cessions(spot_id, date)
  where (status != 'cancelled');

create index idx_cessions_date on public.cessions(date);
create index idx_cessions_user_id on public.cessions(user_id);

-- ─── Visitor Reservations ────────────────────────────────────
-- Reservations made by employees for external visitors.

create table public.visitor_reservations (
  id                uuid primary key default uuid_generate_v4(),
  spot_id           uuid not null references public.spots(id) on delete cascade,
  reserved_by       uuid not null references public.profiles(id) on delete cascade,
  date              date not null,
  visitor_name      text not null,
  visitor_company   text not null,
  visitor_email     text not null,
  status            public.reservation_status not null default 'confirmed',
  notification_sent boolean not null default false,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.visitor_reservations is 'Reservations for external visitors (clients, suppliers). Triggers email notification.';

-- One confirmed visitor reservation per spot per day
create unique index idx_visitor_reservations_spot_date
  on public.visitor_reservations(spot_id, date)
  where (status = 'confirmed');

create index idx_visitor_reservations_date on public.visitor_reservations(date);
create index idx_visitor_reservations_reserved_by on public.visitor_reservations(reserved_by);

-- ─── Alerts ──────────────────────────────────────────────────
-- "Notify me if a spot becomes available on date X"

create table public.alerts (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  date        date not null,
  notified    boolean not null default false,
  created_at  timestamptz not null default now()
);

comment on table public.alerts is 'User alert subscriptions. Notified when a spot frees up on the requested date.';

-- One alert per user per day
create unique index idx_alerts_user_date
  on public.alerts(user_id, date)
  where (notified = false);

create index idx_alerts_date on public.alerts(date);

-- ─── Cession Rules (P4) ─────────────────────────────────────
-- Automatic cession rules defined by management users.

create table public.cession_rules (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  rule_type   public.cession_rule_type not null,
  day_of_week smallint check (day_of_week >= 0 and day_of_week <= 6),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.cession_rules is 'Automatic cession rules. day_of_week: 0=Sunday..6=Saturday. rule_type=out_of_office uses Outlook Calendar.';

create index idx_cession_rules_user_id on public.cession_rules(user_id);

-- ─── System Config ───────────────────────────────────────────
-- Admin-configurable system settings.

create table public.system_config (
  key         text primary key,
  value       jsonb not null default '{}',
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles(id) on delete set null
);

comment on table public.system_config is 'System-wide configuration (max advance days, etc).';

-- Default config values
insert into public.system_config (key, value) values
  ('max_advance_days', '14'),
  ('booking_enabled', 'true'),
  ('visitor_booking_enabled', 'true');

-- ─── Updated_at Trigger ─────────────────────────────────────
-- Auto-updates updated_at on row modification.

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.spots
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.reservations
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.visitor_reservations
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.cession_rules
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.system_config
  for each row execute function public.handle_updated_at();

-- ─── Auto-create Profile on Signup ──────────────────────────
-- When a user signs up via Supabase Auth, automatically create a profile.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
