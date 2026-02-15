-- ============================================================
-- GRUPOSIETE Parking — Seed Data
-- ============================================================
-- Run AFTER the initial migrations (00001 + 00002).
-- Supabase Dashboard → SQL Editor → paste & run.
--
-- NOTE: Profiles are auto-created via trigger when a user
-- signs up through Supabase Auth (Microsoft OAuth).
-- To promote a user to admin after first login, run:
--
--   UPDATE public.profiles
--   SET role = 'admin'
--   WHERE email = 'your-email@gruposiete.com';
--
-- ============================================================

-- ─── Parking Spots ───────────────────────────────────────────
-- Realistic layout for a corporate office (~30 spots).
-- Positions (position_x, position_y) are percentages on the
-- SVG map (0-100 range). Will be fine-tuned in P2 (map).

-- Standard spots (employees, first-come-first-served)
insert into public.spots (label, type, position_x, position_y) values
  ('A-01', 'standard',  5,  10),
  ('A-02', 'standard',  5,  20),
  ('A-03', 'standard',  5,  30),
  ('A-04', 'standard',  5,  40),
  ('A-05', 'standard',  5,  50),
  ('A-06', 'standard',  5,  60),
  ('A-07', 'standard',  5,  70),
  ('A-08', 'standard',  5,  80),
  ('B-01', 'standard', 25,  10),
  ('B-02', 'standard', 25,  20),
  ('B-03', 'standard', 25,  30),
  ('B-04', 'standard', 25,  40),
  ('B-05', 'standard', 25,  50),
  ('B-06', 'standard', 25,  60),
  ('B-07', 'standard', 25,  70),
  ('B-08', 'standard', 25,  80);

-- Management spots (assigned to directors — assigned_to set later)
insert into public.spots (label, type, position_x, position_y) values
  ('D-01', 'management', 55, 10),
  ('D-02', 'management', 55, 20),
  ('D-03', 'management', 55, 30),
  ('D-04', 'management', 55, 40),
  ('D-05', 'management', 55, 50),
  ('D-06', 'management', 55, 60);

-- Visitor spots (near entrance)
insert into public.spots (label, type, position_x, position_y) values
  ('V-01', 'visitor', 80, 10),
  ('V-02', 'visitor', 80, 20),
  ('V-03', 'visitor', 80, 30),
  ('V-04', 'visitor', 80, 40);

-- Disabled/accessible spot
insert into public.spots (label, type, position_x, position_y) values
  ('PMR-01', 'disabled', 80, 80);

-- ─── System Config Defaults ─────────────────────────────────
-- Already inserted by the migration, but ensure they exist.
-- Uses ON CONFLICT to be idempotent.

insert into public.system_config (key, value) values
  ('max_advance_days', '14'),
  ('booking_enabled',  'true'),
  ('visitor_booking_enabled', 'true')
on conflict (key) do nothing;

-- ─── Summary ─────────────────────────────────────────────────
-- After running this seed you should have:
--   16 standard spots   (A-01..A-08, B-01..B-08)
--    6 management spots  (D-01..D-06)
--    4 visitor spots     (V-01..V-04)
--    1 disabled spot     (PMR-01)
--  ---
--   27 total spots
--
-- Next steps:
--   1. Sign in with Microsoft to create your profile
--   2. Promote yourself to admin (SQL above)
--   3. Assign management spots to directors via the admin panel
