# SierraTech — Contexto de proyecto

> Snapshot para que cualquier sesión nueva entienda el estado sin reconstruir historia.
> Última actualización: 2026-09-08 (deploy production + testing E2E).

## 1. La marca

- **Sierra Tech · Soluciones Tecnológicas Integrales** — Almagro, Buenos Aires.
- Tagline: _"De los fierros al código"_.
- Dos líneas de servicio:
  - **Hardware**: micro-soldadura SMD, reconstrucción de pistas, limpieza química, cambio de pin/batería/FPC, mantenimiento de notebooks.
  - **Software**: sitios estáticos vanilla, deploy en Vercel / GitHub Pages, automatización con AppSheet.

## 2. Ecosistema: dos repos separados

| Repo | Stack | Deploy | Qué es |
|---|---|---|---|
| `Lautaro1393/SierraTech-lab` | HTML / CSS / JS vanilla | GitHub Pages | Sitio público + portafolio |
| `Lautaro1393/sierratech-taller` | Next.js 16 + React 19 + Supabase | Vercel | Backoffice + portal de tracking |

**Por qué separados** (no monorepo, no submodule):

- Stack distinto: el sitio no tiene build step, el taller sí.
- Secretos: el taller usa `.env` con keys de Supabase; mantenerlo fuera del sitio reduce riesgo de leak.
- Historial limpio: cada repo cuenta su propia historia.
- Deploys independientes: push-to-main en cada uno, sin coordinación.

## 3. Estado actual

### 3.1 `SierraTech-lab` (sitio)

- v2 desplegada y funcionando en `https://lautaro1393.github.io/SierraTech-lab/`.
- Roadmap v2 (`PLAN.md`) completo: 6 fases commiteadas.
- Documentación viva: `README.md`, `spec.md`, `design.md`, `PLAN.md`.

### 3.2 `sierratech-taller` (este repo)

- **HEAD = `83d7a63`**. Working tree limpio. Sincronizado con GitHub.
- **DB Supabase activa** (`crjtucqucgxiqcnhpmgs`), schema completo aplicado: 4 tablas base + 2 de Fase 7 (`app_settings`, `tiempo_sesiones`), enums, RLS, índices, triggers. **738 clientes importados** de VCF + equipos/órdenes reales de prueba. **User dev:** `dev@sierratech.com.ar` / `dev123456`.
- **Vercel**: proyecto linkeado a GitHub, **en producción** → `https://sierratech-taller.vercel.app`. 3 env vars configuradas en Dashboard (Production + Preview + Development) + redirect URLs en Supabase.
- **Storage**: bucket `fotos-reparaciones` (privado, signed URLs). `SUPABASE_SERVICE_ROLE_KEY` configurado en `.env.local` y Vercel — el portal público muestra fotos.
- **MCPs configurados**: Supabase (OAuth, database+docs), Vercel (OAuth), Chrome DevTools (local), gh_grep, stitch.
- **Fases 8 y 10 de `SPEC-taller.md` pendientes (5 y 6 completadas).**

## 4. Spec del taller (resumen ejecutivo)

Ver [`SPEC-taller.md`](./SPEC-taller.md) para el detalle.

### Propósito
- **Backoffice interno** para Lautaro (técnico): speed > features, ≤3 clicks al Kanban desde el dashboard.
- **Portal de seguimiento** para clientes: `/tracking/[token]`, transparente y de solo lectura.

### Principios de diseño
- Velocidad > Features.
- Información densa pero clara, sin saturar.
- Mobile-first para intake (el técnico recibe equipos con el celular).
- Desktop-optimized para gestión (vista completa del tablero en monitores).
- Offline-resilient: optimistic UI, sync cuando hay red.

### Schema Supabase (6 tablas)
- `clientes` — nombre, teléfono, email.
- `equipos` — tipo, marca, modelo, serie, clave, accesorios.
- `ordenes` — estado, falla, diagnóstico, presupuesto, token público, tiempo_total_seg.
- `historial_estados` — timeline con notas y fotos.
- `app_settings` — tarifas y config (singleton, RLS admin).
- `tiempo_sesiones` — sesiones de trabajo cronometradas.

### Estados del Kanban (enum)
`ingresado` → `en_diagnostico` → `esperando_repuesto` → `en_reparacion` → `listo_para_retiro` → `entregado`. Más `cancelado`.

### Rutas
- `/login` — login técnico.
- `/` — dashboard.
- `/kanban` — tablero.
- `/ordenes` y `/ordenes/[id]` — lista y detalle.
- `/clientes` y `/clientes/[id]` — gestión.
- `/tracking/[token]` — portal público para clientes.

### Design tokens
- Surface base: `#0D1117`
- Surface elevated: `#18243D`
- Accent (Verde SierraTech): `#2EDC1B`
- Ink primary: `#DCE2F3`
- Tipografías: Space Grotesk (display) + Geist (body) + JetBrains Mono (mono/técnica).

### Stack técnico
- Next.js 16.3.3 + React 19.2.8 + Turbopack
- Tailwind CSS 4
- `@supabase/ssr` 0.12.5 (Auth + DB) + `@supabase/supabase-js` (client)
- `date-fns` 4.4.0
- `@dnd-kit/core` (Kanban), `zod` (validación), `lucide-react` (iconos)
- `qr-scanner` (cámara), `next.config.ts` con `experimental.serverActions.bodySizeLimit: "10mb"` + `allowedDevOrigins` para LAN

## 5. Fases del taller (estado)

- [x] **Fase 1.1** — Setup Next.js + TS + Tailwind + clientes Supabase.
- [x] **Fase 1.2** — Login + Auth + Dashboard.
- [x] **Fase 2** — Auth refinada, Proxy, Layout, Dashboard Server Component.
- [x] **Fase 3** — Kanban board con `@dnd-kit`, drag & drop, server action `actualizarEstadoOrden`.
- [x] **Fase 4** — Formulario de ingreso completo: zod, `crearOrden`, `/ordenes/nueva`, `OrdenForm` + `ClienteAutocomplete` + scanner QR + upload fotos.
- [x] **Fase 5** — Detalle de orden: cambio de estado, edición presupuesto, notas, historial, resumen de cierre.
- [x] **Fase 6** — Portal de tracking público `/tracking/[token]` con QR.
- [x] **Fase 7** — Control de tiempo + viabilidad financiera: `tiempo_sesiones`, `TemporizadorCard`, `/settings` con tarifa horaria, indicador global en sidebar, auto-prompt en Kanban.
- [x] **Fase 9** — Listado de órdenes con búsqueda, filtros (estado + rango fechas), paginación. Audit encontró 5 bugs (parcheados en `49bd960`).
- [ ] **Fase 8** — Reportes/PDF (no iniciada).
- [ ] **Fase 10** — Tests E2E (no iniciada).

## 6. Features completas por ruta

- **`/login`** — login técnico con OAuth Supabase.
- **`/`** — dashboard server component con stats reales, links rápidos a Kanban/Nueva Orden.
- **`/kanban`** — 5 columnas por estado, drag & drop, semáforo por tiempo, acciones rápidas (WhatsApp + ver detalle).
- **`/ordenes/nueva`** — formulario mobile-first con cliente autocomplete, tipo equipo custom con detección de duplicados (`fix(df437f9)`), scanner QR de serie, sticky desktop.
- **`/ordenes/[id]`** — detalle completo: TemporizadorCard, edición presupuesto, cambio de estado, notas al historial, upload fotos, resumen de cierre.
- **`/ordenes`** — listado con búsqueda (OT o falla), filtros estado/rango fechas, paginación (20/página).
- **`/clientes`** — lista clickeable con importador de VCF/CSV (738 contactos importados).
- **`/clientes/[id]`** — detalle del cliente con sus equipos y órdenes.
- **`/settings`** — tarifa horaria, mantenimiento de DB.
- **`/tracking/[token]`** — portal público para cliente: estado actual, historial de cambios, fotos (requiere `SUPABASE_SERVICE_ROLE_KEY`).

## 7. Bugs corregidos recientemente

- `c578aa5` fixed-input click on desktop: `<input absolute inset-0 opacity-0>` pattern (no `sr-only`, no `display:none`).
- `df437f9` tipos custom sin duplicados + sticky desktop en `/ordenes/nueva`.
- `67e0642` items de `/clientes` ahora son links clickeables.
- `49bd960` audit Fase 9: 5 bugs parcheados (comma injection, null equipo, debounce cleanup, cancelado en filtro, page validation).
- `33cfad3` mobile: crypto.randomUUID fallback + Kanban touch improvements.

## 8. Gotchas críticos

1. **Next.js 16.3.3 rompe convenciones.** `AGENTS.md` lo advierte: leer `node_modules/next/dist/docs/` antes de escribir código nuevo. Breaking changes: `middleware.ts` → `proxy.ts` (export `proxy`), `params`/`searchParams` ahora son `Promise<...>` en server components, `searchParams` se lee con `await props.searchParams`.
2. **Tailwind 4 + `@theme` namespace conflict.** NO usar `--spacing-*` para tokens custom (Tailwind 4 usa ese namespace para generar `max-w-*`, `w-*`, `h-*`, `p-*`, `gap-*`, etc.). Usar `--size-*` u otro prefijo no reservado.
3. **File input pattern en Next 16 + React 19.** Para que el click funcione en desktop: `<input class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">`. NO `sr-only` (`clip: rect` bloquea pointer events), NO `display: none`, NO `onClick` en div padre.
4. **Variables de entorno del taller.** `.env.local` con keys de Supabase — NO se commitea (`.gitignore`). `.env.example` sí está versionado como template. Para Vercel: configurar env vars en Dashboard (Production + Preview + Development).
5. **`SUPABASE_SERVICE_ROLE_KEY`**: requerido para que `/tracking/[token]` muestre fotos (signed URLs cross-auth). Sin él, el portal funciona pero sin thumbnails. AGREGAR a `.env.local` + Vercel env vars.
6. **Server actions body size**: `next.config.ts` tiene `experimental.serverActions.bodySizeLimit: "10mb"` para uploads de fotos con compresión client-side.
7. **`allowedDevOrigins`**: configurado en `next.config.ts` para acceder desde LAN (`http://192.168.x.x:3000`).
8. **`globalThis` para timers**: NO usar en componentes React; usar `useRef` + cleanup `useEffect(() => () => clearTimeout(ref.current!), [])` para evitar memory leaks y stale callbacks.

## 9. Convenciones de trabajo

### Working dir en opencode
- Una sesión de opencode = un workspace root.
- Para trabajar en el sitio: workspace = `~/SierraTech-lab`.
- Para trabajar en el taller: workspace = este directorio.
- Para comandos puntuales en el otro repo desde una sesión abierta, usar `workdir` en bash.

### Git
- `main`, push-to-deploy.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
- Mensajes en español o inglés consistente (preferir español).

### gh CLI
- Usar `env -u GITHUB_TOKEN -u GH_TOKEN gh ...` para bypass de tokens stale.

### MCPs
- Chrome DevTools se desconecta si se mata el browser desde afuera (`pkill chrome`). Si pasa, reiniciar opencode.
- Supabase MCP: tiene acceso completo a la DB via SQL (project_ref `crjtucqucgxiqcnhpmgs`).

## 10. Deploy (completado 2026-09-08)

**URL producción:** https://sierratech-taller.vercel.app

### Checklist ejecutado ✅

1. **Vercel Dashboard** — env vars configuradas (Production + Preview + Development): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
2. **Build**: primer deploy exitoso (push a `main` dispara auto).
3. **Supabase** — Authentication → Redirect URLs: agregadas las URLs de producción + previews del dominio Vercel.
4. **Smoke test post-deploy**: todas las rutas validadas (login, dashboard, kanban, `/ordenes`, `/clientes`, `/settings`, `/ordenes/nueva`, `/ordenes/[id]`, `/tracking/[token]`).

### Pendiente opcional

- **Dominio custom** (ej: `taller.sierratech.lab`): comprar en Vercel → DNS (CNAME `cname.vercel-dns.com`) → agregar a Domains → actualizar redirect URLs en Supabase.

## 11. Próximas features pendientes

### Corto plazo
- **Fase 8** — Reportes/PDF: exportar orden a PDF para imprimir/entregar al cliente.
- **Fase 10** — Tests E2E con Playwright.

### Mejoras sugeridas (del testing manual)
- Paginación en `/clientes` (ahora lista todo).
- Búsqueda por cliente en `/ordenes` (no solo OT/falla).
- Filtros persistentes en URL (ya hecho en `/ordenes`, hacer en `/clientes`).

## 12. Referencias cruzadas

### Dentro de este repo
- [`SPEC-taller.md`](./SPEC-taller.md) — especificación funcional completa (modelo de datos, design system, fases).
- [`AGENTS.md`](./AGENTS.md) — advertencia sobre Next.js 16.
- [`supabase-schema.sql`](./supabase-schema.sql) — DDL completo.
- [`testing.md`](./testing.md) — reporte de testing manual E2E (11 secciones).

### Sitio público (repo hermano)
- [`SierraTech-lab/README.md`](https://github.com/Lautaro1393/SierraTech-lab#readme)
- [`SierraTech-lab/PLAN.md`](https://github.com/Lautaro1393/SierraTech-lab/blob/main/PLAN.md)

## 13. Contacto y brand

- WhatsApp: [+54 9 11 7826-7986](https://wa.me/5491178267986)
- Email: contacto@sierratech.lab
- Web pública: `https://lautaro1393.github.io/SierraTech-lab/`
- GitHub: [@Lautaro1393](https://github.com/Lautaro1393)

---

© 2026 Sierra Tech · Almagro, Buenos Aires.

---

## 14. Bugs pendientes (cosméticos)

Detectados en testing E2E del deploy en producción (2026-09-08). No afectan funcionalidad core, anotados para cleanup futuro:

1. **Encoding UTF-8 roto en importador VCF**: ~738 contactos importados tienen nombres con bytes mal interpretados (`Bicicleter�a Esp�ndol=`, `Art�culos para Fiestas=`, etc.). El parser VCF leyó UTF-8 como latin1 al guardar en DB. Fix: re-parsear el VCF original (`/tmp/contacts-lautaro.vcf`) con encoding correcto y hacer UPDATE de los nombres, o agregar flag `--encoding utf-8` al parser.
2. **Dato de prueba sucio en OT-0011**: presupuesto cargado como `$ 11.111.111,00`. Claramente test manual. Fix: `UPDATE ordenes SET presupuesto = 18000 WHERE id = 'a735a452-7ea2-43eb-9f2e-d4ff36c94c33';` o cargar un valor realista.
