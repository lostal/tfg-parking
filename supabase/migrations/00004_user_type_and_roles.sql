-- ============================================================
-- GRUPOSIETE Parking — User Type & Role Refinement
-- ============================================================
-- Adds user_type to distinguish between 'general' employees and
-- 'management' (dirección) employees who hold a fixed spot.
--
-- Role mapping:
--   admin      → administrador del sistema
--   employee   → usuario general (acceso completo desde el inicio)
--   management → usuario de dirección (necesita plaza asignada
--                por admin antes de poder ceder su plaza)
--
-- Registration flow:
--   The user chooses "general" or "dirección" during signup.
--   This is stored in user_metadata.user_type and picked up
--   by the updated handle_new_user trigger.
--
--   general   → role = 'employee'
--   dirección → role = 'management' (but no spot assigned yet)
--
-- Admin must assign a spot to management users before they can
-- use the cession feature. Until then, their assigned spot in
-- public.spots remains NULL.
-- ============================================================

-- ─── Nothing to add to the profiles table ───────────────────
-- The existing 'role' enum ('employee', 'management', 'admin')
-- already covers the distinction. We just need to ensure the
-- trigger reads user_type from signup metadata.

-- ─── Update handle_new_user trigger ─────────────────────────
-- Reads user_type from signup metadata to set the initial role:
--   user_type = 'management' → role = 'management'
--   otherwise               → role = 'employee'  (default)

create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_role public.user_role;
begin
  -- Determine initial role from signup metadata
  if coalesce(new.raw_user_meta_data->>'user_type', '') = 'management' then
    v_role := 'management';
  else
    v_role := 'employee';
  end if;

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

-- ─── Helper: check if management user has a spot assigned ───
-- Returns true if the current user is management AND has a spot.
-- Used by RLS on cessions.

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

-- ─── Update cessions RLS ─────────────────────────────────────
-- Management users can only insert cessions if they have a spot.
-- Drop and recreate the insert policy.

drop policy if exists "cessions_insert_own" on public.cessions;

create policy "cessions_insert_own"
  on public.cessions for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.management_has_spot()
  );

-- ─── New action: admin assign spot to management user ────────
-- Admins call this via the UI — no extra DB object needed;
-- it is just a spots UPDATE (already covered by spots_update_admin).

-- ─── Admin cannot create reservations for themselves ─────────
-- Handled at the application layer (Server Actions check role).
-- The RLS policy "reservations_insert_own" allows any authenticated
-- user to insert reservations for themselves; we add a DB-level
-- guard to prevent admin self-reservations:

drop policy if exists "reservations_insert_own" on public.reservations;

create policy "reservations_insert_own"
  on public.reservations for insert
  to authenticated
  with check (
    user_id = auth.uid()
    -- admins cannot reserve for themselves (only for visitors via visitor_reservations)
    and public.get_user_role() != 'admin'
  );

-- Admins can still manage all reservations (existing policy covers this).

-- ─── Summary ─────────────────────────────────────────────────
-- Changes introduced by this migration:
--   1. handle_new_user now reads user_type metadata to set role
--   2. management_has_spot() helper function added
--   3. cessions_insert_own: management users need an assigned spot
--   4. reservations_insert_own: admins cannot self-reserve
