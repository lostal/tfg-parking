-- ============================================================
-- GRUPOSIETE Parking — Schema Único Completo
-- ============================================================
-- Unifica: initial_schema + rls_policies + user_preferences
--          + user_type_and_roles
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────

create type public.user_role as enum ('employee', 'management', 'admin');

create type public.spot_type as enum ('standard', 'management', 'visitor', 'disabled');

create type public.reservation_status as enum ('confirmed', 'cancelled');

create type public.cession_status as enum ('available', 'reserved', 'cancelled');

create type public.cession_rule_type as enum ('out_of_office', 'day_of_week');

-- ─── Profiles ────────────────────────────────────────────────

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

create table public.spots (
  id          uuid primary key default uuid_generate_v4(),
  label       text not null unique,
  type        public.spot_type not null default 'standard',
  assigned_to uuid references public.profiles(id) on delete set null,
  is_active   boolean not null default true,
  position_x  real,
  position_y  real,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.spots is 'Physical parking spots. assigned_to is set for management fixed spots.';

create index idx_spots_type on public.spots(type);
create index idx_spots_assigned_to on public.spots(assigned_to);

-- ─── Reservations ────────────────────────────────────────────

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

create unique index idx_reservations_spot_date
  on public.reservations(spot_id, date)
  where (status = 'confirmed');

create unique index idx_reservations_user_date
  on public.reservations(user_id, date)
  where (status = 'confirmed');

create index idx_reservations_date on public.reservations(date);

-- ─── Cessions ────────────────────────────────────────────────

create table public.cessions (
  id          uuid primary key default uuid_generate_v4(),
  spot_id     uuid not null references public.spots(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  date        date not null,
  status      public.cession_status not null default 'available',
  created_at  timestamptz not null default now()
);

comment on table public.cessions is 'Management spot cessions. When ceded, spot enters the available pool for that date.';

create unique index idx_cessions_spot_date
  on public.cessions(spot_id, date)
  where (status != 'cancelled');

create index idx_cessions_date on public.cessions(date);
create index idx_cessions_user_id on public.cessions(user_id);

-- ─── Visitor Reservations ────────────────────────────────────

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

comment on table public.visitor_reservations is 'Reservations for external visitors. Triggers email notification.';

create unique index idx_visitor_reservations_spot_date
  on public.visitor_reservations(spot_id, date)
  where (status = 'confirmed');

create index idx_visitor_reservations_date on public.visitor_reservations(date);
create index idx_visitor_reservations_reserved_by on public.visitor_reservations(reserved_by);

-- ─── Alerts ──────────────────────────────────────────────────

create table public.alerts (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  date        date not null,
  notified    boolean not null default false,
  created_at  timestamptz not null default now()
);

comment on table public.alerts is 'User alert subscriptions. Notified when a spot frees up on date.';

create unique index idx_alerts_user_date
  on public.alerts(user_id, date)
  where (notified = false);

create index idx_alerts_date on public.alerts(date);

-- ─── Cession Rules ───────────────────────────────────────────

create table public.cession_rules (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  rule_type   public.cession_rule_type not null,
  day_of_week smallint check (day_of_week >= 0 and day_of_week <= 6),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.cession_rules is 'Automatic cession rules. day_of_week: 0=Sunday..6=Saturday.';

create index idx_cession_rules_user_id on public.cession_rules(user_id);

-- ─── System Config ───────────────────────────────────────────

create table public.system_config (
  key         text primary key,
  value       jsonb not null default '{}',
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles(id) on delete set null
);

comment on table public.system_config is 'System-wide configuration.';

insert into public.system_config (key, value) values
  ('max_advance_days',          '14'),
  ('booking_enabled',           'true'),
  ('visitor_booking_enabled',   'true');

-- ─── User Preferences ────────────────────────────────────────

create table public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,

  -- Notifications
  notification_channel            text not null default 'teams'
    check (notification_channel in ('teams', 'email', 'both')),
  notify_reservation_confirmed    boolean not null default true,
  notify_reservation_reminder     boolean not null default true,
  notify_cession_reserved         boolean not null default true,
  notify_alert_triggered          boolean not null default true,
  notify_visitor_confirmed        boolean not null default false,
  notify_daily_digest             boolean not null default false,
  daily_digest_time               time default '09:00',

  -- Outlook Calendar
  outlook_create_events           boolean not null default true,
  outlook_calendar_name           text default 'Parking',
  outlook_sync_enabled            boolean not null default true,
  outlook_sync_interval           integer default 15 check (outlook_sync_interval >= 5),

  -- Auto cession (management)
  auto_cede_on_ooo                boolean not null default true,
  auto_cede_notify                boolean not null default true,
  auto_cede_days                  integer[] default '{}',

  -- Parking preferences
  default_view                    text not null default 'map'
    check (default_view in ('map', 'list', 'calendar')),
  favorite_spot_ids               uuid[] default '{}',
  usual_arrival_time              time default '09:00',

  -- Appearance
  theme                           text not null default 'system'
    check (theme in ('light', 'dark', 'system')),
  locale                          text not null default 'es'
    check (locale in ('es', 'en')),

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── User Microsoft Tokens ───────────────────────────────────

create table public.user_microsoft_tokens (
  user_id             uuid primary key references public.profiles(id) on delete cascade,

  -- OAuth tokens
  access_token        text not null,
  refresh_token       text not null,
  token_expires_at    timestamptz not null,
  scopes              text[] not null default '{}',

  -- Teams
  teams_tenant_id         text,
  teams_user_id           text,
  teams_conversation_id   text,

  -- Outlook
  outlook_calendar_id     text,
  last_calendar_sync_at   timestamptz,
  last_ooo_check_at       timestamptz,
  current_ooo_status      boolean not null default false,
  current_ooo_until       timestamptz,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Get current user's role
create or replace function public.get_user_role()
returns public.user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- Is current user admin?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Is current user management or admin?
create or replace function public.is_management()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('management', 'admin')
  );
$$ language sql security definer stable;

-- Does current management user have a spot assigned?
create or replace function public.management_has_spot()
returns boolean as $$
  select exists (
    select 1
    from public.profiles p
    join public.spots s on s.assigned_to = p.id
    where p.id = auth.uid()
      and p.role = 'management'
  );
$$ language sql security definer stable;

-- Create user profile on signup (reads user_type from metadata)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_role public.user_role;
begin
  case coalesce(new.raw_user_meta_data->>'user_type', '')
    when 'admin'      then v_role := 'admin';
    when 'management' then v_role := 'management';
    else                   v_role := 'employee';
  end case;

  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      ''
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      ''
    ),
    v_role
  );
  return new;
end;
$$ language plpgsql security definer;

-- Auto-create user_preferences row when profile is created
create or replace function public.handle_new_user_preferences()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════

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

create trigger set_updated_at before update on public.user_preferences
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.user_microsoft_tokens
  for each row execute function public.handle_updated_at();

-- Auto-create profile when user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-create preferences when profile is created
create trigger on_auth_user_created_preferences
  after insert on public.profiles
  for each row execute function public.handle_new_user_preferences();

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles              enable row level security;
alter table public.spots                 enable row level security;
alter table public.reservations          enable row level security;
alter table public.cessions              enable row level security;
alter table public.visitor_reservations  enable row level security;
alter table public.alerts                enable row level security;
alter table public.cession_rules         enable row level security;
alter table public.system_config         enable row level security;
alter table public.user_preferences      enable row level security;
alter table public.user_microsoft_tokens enable row level security;

-- ── Profiles ─────────────────────────────────────────────────

create policy "profiles_select_authenticated"
  on public.profiles for select to authenticated using (true);

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles_update_admin"
  on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── Spots ────────────────────────────────────────────────────

create policy "spots_select_authenticated"
  on public.spots for select to authenticated using (true);

create policy "spots_insert_admin"
  on public.spots for insert to authenticated
  with check (public.is_admin());

create policy "spots_update_admin"
  on public.spots for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "spots_delete_admin"
  on public.spots for delete to authenticated
  using (public.is_admin());

-- ── Reservations ─────────────────────────────────────────────

create policy "reservations_select_authenticated"
  on public.reservations for select to authenticated using (true);

-- Employees and management can create reservations for themselves.
-- Admins cannot self-reserve (only manage via all_admin policy).
create policy "reservations_insert_own"
  on public.reservations for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.get_user_role() != 'admin'
  );

create policy "reservations_update_own"
  on public.reservations for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "reservations_all_admin"
  on public.reservations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── Cessions ─────────────────────────────────────────────────

create policy "cessions_select_authenticated"
  on public.cessions for select to authenticated using (true);

-- Management users can only create cessions if they have a spot assigned
create policy "cessions_insert_own"
  on public.cessions for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.management_has_spot()
  );

create policy "cessions_update_own"
  on public.cessions for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "cessions_all_admin"
  on public.cessions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── Visitor Reservations ─────────────────────────────────────

create policy "visitor_reservations_select_authenticated"
  on public.visitor_reservations for select to authenticated using (true);

create policy "visitor_reservations_insert_own"
  on public.visitor_reservations for insert to authenticated
  with check (reserved_by = auth.uid());

create policy "visitor_reservations_update_own"
  on public.visitor_reservations for update to authenticated
  using (reserved_by = auth.uid()) with check (reserved_by = auth.uid());

create policy "visitor_reservations_all_admin"
  on public.visitor_reservations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── Alerts ───────────────────────────────────────────────────

create policy "alerts_select_own"
  on public.alerts for select to authenticated using (user_id = auth.uid());

create policy "alerts_insert_own"
  on public.alerts for insert to authenticated with check (user_id = auth.uid());

create policy "alerts_update_own"
  on public.alerts for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "alerts_delete_own"
  on public.alerts for delete to authenticated using (user_id = auth.uid());

-- ── Cession Rules ────────────────────────────────────────────

create policy "cession_rules_select_own"
  on public.cession_rules for select to authenticated using (user_id = auth.uid());

create policy "cession_rules_insert_own"
  on public.cession_rules for insert to authenticated
  with check (user_id = auth.uid() and public.is_management());

create policy "cession_rules_update_own"
  on public.cession_rules for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "cession_rules_delete_own"
  on public.cession_rules for delete to authenticated
  using (user_id = auth.uid());

create policy "cession_rules_select_admin"
  on public.cession_rules for select to authenticated using (public.is_admin());

-- ── System Config ────────────────────────────────────────────

create policy "system_config_select_authenticated"
  on public.system_config for select to authenticated using (true);

create policy "system_config_insert_admin"
  on public.system_config for insert to authenticated
  with check (public.is_admin());

create policy "system_config_update_admin"
  on public.system_config for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "system_config_delete_admin"
  on public.system_config for delete to authenticated
  using (public.is_admin());

-- ── User Preferences ─────────────────────────────────────────

create policy "user_preferences_select_own"
  on public.user_preferences for select to authenticated
  using (auth.uid() = user_id);

create policy "user_preferences_update_own"
  on public.user_preferences for update to authenticated
  using (auth.uid() = user_id);

create policy "user_preferences_select_admin"
  on public.user_preferences for select to authenticated
  using (public.is_admin());

create policy "user_preferences_update_admin"
  on public.user_preferences for update to authenticated
  using (public.is_admin());

-- ── User Microsoft Tokens ────────────────────────────────────

create policy "user_microsoft_tokens_select_own"
  on public.user_microsoft_tokens for select to authenticated
  using (auth.uid() = user_id);

create policy "user_microsoft_tokens_insert_own"
  on public.user_microsoft_tokens for insert to authenticated
  with check (auth.uid() = user_id);

create policy "user_microsoft_tokens_update_own"
  on public.user_microsoft_tokens for update to authenticated
  using (auth.uid() = user_id);

create policy "user_microsoft_tokens_delete_own"
  on public.user_microsoft_tokens for delete to authenticated
  using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- GRANTS
-- ═══════════════════════════════════════════════════════════════

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on all tables in schema public
  to authenticated;

grant select
  on all tables in schema public
  to anon;

grant execute
  on all functions in schema public
  to authenticated, anon;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant select on tables to anon;

alter default privileges in schema public
  grant execute on functions to authenticated, anon;

-- ═══════════════════════════════════════════════════════════════
-- REALTIME
-- ═══════════════════════════════════════════════════════════════

alter publication supabase_realtime add table public.reservations;
alter publication supabase_realtime add table public.cessions;
alter publication supabase_realtime add table public.visitor_reservations;
alter publication supabase_realtime add table public.spots;
