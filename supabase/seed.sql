-- ============================================================
-- GRUPOSIETE Parking — Seed Data (Datos Reales)
-- ============================================================
-- Run AFTER the migrations (00001 → 00004).
-- Supabase Dashboard → SQL Editor → paste & run.
--
-- Plazas reales del aparcamiento (según correo recibido):
--
--   Subterráneo  → 15 (Juan Carlos), 16 (Pedro Luis), 17 (Álvaro),
--                   18 (Cristina), 19 (José)
--   Exterior     → 13 (Yolanda), 14 (Pablo), 49 (Raúl)
--   Visitas      → 50
--
-- Tras ejecutar la seed:
--   1. Regístrate o inicia sesión con tu cuenta
--   2. Asciéndete a admin:
--        UPDATE public.profiles SET role = 'admin'
--        WHERE email = 'tu@gruposiete.com';
--   3. Desde la sección "Usuarios" del panel admin,
--      asigna cada plaza de dirección al usuario correspondiente
--      una vez que se hayan registrado.
-- ============================================================

-- ─── Limpiar datos previos (idempotente) ─────────────────────
-- Elimina reservas/cesiones y plazas anteriores para poder
-- re-ejecutar la seed sin conflictos.
-- ¡CUIDADO: esto borra TODOS los datos de reservas!

truncate table public.cession_rules cascade;
truncate table public.cessions cascade;
truncate table public.reservations cascade;
truncate table public.visitor_reservations cascade;
truncate table public.alerts cascade;
truncate table public.spots cascade;

-- ─── Plazas subterráneas (dirección) ────────────────────────
-- Plazas fijas asignadas a usuarios de dirección.
-- assigned_to se asignará desde el panel admin una vez
-- que cada usuario de dirección se haya registrado.

insert into public.spots (label, type, is_active) values
  ('15', 'management', true),  -- Juan Carlos
  ('16', 'management', true),  -- Pedro Luis
  ('17', 'management', true),  -- Álvaro
  ('18', 'management', true),  -- Cristina
  ('19', 'management', true);  -- José

-- ─── Plazas exteriores (dirección) ──────────────────────────

insert into public.spots (label, type, is_active) values
  ('13', 'management', true),  -- Yolanda
  ('14', 'management', true),  -- Pablo
  ('49', 'management', true);  -- Raúl

-- ─── Plaza de visitas ────────────────────────────────────────

insert into public.spots (label, type, is_active) values
  ('50', 'visitor', true);     -- Visitas

-- ─── Configuración del sistema ───────────────────────────────

insert into public.system_config (key, value) values
  ('max_advance_days', '14'),
  ('booking_enabled',  'true'),
  ('visitor_booking_enabled', 'true')
on conflict (key) do nothing;

-- ─── Resumen ─────────────────────────────────────────────────
-- Tras ejecutar este seed tendrás:
--   5 plazas de dirección subterráneas  (15-19)
--   3 plazas de dirección exteriores    (13, 14, 49)
--   1 plaza de visitas                  (50)
--  ────────────────────────────────────────────────────────────
--   9 plazas en total
--
-- Nota: No existen plazas "standard" (employee) en este parking.
-- Los empleados generales (rol 'employee') pueden reservar
-- cualquier plaza de dirección que haya sido cedida para ese día.
