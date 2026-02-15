# GRUPOSIETE Parking

Sistema de gestión de reservas de plazas de aparcamiento corporativo para [GRUPOSIETE](https://gruposiete.com). Trabajo de Fin de Grado — Grado en Ingeniería Informática.

## Descripción

Aplicación web que permite **ceder**, **reservar**, **asignar** y **visualizar** plazas de parking en tiempo real, integrada con el ecosistema Microsoft 365 de la empresa.

**Problema**: Las plazas asignadas a directivos quedan vacías cuando viajan. No existe mecanismo para gestionarlas ni para reservar cuando llegan visitantes externos.

**Solución**: Un sistema con tres roles (Empleado, Dirección, Administrador) que gestiona cesiones, reservas, visitantes y alertas, con notificaciones por email y futuras integraciones con Outlook/Teams.

## Stack técnico

| Capa          | Tecnología                                  |
| ------------- | ------------------------------------------- |
| Framework     | Next.js 16 (App Router) + TypeScript        |
| UI            | Tailwind CSS v4 + shadcn/ui + tweakcn theme |
| Base de datos | Supabase (PostgreSQL + RLS + Realtime)      |
| Autenticación | Supabase Auth + Microsoft Entra ID          |
| Validación    | Zod v4                                      |
| Testing       | Vitest + Playwright                         |
| Emails        | Resend + React Email                        |
| CI            | GitHub Actions                              |
| Deploy        | Vercel                                      |

## Requisitos previos

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 10
- Cuenta en [Supabase](https://supabase.com/)
- (Opcional) [Supabase CLI](https://supabase.com/docs/guides/cli) para generar tipos

## Puesta en marcha

### 1. Clonar e instalar

```bash
git clone https://github.com/tu-usuario/tfg-parking.git
cd tfg-parking
pnpm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales:

| Variable                        | Descripción                                      |
| ------------------------------- | ------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL de tu proyecto Supabase                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (pública)                          |
| `MICROSOFT_CLIENT_ID`           | Client ID de Azure AD (opcional hasta P0)        |
| `MICROSOFT_CLIENT_SECRET`       | Client Secret de Azure AD (opcional hasta P0)    |
| `MICROSOFT_TENANT_ID`           | Tenant ID de Azure AD (opcional hasta P0)        |
| `RESEND_API_KEY`                | API key de Resend (opcional hasta P1)            |
| `NEXT_PUBLIC_APP_URL`           | URL de la app (`http://localhost:3000` en local) |

### 3. Configurar base de datos

Ejecutar en el **SQL Editor** de Supabase, en este orden:

1. `supabase/migrations/00001_initial_schema.sql` — Tablas, enums, triggers
2. `supabase/migrations/00002_rls_policies.sql` — RLS policies, funciones helper, Realtime
3. `supabase/seed.sql` — Datos iniciales (27 plazas de parking)

### 4. Arrancar

```bash
pnpm dev
```

La app estará en [http://localhost:3000](http://localhost:3000).

## Scripts disponibles

| Script               | Descripción                               |
| -------------------- | ----------------------------------------- |
| `pnpm dev`           | Servidor de desarrollo (Turbopack)        |
| `pnpm build`         | Build de producción                       |
| `pnpm start`         | Servidor de producción                    |
| `pnpm lint`          | ESLint (0 warnings permitidos)            |
| `pnpm lint:fix`      | ESLint con auto-fix                       |
| `pnpm format`        | Formatear con Prettier                    |
| `pnpm format:check`  | Verificar formato                         |
| `pnpm typecheck`     | Verificar tipos TypeScript                |
| `pnpm test`          | Tests unitarios (Vitest)                  |
| `pnpm test:watch`    | Tests en modo watch                       |
| `pnpm test:coverage` | Tests con cobertura                       |
| `pnpm test:e2e`      | Tests E2E (Playwright)                    |
| `pnpm check`         | Todo junto: types + lint + format + tests |
| `pnpm db:types`      | Generar tipos TypeScript desde Supabase   |

## Estructura del proyecto

```
src/
├── app/                     # Next.js App Router
│   ├── (auth)/              # Login + callback OAuth
│   ├── (dashboard)/         # Rutas protegidas
│   │   ├── dashboard/       # Página principal
│   │   ├── parking/         # Mapa + reservas
│   │   ├── calendar/        # Vista calendario
│   │   ├── visitors/        # Gestión visitantes
│   │   ├── admin/           # Panel administración
│   │   └── settings/        # Configuración usuario
│   └── api/webhooks/        # Webhooks (Teams bot)
├── components/
│   ├── ui/                  # shadcn/ui
│   ├── providers/           # ThemeProvider
│   ├── layout/              # Sidebar, Header, ThemeToggle
│   ├── parking/             # Mapa SVG, plaza, leyenda
│   └── booking/             # Formularios reserva/cesión
├── lib/
│   ├── supabase/            # Cliente, tipos, middleware
│   ├── microsoft/           # Graph API
│   ├── email/               # Templates + envío
│   └── wallet/              # Pases Apple/Google
├── hooks/                   # Custom hooks
└── types/                   # Tipos globales
supabase/
├── migrations/              # SQL migrations
└── seed.sql                 # Datos iniciales
```

## Base de datos

### Tablas

| Tabla                  | Descripción                                                 |
| ---------------------- | ----------------------------------------------------------- |
| `profiles`             | Usuarios (auto-creados al signup via trigger)               |
| `spots`                | Plazas de parking (standard, management, visitor, disabled) |
| `reservations`         | Reservas de empleados (1 por plaza/día, 1 por usuario/día)  |
| `cessions`             | Cesiones de plazas de dirección                             |
| `visitor_reservations` | Reservas para visitantes externos                           |
| `alerts`               | Suscripciones "avísame si hay hueco"                        |
| `cession_rules`        | Reglas automáticas de cesión (P4)                           |
| `system_config`        | Configuración global del sistema                            |

### Roles y RLS

La seguridad opera a nivel de base de datos con Row Level Security:

- **employee**: Lee plazas y configuración. CRUD sobre sus propias reservas y alertas.
- **management**: Todo de employee + CRUD de cesiones y reglas de cesión propias.
- **admin**: Acceso total (lectura y escritura en todas las tablas).

## Prioridades de implementación

```
P0 — Auth + CRUD plazas + cesión + reserva + panel admin
P1 — Notificaciones email + alertas + PWA
P2 — Mapa 2D interactivo + reserva para visitantes con correo
P3 — Integración Outlook Calendar
P4 — Cesión automática por reglas
P5 — Bot de Teams
P6 — Pase de Wallet para visitantes
P7 — Dashboard analíticas
```

P0-P1 = MVP. P2-P7 = expansión.

## Licencia

Proyecto académico — Todos los derechos reservados.
