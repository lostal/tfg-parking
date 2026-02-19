-- ============================================================
-- GRUPOSIETE Parking — Seed Unificado
-- ============================================================
-- Crea usuarios de prueba + plazas reales del aparcamiento.
--
-- Orden de ejecución para reimportación limpia:
--   1. reset.sql          (borra schema y usuarios)
--   2. 00001_schema.sql   (recrea schema)
--   3. seed.sql           ← este archivo
--
-- Para re-ejecutar datos sin tocar el schema:
--   ejecutar solo seed.sql (limpia y reinsertar datos)
--
-- Usuarios de prueba:
--   admin@gruposiete.com      / Admin1234!       → admin
--   general@gruposiete.com    / General1234!     → employee
--   direccion@gruposiete.com  / Direccion1234!   → management
--
-- Plazas (según distribución real del parking):
--   Subterráneas (dirección): 15, 16, 17, 18, 19
--   Exteriores   (dirección): 13, 14, 49
--   Visitas:                  50
-- ============================================================

-- ─── 1. Limpiar datos de transacción previos ─────────────────
truncate table public.cession_rules        cascade;
truncate table public.cessions             cascade;
truncate table public.reservations         cascade;
truncate table public.visitor_reservations cascade;
truncate table public.alerts               cascade;
truncate table public.spots                cascade;

-- ─── 2. Limpiar usuarios de prueba previos ───────────────────
delete from auth.users
where email in (
  'admin@gruposiete.com',
  'general@gruposiete.com',
  'direccion@gruposiete.com'
);

-- ─── 3. Insertar usuarios en auth.users ──────────────────────

insert into auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data,
  role, aud, created_at, updated_at,
  confirmation_token, recovery_token,
  email_change_token_new, email_change
)
values
  -- Admin
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'admin@gruposiete.com',
    crypt('Admin1234!', gen_salt('bf')),
    now(),
    '{"full_name": "Administrador Sistema", "user_type": "admin"}'::jsonb,
    'authenticated', 'authenticated',
    now(), now(), '', '', '', ''
  ),
  -- Empleado general
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'general@gruposiete.com',
    crypt('General1234!', gen_salt('bf')),
    now(),
    '{"full_name": "Usuario General", "user_type": "general"}'::jsonb,
    'authenticated', 'authenticated',
    now(), now(), '', '', '', ''
  ),
  -- Dirección (management)
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'direccion@gruposiete.com',
    crypt('Direccion1234!', gen_salt('bf')),
    now(),
    '{"full_name": "Usuario Dirección", "user_type": "management"}'::jsonb,
    'authenticated', 'authenticated',
    now(), now(), '', '', '', ''
  );

-- ─── 4. Insertar identidades (necesario para login por email) ─

insert into auth.identities (
  id, provider_id, user_id, identity_data,
  provider, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  u.id::text,
  u.id,
  jsonb_build_object(
    'sub',       u.id::text,
    'email',     u.email,
    'full_name', u.raw_user_meta_data->>'full_name'
  ),
  'email',
  now(), now(), now()
from auth.users u
where u.email in (
  'admin@gruposiete.com',
  'general@gruposiete.com',
  'direccion@gruposiete.com'
)
on conflict (provider, provider_id) do nothing;

-- ─── 5. Sincronizar perfiles ──────────────────────────────────
-- El trigger handle_new_user debería crearlos automáticamente,
-- pero lo garantizamos explícitamente aquí.

insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  case
    when u.raw_user_meta_data->>'user_type' = 'admin'      then 'admin'::public.user_role
    when u.raw_user_meta_data->>'user_type' = 'management' then 'management'::public.user_role
    else 'employee'::public.user_role
  end
from auth.users u
where u.email in (
  'admin@gruposiete.com',
  'general@gruposiete.com',
  'direccion@gruposiete.com'
)
on conflict (id) do update
  set role       = excluded.role,
      full_name  = excluded.full_name,
      email      = excluded.email,
      updated_at = now();

-- ─── 6. Plazas del parking ────────────────────────────────────
-- Plazas subterráneas de dirección

insert into public.spots (label, type, is_active) values
  ('15', 'management', true),  -- Juan Carlos
  ('16', 'management', true),  -- Pedro Luis
  ('17', 'management', true),  -- Álvaro
  ('18', 'management', true),  -- Cristina
  ('19', 'management', true);  -- José

-- Plazas exteriores de dirección

insert into public.spots (label, type, is_active) values
  ('13', 'management', true),  -- Yolanda
  ('14', 'management', true),  -- Pablo
  ('49', 'management', true);  -- Raúl

-- Plaza de visitas

insert into public.spots (label, type, is_active) values
  ('50', 'visitor', true);

-- ─── 7. Configuración del sistema ─────────────────────────────
-- (ya insertada en 00001_schema.sql, aquí garantizamos los valores)

insert into public.system_config (key, value) values
  ('max_advance_days',        '14'),
  ('booking_enabled',         'true'),
  ('visitor_booking_enabled', 'true')
on conflict (key) do update
  set value = excluded.value;

-- ─── Resumen ─────────────────────────────────────────────────
-- Usuarios:
--   admin@gruposiete.com      Admin1234!       admin
--   general@gruposiete.com    General1234!     employee
--   direccion@gruposiete.com  Direccion1234!   management
--
-- Plazas (9 en total):
--   management subterráneas: 15, 16, 17, 18, 19
--   management exteriores:   13, 14, 49
--   visitor:                 50
--
-- Siguiente paso:
--   El usuario de dirección de prueba necesita que el admin
--   le asigne una plaza desde Administración → Usuarios.
