-- ============================================================
-- GRUPOSIETE ERP — Seed Unificado
-- ============================================================
-- Crea usuarios de prueba + asigna plazas reales.
--
-- Orden de ejecucion:
--   1. reset.sql
--   2. 00001_schema.sql   (crea schema + spots iniciales)
--   3. seed.sql           <- este archivo
--
-- Usuarios de prueba:
--   admin@gruposiete.com          / Admin1234!       → admin
--   empleado-fijo@gruposiete.com  / Empleado1234!    → employee (plaza parking 15 asignada)
--   empleado@gruposiete.com       / Empleado1234!    → employee (sin plaza fija)
-- ============================================================

-- ─── 1. Limpiar datos de transaccion previos ─────────────────
truncate table public.cession_rules        cascade;
truncate table public.cessions             cascade;
truncate table public.reservations         cascade;
truncate table public.visitor_reservations cascade;
truncate table public.alerts               cascade;

-- ─── 2. Limpiar usuarios de prueba previos ───────────────────
delete from auth.users
where email in (
  'admin@gruposiete.com',
  'empleado@gruposiete.com',
  'empleado-fijo@gruposiete.com'
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
  -- Admin del sistema
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
  -- Empleado con plaza de parking fija asignada
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'empleado-fijo@gruposiete.com',
    crypt('Empleado1234!', gen_salt('bf')),
    now(),
    '{"full_name": "Empleado Con Plaza"}'::jsonb,
    'authenticated', 'authenticated',
    now(), now(), '', '', '', ''
  ),
  -- Empleado sin plaza fija (reserva en las disponibles del dia)
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'empleado@gruposiete.com',
    crypt('Empleado1234!', gen_salt('bf')),
    now(),
    '{"full_name": "Empleado General"}'::jsonb,
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
  'empleado@gruposiete.com',
  'empleado-fijo@gruposiete.com'
)
on conflict (provider, provider_id) do nothing;

-- ─── 5. Sincronizar perfiles ──────────────────────────────────
-- El trigger handle_new_user los crea automaticamente,
-- pero garantizamos los roles aqui explicitamente.

insert into public.profiles (id, email, full_name, role)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  case
    when u.raw_user_meta_data->>'user_type' = 'admin' then 'admin'::public.user_role
    else 'employee'::public.user_role
  end
from auth.users u
where u.email in (
  'admin@gruposiete.com',
  'empleado@gruposiete.com',
  'empleado-fijo@gruposiete.com'
)
on conflict (id) do update
  set role       = excluded.role,
      full_name  = excluded.full_name,
      email      = excluded.email,
      updated_at = now();

-- ─── 6. Asignar plaza de parking al empleado fijo ────────────
-- Plaza 15 asignada a 'empleado-fijo@gruposiete.com'
-- (type='standard' con assigned_to = propietario fijo)
-- El admin puede cambiar esto desde Administracion → Usuarios.

update public.spots
set assigned_to = (
  select id from public.profiles where email = 'empleado-fijo@gruposiete.com'
)
where label = '15'
  and resource_type = 'parking';

-- ─── Resumen ─────────────────────────────────────────────────
-- Usuarios:
--   admin@gruposiete.com          Admin1234!    admin
--   empleado-fijo@gruposiete.com  Empleado1234! employee (plaza 15 con dueño asignado)
--   empleado@gruposiete.com       Empleado1234! employee (sin plaza fija)
--
-- Spots (creados en 00001_schema.sql):
--   Parking standard (7 libres): 13, 14, 16, 17, 18, 19, 49  (15 tiene dueño)
--   Parking visitor:  50
--   Oficina standard: OF-01..OF-09  (OF-06, OF-07 sin dueño en seed; asignar desde admin)
--   Oficina inactiva: OF-10 (is_active = false)
