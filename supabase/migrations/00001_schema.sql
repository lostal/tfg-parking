-- ============================================================
-- GRUPOSIETE ERP — Schema Único Completo
-- ============================================================
-- Módulos: Parking + Oficinas (base extensible para módulos futuros)
--
-- Cambios vs versión anterior:
--   · user_role: eliminado 'management'; solo 'employee' | 'admin'
--   · spot_type: 'management' renombrado a 'assigned'
--     (cualquier usuario puede tener plaza fija, independiente del rol)
--   · Función is_management() eliminada
--   · management_has_spot() reemplazada por user_has_assigned_spot(resource)
--   · Añadido enum resource_type ('parking' | 'office')
--   · spots.resource_type: distingue parking de oficina
--   · reservations.start_time / end_time: franjas horarias para oficinas
--   · Constraint de no-solapamiento para franjas horarias
--   · Toda la system_config incluida en una sola migración
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- ─── Enums ───────────────────────────────────────────────────

-- Roles de usuario: employee (cualquier empleado) | admin (administrador del sistema)
-- La capacidad de ceder una plaza viene de tener una asignada, NO del rol.
create type public.user_role as enum ('employee', 'admin');

-- Tipos de plaza:
--   standard  → plaza normal. Si assigned_to IS NULL, libre para reservar.
--               Si assigned_to IS NOT NULL, tiene propietario fijo y solo
--               entra en el pool cuando su dueño la cede.
--   visitor   → exclusiva para visitas externas (módulo visitor_reservations).
--               No puede ser reservada por empleados.
-- Fuera de servicio: usar is_active = false en cualquier tipo.
create type public.spot_type as enum ('standard', 'visitor');

-- Módulos de recursos reservables
create type public.resource_type as enum ('parking', 'office');

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

comment on table public.profiles is
  'Perfiles de usuario. role determina permisos de administración.
   La capacidad de ceder plazas viene de tener una asignada (spots.assigned_to), no del rol.';

-- ─── Spots ───────────────────────────────────────────────────

create table public.spots (
  id            uuid primary key default uuid_generate_v4(),
  label         text not null unique,
  type          public.spot_type not null default 'standard',
  resource_type public.resource_type not null default 'parking',
  assigned_to   uuid references public.profiles(id) on delete set null,
  is_active     boolean not null default true,
  position_x    real,
  position_y    real,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.spots is
  'Recursos reservables: plazas de aparcamiento y puestos de oficina.
   resource_type distingue el módulo. assigned_to indica propietario fijo;
   type indica si es estándar (empleados) o de visitas (visitor_reservations).
   is_active = false deshabilita la plaza independientemente del tipo.';

create index idx_spots_type on public.spots(type);
create index idx_spots_resource_type on public.spots(resource_type);
create index idx_spots_assigned_to on public.spots(assigned_to);

-- ─── Reservations ────────────────────────────────────────────

create table public.reservations (
  id          uuid primary key default uuid_generate_v4(),
  spot_id     uuid not null references public.spots(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  date        date not null,
  status      public.reservation_status not null default 'confirmed',
  notes       text,
  -- Franjas horarias (NULL = día completo, solo para parking)
  start_time  time without time zone,
  end_time    time without time zone,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Si se define start_time, end_time es obligatorio y debe ser posterior
  constraint reservations_time_range_valid check (
    (start_time is null and end_time is null)
    or (start_time is not null and end_time is not null and end_time > start_time)
  )
);

comment on table public.reservations is
  'Reservas de recursos (parking y oficina). Para reservas de día completo
   (parking), start_time y end_time son NULL. Para reservas por franja
   (oficina), ambas columnas son obligatorias.';

create unique index idx_reservations_spot_date
  on public.reservations(spot_id, date)
  where (status = 'confirmed' and start_time is null);

create unique index idx_reservations_user_date
  on public.reservations(user_id, date)
  where (status = 'confirmed' and start_time is null);

create index idx_reservations_date on public.reservations(date);

-- ─── Constraint de no-solapamiento para franjas horarias (oficinas) ─────

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

alter table public.reservations
  add constraint reservations_no_overlap
  exclude using gist (
    spot_id   with =,
    reservation_tsrange(date, start_time, end_time) with &&
  )
  where (status = 'confirmed' and start_time is not null);

-- ─── Cessions ────────────────────────────────────────────────

create table public.cessions (
  id          uuid primary key default uuid_generate_v4(),
  spot_id     uuid not null references public.spots(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  date        date not null,
  status      public.cession_status not null default 'available',
  created_at  timestamptz not null default now()
);

comment on table public.cessions is
  'Cesiones de plazas asignadas. Cuando un usuario cede su plaza,
   esta entra en el pool disponible para ese dia (parking u oficina).';

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

comment on table public.visitor_reservations is 'Reservations for external visitors.';

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
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  resource_type public.resource_type not null default 'parking',
  rule_type     public.cession_rule_type not null,
  day_of_week   smallint check (day_of_week >= 0 and day_of_week <= 6),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.cession_rules is
  'Reglas automáticas de cesión por usuario y módulo.
   resource_type distingue si la regla aplica a parking u office.
   day_of_week: 0=Sunday..6=Saturday.';

create index idx_cession_rules_user_resource on public.cession_rules(user_id, resource_type);

-- ─── System Config ───────────────────────────────────────────

create table public.system_config (
  key         text primary key,
  value       jsonb not null default '{}',
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.profiles(id) on delete set null
);

comment on table public.system_config is
  'Configuracion global del sistema. Claves con dot-notation:
   globales (e.g. notifications_enabled), por modulo (e.g. parking.max_advance_days).';

-- ─── Configuracion global ─────────────────────────────────────
insert into public.system_config (key, value) values
  ('notifications_enabled',         'true'),
  ('email_notifications_enabled',   'true'),
  ('teams_notifications_enabled',   'true');

-- ─── Configuracion de Parking ────────────────────────────────
insert into public.system_config (key, value) values
  ('parking.booking_enabled',             'true'),
  ('parking.visitor_booking_enabled',     'true'),
  ('parking.allowed_days',                '[1,2,3,4,5]'),
  ('parking.max_advance_days',            '14'),
  ('parking.max_consecutive_days',        '5'),
  ('parking.max_daily_reservations',      '1'),
  ('parking.max_weekly_reservations',     '5'),
  ('parking.max_monthly_reservations',    '20'),
  ('parking.time_slots_enabled',          'false'),
  ('parking.slot_duration_minutes',       'null'),
  ('parking.day_start_hour',              'null'),
  ('parking.day_end_hour',                'null'),
  ('parking.cession_enabled',             'true'),
  ('parking.cession_min_advance_hours',   '24'),
  ('parking.cession_max_per_week',        '5'),
  ('parking.auto_cession_enabled',        'false');

-- ─── Configuracion de Oficinas ───────────────────────────────
insert into public.system_config (key, value) values
  ('office.booking_enabled',              'true'),
  ('office.visitor_booking_enabled',      'false'),
  ('office.allowed_days',                 '[1,2,3,4,5]'),
  ('office.max_advance_days',             '7'),
  ('office.max_consecutive_days',         '3'),
  ('office.max_daily_reservations',       '2'),
  ('office.max_weekly_reservations',      '10'),
  ('office.max_monthly_reservations',     '40'),
  ('office.time_slots_enabled',           'true'),
  ('office.slot_duration_minutes',        '60'),
  ('office.day_start_hour',               '8'),
  ('office.day_end_hour',                 '20'),
  ('office.cession_enabled',              'true'),
  ('office.cession_min_advance_hours',    '24'),
  ('office.cession_max_per_week',         '5'),
  ('office.auto_cession_enabled',         'false');

-- ─── User Preferences ────────────────────────────────────────

create table public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  notification_channel            text not null default 'teams'
    check (notification_channel in ('teams', 'email', 'both')),
  notify_reservation_confirmed    boolean not null default true,
  notify_reservation_reminder     boolean not null default true,
  notify_cession_reserved         boolean not null default true,
  notify_alert_triggered          boolean not null default true,
  notify_visitor_confirmed        boolean not null default false,
  notify_daily_digest             boolean not null default false,
  daily_digest_time               time default '09:00',
  outlook_create_events           boolean not null default true,
  outlook_calendar_name           text default 'Parking',
  outlook_sync_enabled            boolean not null default true,
  outlook_sync_interval           integer default 15 check (outlook_sync_interval >= 5),
  auto_cede_on_ooo                boolean not null default true,
  auto_cede_notify                boolean not null default true,
  auto_cede_days                  integer[] default '{}',
  default_view                    text not null default 'map'
    check (default_view in ('map', 'list', 'calendar')),
  favorite_spot_ids               uuid[] default '{}',
  usual_arrival_time              time default '09:00',
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
  access_token        text not null,
  refresh_token       text not null,
  token_expires_at    timestamptz not null,
  scopes              text[] not null default '{}',
  teams_tenant_id         text,
  teams_user_id           text,
  teams_conversation_id   text,
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

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.get_user_role()
returns public.user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Comprueba si el usuario actual tiene una plaza asignada del módulo indicado.
-- La asignación se infiere de assigned_to IS NOT NULL, no del tipo de plaza.
create or replace function public.user_has_assigned_spot(p_resource_type text)
returns boolean as $$
  select exists (
    select 1
    from public.spots
    where assigned_to = auth.uid()
      and resource_type = p_resource_type::public.resource_type
      and is_active = true
  );
$$ language sql security definer stable;

-- Crea perfil de usuario al registrarse.
-- El rol siempre es 'employee' desde registro publico.
-- Solo el seed puede crear admins directamente via user_type=admin.
create or replace function public.handle_new_user()
returns trigger as $$
begin
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
    case
      when coalesce(new.raw_user_meta_data->>'user_type', '') = 'admin'
        then 'admin'::public.user_role
      else 'employee'::public.user_role
    end
  );
  return new;
end;
$$ language plpgsql security definer;

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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger on_auth_user_created_preferences
  after insert on public.profiles
  for each row execute function public.handle_new_user_preferences();

create trigger trg_sync_cession_status
  after insert or update of status
  on public.reservations
  for each row execute function public.sync_cession_status();

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
-- Propietario de la plaza puede cancelar reservas en ella
-- (necesario al cancelar una cesion que ya estaba reservada)
create policy "reservations_cancel_by_spot_owner"
  on public.reservations for update to authenticated
  using (
    exists (
      select 1 from public.spots
      where spots.id = reservations.spot_id
        and spots.assigned_to = auth.uid()
    )
  )
  with check (
    status = 'cancelled'
    and exists (
      select 1 from public.spots
      where spots.id = reservations.spot_id
        and spots.assigned_to = auth.uid()
    )
  );

-- ── Cessions ─────────────────────────────────────────────────
create policy "cessions_select_authenticated"
  on public.cessions for select to authenticated using (true);
-- Cualquier usuario con plaza asignada puede ceder
create policy "cessions_insert_own"
  on public.cessions for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      public.user_has_assigned_spot('parking')
      or public.user_has_assigned_spot('office')
    )
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
  with check (
    user_id = auth.uid()
    and (
      public.user_has_assigned_spot('parking')
      or public.user_has_assigned_spot('office')
    )
  );
create policy "cession_rules_update_own"
  on public.cession_rules for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "cession_rules_delete_own"
  on public.cession_rules for delete to authenticated
  using (user_id = auth.uid());
create policy "cession_rules_select_admin"
  on public.cession_rules for select to authenticated using (public.is_admin());

-- ── System Config ────────────────────────────────────────────
-- Legible por anon (para unstable_cache sin sesion de usuario)
create policy "system_config_select_anon"
  on public.system_config for select to anon using (true);
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
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
grant execute on all functions in schema public to authenticated, anon;

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

-- ═══════════════════════════════════════════════════════════════
-- SPOTS INICIALES
-- ═══════════════════════════════════════════════════════════════

-- ─── Parking: plazas estándar (libre o con propietario fijo) ────
-- assigned_to se establece desde seed.sql para las que tienen dueño.
insert into public.spots (label, type, resource_type, is_active) values
  ('13', 'standard', 'parking', true),
  ('14', 'standard', 'parking', true),
  ('15', 'standard', 'parking', true),
  ('16', 'standard', 'parking', true),
  ('17', 'standard', 'parking', true),
  ('18', 'standard', 'parking', true),
  ('19', 'standard', 'parking', true),
  ('49', 'standard', 'parking', true);

-- ─── Parking: plaza de visitas ───────────────────────────────
insert into public.spots (label, type, resource_type, is_active) values
  ('50', 'visitor', 'parking', true);

-- ─── Oficinas ────────────────────────────────────────────────
-- OF-06 y OF-07 son puestos de director (assigned_to se asigna via admin).
-- OF-10 está deshabilitada (is_active = false).
insert into public.spots (label, type, resource_type, is_active) values
  ('OF-01', 'standard', 'office', true),
  ('OF-02', 'standard', 'office', true),
  ('OF-03', 'standard', 'office', true),
  ('OF-04', 'standard', 'office', true),
  ('OF-05', 'standard', 'office', true),
  ('OF-06', 'standard', 'office', true),
  ('OF-07', 'standard', 'office', true),
  ('OF-08', 'standard', 'office', true),
  ('OF-09', 'standard', 'office', true),
  ('OF-10', 'standard', 'office', false);
