-- ============================================================
-- GRUPOSIETE Parking — Reset Completo
-- ============================================================
-- Borra todo el schema público y los usuarios de prueba.
--
-- Orden de ejecución para reimportación limpia:
--   1. reset.sql          ← este archivo
--   2. 00001_schema.sql
--   3. seed.sql
-- ============================================================

-- ─── Triggers sobre auth.users ───────────────────────────────
drop trigger if exists on_auth_user_created             on auth.users;
drop trigger if exists on_auth_user_created_preferences on public.profiles;

-- ─── Funciones ───────────────────────────────────────────────
drop function if exists public.handle_new_user()             cascade;
drop function if exists public.handle_new_user_preferences() cascade;
drop function if exists public.handle_updated_at()           cascade;
drop function if exists public.get_user_role()               cascade;
drop function if exists public.is_admin()                    cascade;
drop function if exists public.is_management()               cascade;
drop function if exists public.management_has_spot()         cascade;

-- ─── Tablas (orden inverso a las foreign keys) ───────────────
drop table if exists public.user_microsoft_tokens  cascade;
drop table if exists public.user_preferences       cascade;
drop table if exists public.system_config          cascade;
drop table if exists public.cession_rules          cascade;
drop table if exists public.alerts                 cascade;
drop table if exists public.visitor_reservations   cascade;
drop table if exists public.cessions               cascade;
drop table if exists public.reservations           cascade;
drop table if exists public.spots                  cascade;
drop table if exists public.profiles               cascade;

-- ─── Tipos enumerados ────────────────────────────────────────
drop type if exists public.user_role          cascade;
drop type if exists public.spot_type          cascade;
drop type if exists public.reservation_status cascade;
drop type if exists public.cession_status     cascade;
drop type if exists public.cession_rule_type  cascade;

-- ─── Usuarios de prueba ──────────────────────────────────────
delete from auth.users
where email in (
  'admin@gruposiete.com',
  'general@gruposiete.com',
  'direccion@gruposiete.com'
);
