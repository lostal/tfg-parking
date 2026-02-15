# Contexto del proyecto

## Qué es

Aplicación web para la gestión de reservas de plazas de aparcamiento en GRUPOSIETE (sector materiales de construcción, sede en Madrid). Integrada en el ecosistema Microsoft 365 de la empresa.

## El problema

- Plazas asignadas a directivos que viajan frecuentemente → quedan vacías.
- Resto de empleados no puede usarlas.
- No existe mecanismo para gestionar plazas cuando llegan clientes o proveedores.
- Todo se hace de palabra o no se hace.

## La solución

Un sistema que permite ceder, reservar, asignar y visualizar plazas en tiempo real, integrado con las herramientas que la empresa ya usa (Outlook, Teams, correo corporativo).

---

## Roles

| Rol               | Descripción                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Empleado**      | Ve disponibilidad, reserva para sí mismo o para visitantes externos, cancela reservas, se suscribe a alertas.                       |
| **Dirección**     | Todo lo del empleado + tiene plaza fija asignada, puede cederla.                                                                    |
| **Administrador** | Gestión completa: CRUD de plazas, gestión de usuarios/roles, asignación manual, dashboard de analíticas, configuración del sistema. |

---

## Alcance funcional

### MVP (entrega obligatoria)

- **Autenticación con Microsoft Entra ID (Azure AD).** Login con cuenta corporativa. Se obtiene nombre, email y foto de perfil.
- **Gestión de plazas y estados.** Cada plaza tiene un estado por fecha: libre, ocupada (asignada fija), reservada, cedida, o bloqueada para visitante.
- **Cesión de plazas por directivos.** Selección manual de días en los que no usarán su plaza. Cancelación de cesión posible si nadie la ha reservado aún.
- **Reserva de plazas por empleados.** Vista de disponibilidad en calendario, una plaza por persona por día, límite de antelación configurable.
- **Reserva para visitantes externos.** Cualquier empleado reserva para un cliente/proveedor (nombre, empresa, email). No requiere registro del visitante.
- **Notificación al visitante.** Correo profesional automático con: confirmación, número de plaza, fecha/hora, dirección de la sede, enlace de navegación (Google Maps/Waze).
- **Sistema de alertas.** Suscripción a "avísame si hay plaza el día X". Notificación automática cuando se libera una plaza.
- **Panel de administración.** CRUD de plazas, gestión de usuarios y roles, vista de ocupación por día, asignación/liberación manual.
- **Mobile first + PWA.** Instalable, responsive, pensada para consultar desde el móvil.

### Funcionalidades de expansión (integración Microsoft 365)

- **Sincronización con Outlook Calendar (Microsoft Graph API).** Lectura del calendario del directivo: si detecta ausencia de día completo, sugiere ceder la plaza. Escritura: al reservar, se crea evento en Outlook del empleado con número de plaza. Si reserva para visitante, recordatorio con datos del visitante.
- **Cesión automática por reglas.** El directivo define reglas: "si tengo evento fuera de oficina de día completo, ceder automáticamente" o "ceder siempre los viernes". Pasa de manual a automático.
- **Bot de Microsoft Teams.** Flujo conversacional con Adaptive Cards: consultar disponibilidad, reservar para uno mismo o para visitante, ceder plaza, cancelar. Todo sin salir de Teams.
- **Notificaciones en Teams.** Confirmaciones y alertas como mensajes del bot: plaza confirmada, visitante ha llegado, plaza liberada.

### Funcionalidades de expansión (experiencia)

- **Mapa 2D interactivo del parking.** SVG del plano real, cada plaza clicable con color según estado. Actualización en tiempo real (Supabase Realtime). Clic en plaza libre → flujo de reserva.
- **Pase digital para Apple/Google Wallet.** El visitante recibe en el correo un botón "Añadir a Wallet". Tarjeta tipo boarding pass con número de plaza, fecha, hora y dirección. Formato `.pkpass` (Apple) y Google Wallet API.
- **Dashboard de analíticas.** Ocupación diaria/semanal/mensual, plazas más/menos usadas, directivos que más ceden, días pico, ratio visitantes vs empleados.

### Futuras líneas (documentadas, no implementadas)

- Detección automática con beacons Bluetooth.
- Mapa 3D del parking (Three.js / React Three Fiber).
- Flujos avanzados con Power Automate.
- Check-in de visitante por QR desde el pase de wallet.

---

## Stack técnico

| Capa              | Tecnología                                  | Justificación                                                                   |
| ----------------- | ------------------------------------------- | ------------------------------------------------------------------------------- |
| Framework         | Next.js 15 (App Router) + TypeScript        | Server Components, Server Actions, SSR. Elimina necesidad de API REST separada. |
| UI                | Tailwind CSS + shadcn/ui                    | Mobile first, componentes accesibles y personalizables, desarrollo rápido.      |
| Base de datos     | Supabase (PostgreSQL)                       | Relacional, Row Level Security para RBAC, Realtime, Edge Functions, Auth.       |
| Autenticación     | Supabase Auth + Microsoft Entra ID          | OAuth corporativo, sin contraseñas nuevas.                                      |
| Integraciones MS  | Microsoft Graph API                         | Calendario Outlook, datos de perfil, eventos.                                   |
| Bot Teams         | Bot Framework SDK + Adaptive Cards          | Conversacional dentro de Teams.                                                 |
| Emails            | Resend + React Email                        | Transaccionales con plantillas profesionales.                                   |
| Wallet            | Apple PassKit (.pkpass) + Google Wallet API | Pase digital para visitantes.                                                   |
| Mapa parking      | SVG + React + Supabase Realtime             | Interactivo, tiempo real, sin dependencias pesadas.                             |
| Gráficas          | Recharts                                    | Dashboard de analíticas.                                                        |
| Testing           | Vitest + Playwright                         | Unitarios + E2E.                                                                |
| Despliegue        | Vercel                                      | Deploy nativo Next.js, preview por PR.                                          |
| Control versiones | Git + GitHub + GitHub Actions               | CI básico: lint, types, tests.                                                  |

---

## Prioridades de implementación

```
P0 — Auth + CRUD plazas + cesión + reserva + panel admin
P1 — Notificaciones email + alertas + PWA
P2 — Mapa 2D interactivo + reserva para visitantes con correo
P3 — Integración Outlook Calendar (lectura + escritura)
P4 — Cesión automática por reglas
P5 — Bot de Teams
P6 — Pase de Wallet para visitantes
P7 — Dashboard analíticas
```

P0-P1 = MVP. P2-P7 = expansión (implementar en orden según tiempo disponible).

---

## Decisiones técnicas clave

**¿Por qué a medida y no SaaS?** Existen soluciones como Parkalot ($49-199/mes), Ronspot, Flexopus, Skedda. El desarrollo a medida se justifica por: integración profunda con Microsoft 365 (no solo SSO, sino calendario, Teams, flujos), lógica de negocio específica (modelo cesión directivo → pool), comunicaciones profesionales personalizadas a visitantes externos (wallet, correo corporativo), y coste cero de licencia recurrente.

**¿Por qué Supabase y no Firebase?** PostgreSQL relacional (el dominio de reservas/plazas/usuarios se modela naturalmente con tablas y foreign keys), Row Level Security como implementación real de RBAC a nivel de base de datos, Realtime nativo para el mapa, y es open source.

**¿Por qué Next.js con Server Actions y no API REST?** Simplifica la arquitectura al no necesitar capa de API separada. Las mutaciones (reservar, ceder, asignar) se ejecutan como funciones de servidor con validación Zod. Menos código, menos superficie de error, más trazabilidad.

**¿Por qué SVG para el mapa y no Canvas/WebGL?** Cada plaza es un elemento DOM accesible, clicable y estilizable con CSS. Suficiente para un parking de tamaño corporativo (~20-50 plazas). Canvas/WebGL sería overkill y complicaría la accesibilidad.

---

## Metodología

Proceso Unificado adaptado a un único desarrollador, organizado en 4 fases alineadas con los capítulos del TFG:

1. **Requisitos** — Sesiones con GRUPOSIETE, modelo del dominio, actores, casos de uso.
2. **Análisis y diseño** — Clases de análisis, arquitectura, modelo de datos, diagramas UML.
3. **Implementación y pruebas** — Desarrollo incremental por prioridad, tests automatizados.
4. **Evaluación** — Métricas de calidad, conclusiones, líneas futuras.

Herramientas de soporte: Git/GitHub, Kanban en Notion, herramientas de modelado UML.

---

## Estructura del proyecto (orientativa)

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Rutas de autenticación
│   ├── (dashboard)/        # Rutas protegidas (app principal)
│   │   ├── parking/        # Mapa + reservas
│   │   ├── calendar/       # Vista calendario disponibilidad
│   │   ├── visitors/       # Gestión de visitantes
│   │   ├── admin/          # Panel administración
│   │   └── settings/       # Configuración usuario
│   └── api/                # API routes (webhooks, bot Teams)
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── parking/            # Mapa SVG, plaza, leyenda
│   ├── booking/            # Formularios reserva/cesión
│   └── layout/             # Sidebar, header, nav
├── lib/
│   ├── supabase/           # Cliente, tipos, helpers
│   ├── microsoft/          # Graph API, auth, calendar
│   ├── email/              # Templates React Email + Resend
│   └── wallet/             # Generación pkpass / Google Wallet
├── hooks/                  # Custom hooks
├── types/                  # TypeScript types globales
└── utils/                  # Helpers compartidos
```
