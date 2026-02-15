-- ============================================================
-- GRUPOSIETE Parking — Row Level Security Policies
-- ============================================================
-- Run AFTER 00001_initial_schema.sql
-- ============================================================

-- ─── Enable RLS on all tables ────────────────────────────────

alter table public.profiles enable row level security;
alter table public.spots enable row level security;
alter table public.reservations enable row level security;
alter table public.cessions enable row level security;
alter table public.visitor_reservations enable row level security;
alter table public.alerts enable row level security;
alter table public.cession_rules enable row level security;
alter table public.system_config enable row level security;

-- ─── Helper: Get current user role ──────────────────────────

create or replace function public.get_user_role()
returns public.user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- ─── Helper: Check if current user is admin ─────────────────

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ─── Helper: Check if current user is management ────────────

create or replace function public.is_management()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('management', 'admin')
  );
$$ language sql security definer stable;

-- ═══════════════════════════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════════════════════════

-- All authenticated users can view all profiles (for names, avatars)
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can update their own profile (name, avatar)
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admins can update any profile (role changes)
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ═══════════════════════════════════════════════════════════════
-- SPOTS
-- ═══════════════════════════════════════════════════════════════

-- All authenticated users can view spots
create policy "spots_select_authenticated"
  on public.spots for select
  to authenticated
  using (true);

-- Only admins can create spots
create policy "spots_insert_admin"
  on public.spots for insert
  to authenticated
  with check (public.is_admin());

-- Only admins can update spots
create policy "spots_update_admin"
  on public.spots for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Only admins can delete spots
create policy "spots_delete_admin"
  on public.spots for delete
  to authenticated
  using (public.is_admin());

-- ═══════════════════════════════════════════════════════════════
-- RESERVATIONS
-- ═══════════════════════════════════════════════════════════════

-- All authenticated users can view reservations (availability)
create policy "reservations_select_authenticated"
  on public.reservations for select
  to authenticated
  using (true);

-- Users can create their own reservations
create policy "reservations_insert_own"
  on public.reservations for insert
  to authenticated
  with check (user_id = auth.uid());

-- Users can update (cancel) their own reservations
create policy "reservations_update_own"
  on public.reservations for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Admins can manage all reservations
create policy "reservations_all_admin"
  on public.reservations for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ═══════════════════════════════════════════════════════════════
-- CESSIONS
-- ═══════════════════════════════════════════════════════════════

-- All authenticated users can view cessions (availability)
create policy "cessions_select_authenticated"
  on public.cessions for select
  to authenticated
  using (true);

-- Management users can create cessions for their own spots
create policy "cessions_insert_own"
  on public.cessions for insert
  to authenticated
  with check (user_id = auth.uid() and public.is_management());

-- Management users can update (cancel) their own cessions
create policy "cessions_update_own"
  on public.cessions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Admins can manage all cessions
create policy "cessions_all_admin"
  on public.cessions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ═══════════════════════════════════════════════════════════════
-- VISITOR RESERVATIONS
-- ═══════════════════════════════════════════════════════════════

-- All authenticated users can view visitor reservations
create policy "visitor_reservations_select_authenticated"
  on public.visitor_reservations for select
  to authenticated
  using (true);

-- Users can create visitor reservations
create policy "visitor_reservations_insert_own"
  on public.visitor_reservations for insert
  to authenticated
  with check (reserved_by = auth.uid());

-- Users can update (cancel) their own visitor reservations
create policy "visitor_reservations_update_own"
  on public.visitor_reservations for update
  to authenticated
  using (reserved_by = auth.uid())
  with check (reserved_by = auth.uid());

-- Admins can manage all visitor reservations
create policy "visitor_reservations_all_admin"
  on public.visitor_reservations for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ═══════════════════════════════════════════════════════════════
-- ALERTS
-- ═══════════════════════════════════════════════════════════════

-- Users can only see their own alerts
create policy "alerts_select_own"
  on public.alerts for select
  to authenticated
  using (user_id = auth.uid());

-- Users can create their own alerts
create policy "alerts_insert_own"
  on public.alerts for insert
  to authenticated
  with check (user_id = auth.uid());

-- Users can update their own alerts
create policy "alerts_update_own"
  on public.alerts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Users can delete their own alerts
create policy "alerts_delete_own"
  on public.alerts for delete
  to authenticated
  using (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- CESSION RULES
-- ═══════════════════════════════════════════════════════════════

-- Management users can see their own rules
create policy "cession_rules_select_own"
  on public.cession_rules for select
  to authenticated
  using (user_id = auth.uid());

-- Management users can create rules
create policy "cession_rules_insert_own"
  on public.cession_rules for insert
  to authenticated
  with check (user_id = auth.uid() and public.is_management());

-- Management users can update their own rules
create policy "cession_rules_update_own"
  on public.cession_rules for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Management users can delete their own rules
create policy "cession_rules_delete_own"
  on public.cession_rules for delete
  to authenticated
  using (user_id = auth.uid());

-- Admins can view all cession rules
create policy "cession_rules_select_admin"
  on public.cession_rules for select
  to authenticated
  using (public.is_admin());

-- ═══════════════════════════════════════════════════════════════
-- SYSTEM CONFIG
-- ═══════════════════════════════════════════════════════════════

-- All authenticated users can read config
create policy "system_config_select_authenticated"
  on public.system_config for select
  to authenticated
  using (true);

-- Only admins can modify config
create policy "system_config_insert_admin"
  on public.system_config for insert
  to authenticated
  with check (public.is_admin());

create policy "system_config_update_admin"
  on public.system_config for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "system_config_delete_admin"
  on public.system_config for delete
  to authenticated
  using (public.is_admin());

-- ═══════════════════════════════════════════════════════════════
-- Realtime — Enable for tables that need live updates (P2)
-- ═══════════════════════════════════════════════════════════════

alter publication supabase_realtime add table public.reservations;
alter publication supabase_realtime add table public.cessions;
alter publication supabase_realtime add table public.visitor_reservations;
alter publication supabase_realtime add table public.spots;
