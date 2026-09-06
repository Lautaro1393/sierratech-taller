# SierraTech — Contexto de proyecto

> Snapshot para que cualquier sesión nueva entienda el estado sin reconstruir historia.
> Última actualización: 2026-09-03 (sesión vespertina).

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

**Ubicación local** (reorganización del 2026-09-03):

```
C:\Users\lauta\
├── SierraTech-lab\          ← sitio estático
└── sierratech-taller\       ← este repo (hermano, NO anidado)
```

> La carpeta `sierratech-taller/` está ignorada en `.gitignore` de `SierraTech-lab` para que no vuelva a aparecer como untracked si se anida por error.

## 3. Estado actual

### 3.1 `SierraTech-lab` (sitio)

- v2 desplegada y funcionando en `https://lautaro1393.github.io/SierraTech-lab/`.
- Roadmap v2 (`PLAN.md`) completo: 6 fases commiteadas.
- Último commit: `541138b chore: ignore sierratech-taller/`.
- Documentación viva: `README.md`, `spec.md`, `design.md`, `PLAN.md`.

### 3.2 `sierratech-taller` (este repo)

- HEAD = `origin/main` = `5e9e723`. Working tree limpio. Sincronizado con GitHub.
- Commits (top → bottom del log):
  1. `a02e569` — Fase 1.1: Setup inicial (Next.js 16 + TS + Tailwind 4 + Supabase clients).
  2. `b373ae9` — Fase 1.2: Login, Auth y Dashboard.
  3. `8722780` — test git email config.
  4. `95271a6` — fix sidebar layout (`pl-64` en lugar de `ml-64`).
  5. `268ce49` — CONTEXT.md vivo + reemplazo README boilerplate.
  6. **Fase 2** (7 commits: `0045214`…`8a04794`): proxy migrado, AuthProvider único, page.tsx default fuera, Header en dashboard, errores Supabase mapeados, Dashboard Server Component, placeholders para rutas pendientes, lucide-react + zod instalados.
  7. **Fase 3** (4 commits: `ad887dc`…`29780cd`): server action `actualizarEstadoOrden` con historial, server component `/kanban` con fetch + joins, `KanbanBoard` con `@dnd-kit` (DndContext, 5 columnas, DragOverlay), cards con semáforo + WhatsApp + ver detalle.
  8. `3852d68` — fix CSS: tokens custom `--spacing-*` → `--size-*` (rompía `max-w-*` en toda la app).
  9. **Fase 4** (5 commits: `7659c30`…`5e9e723`): zod schemas, `crearOrden` server action, página `/ordenes/nueva`, `OrdenForm` + `ClienteAutocomplete` mobile-first, links "Nueva Orden" en Dashboard y Kanban. **Falta:** 4.3 (scanner QR) y 4.4 (upload fotos con compresión) — pendientes de definir storage.
  10. `33c1df9` — docs: actualizar CONTEXT.md y SPEC-taller.md.
  11. **Fase 7** (N commits, sin pushear aún): schema `app_settings` + `tiempo_sesiones`, server actions (start/pause/resume/stop), página `/settings`, `TemporizadorCard` con timer en vivo + costo + margen, indicador global en sidebar, auto-prompt al mover a `esperando_repuesto`, auto-stop al cerrar orden. **Migración SQL pendiente de aplicar en Supabase** (archivo: `supabase/migrations/2026-09-06-tiempo-control.sql`).
- **DB Supabase activa** (`crjtucqucgxiqcnhpmgs`). Schema completo aplicado (4 tablas, enum, RLS, indices, trigger). 3 clientes, 4 equipos, **7 órdenes** (la OT-0007 se creó en la prueba E2E de Fase 4 con cliente Lucía, equipo Acer Aspire 5), 3 entradas de historial. **User dev:** `dev@sierratech.com.ar` / `dev123456`.
- **Vercel**: proyecto recreado y linkeado a GitHub (`prj_ijMCD6lX6svfVk5tnovM97TNnrUz`, team `lautaro1393s-projects`). **Pendiente del user:** configurar env vars `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Vercel Dashboard (Settings → Environment Variables) y verificar que dispare el primer deploy.
- **MCPs configurados** en `opencode.json` per-project: Supabase (database+docs, project_ref `crjtucqucgxiqcnhpmgs`) y Vercel (remoto OAuth). El MCP de Vercel no lista el proyecto nuevo aún (bug de cache — necesita time o reauth).
- **Fases 5–6 de `SPEC-taller.md` pendientes.**

## 4. Spec del taller (resumen ejecutivo)

Ver [`SPEC-taller.md`](./SPEC-taller.md) para el detalle. Resumen:

### Propósito
- **Backoffice interno** para Lautaro (técnico): speed > features, ≤3 clicks al Kanban desde el dashboard.
- **Portal de seguimiento** para clientes: `/tracking/[token]`, transparente y de solo lectura.

### Principios de diseño
- Velocidad > Features.
- Información densa pero clara, sin saturar.
- Mobile-first para intake (el técnico recibe equipos con el celular).
- Desktop-optimized para gestión (vista completa del tablero en monitores).
- Offline-resilient: optimistic UI, sync cuando hay red.

### Schema Supabase (4 tablas)
- `clientes` — nombre, teléfono, email.
- `equipos` — tipo, marca, modelo, serie, clave, accesorios.
- `ordenes` — estado, falla, diagnóstico, presupuesto, token público.
- `historial_estados` — timeline con notas y fotos.

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
- Next.js 16.3.3 + React 19.2.8
- Tailwind CSS 4
- `@supabase/ssr` 0.12.5 (Auth + DB)
- `date-fns` 4.4.0
- **Pendiente**: `@dnd-kit/core` (drag & drop del Kanban), `zod` (validación), `lucide-react` (iconos).

## 5. Fases del taller (estado)

- [x] **Fase 1.1** — Setup Next.js + TS + Tailwind + clientes Supabase.
- [x] **Fase 1.2** — Login + Auth + Dashboard.
- [x] **Fase 2** — Auth refinada (errores Supabase mapeados) + Proxy (era Middleware, renombrado en Next 16) + Layout (sidebar + header renderizado) + Dashboard Server Component con stats reales desde Supabase.
- [x] **Fase 3** — Kanban board: 5 columnas por estado, server component fetch con joins (orden + equipo + cliente), drag & drop con `@dnd-kit/core` (PointerSensor + DndContext + DragOverlay), tarjetas con semáforo, acciones rápidas (WhatsApp con mensaje por estado, ver detalle), server action `actualizarEstadoOrden` que crea entrada en `historial_estados`. Optimistic UI con rollback si falla.
- [x] **Fase 4** — Formulario de ingreso (parcial): zod schemas, server action `crearOrden`, página `/ordenes/nueva`, `OrdenForm` + `ClienteAutocomplete` mobile-first, links en Dashboard y Kanban. **Falta:** 4.3 scanner QR, 4.4 upload fotos (requiere definir Supabase Storage bucket primero).
- [x] **Fase 7** — Control de tiempo y viabilidad: schema `app_settings` + `tiempo_sesiones`, server actions (start/pause/resume/stop + cerrar huérfana + editar nota), página `/settings` con tarifa horaria configurable, `TemporizadorCard` en `/ordenes/[id]` con timer en vivo + costo a tarifa + margen vs presupuesto + lista de sesiones con notas editables, indicador global en sidebar (chip rojo con OT activa), auto-prompt en Kanban al pasar a `esperando_repuesto`, auto-stop al pasar a `entregado` o `cancelado`. Migración SQL en `supabase/migrations/2026-09-06-tiempo-control.sql` (pendiente de aplicar en Supabase).
- [ ] **Fase 5** — Detalle de orden: ya tiene la base de la Fase 7; faltan notas y fotos al historial, editar presupuesto, cambio de estado rápido desde detalle.
- [ ] **Fase 6** — Portal de tracking público: ruta `/tracking/[token]`, vista simplificada para cliente, QR de acceso.

## 6. Gotchas críticos

1. **Next.js 16.3.3 rompe convenciones.** El `AGENTS.md` del proyecto lo advierte: APIs, convenciones y estructura de archivos pueden diferir de versiones anteriores. **Antes de escribir código nuevo, leer la doc local en `node_modules/next/dist/docs/`.** Verificar deprecation notices. Breaking changes ya encontrados: `middleware.ts` → `proxy.ts` (export `proxy`), `params` y `searchParams` ahora son `Promise<...>`.
2. **Tailwind 4 + `@theme` namespace conflict.** El bloque `@theme` en `globals.css` NO debe usar `--spacing-*` para tokens custom (Tailwind 4 usa ese namespace para generar `max-w-*`, `w-*`, `h-*`, `p-*`, `gap-*`, etc.). Usar `--size-*` o cualquier otro prefijo no reservado. **Bug histórico**: el commit `3852d68` arregló un caso donde `--spacing-md: 16px` colapsaba `max-w-md` a 16px en toda la app.
3. **Variables de entorno del taller.** `.env.local` con keys de Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) — **NO se commitea** (cubierto por `.gitignore`). `.env.example` sí está versionado como template.
4. **MCP Supabase instalado** en `opencode.json` (per-project, scope `crjtucqucgxiqcnhpmgs`, features `database,docs`). Sirve para ejecutar SQL y consultar docs desde la sesión. Auth via OAuth. Storage no habilitado (agregar cuando llegue Fase 4).

## 7. Convenciones de trabajo

### Working dir en opencode
- Una sesión de opencode = un workspace root.
- Para trabajar en el sitio: workspace = `C:\Users\lauta\SierraTech-lab`.
- Para trabajar en el taller: workspace = `C:\Users\lauta\sierratech-taller`.
- Para comandos puntuales en el otro repo desde una sesión abierta, usar `workdir` en bash.

### Git
- Ambos repos en `main`, push-to-deploy.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
- Mensajes en español o inglés consistente (preferir español, es el idioma del proyecto).

## 8. Próximos pasos sugeridos

### Inmediato (manuales, requieren browser del user)
1. **Vercel Dashboard** → `sierratech-taller` → Settings → Environment Variables. Agregar:
   - `NEXT_PUBLIC_SUPABASE_URL` (target: Production + Preview + Development)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (idem)
2. Verificar que dispare el primer deploy (debería ser automático al pushear a main). Si falla, abrir el build log y pegar acá.
3. **Aplicar migración SQL de Fase 7** en Supabase Dashboard → SQL Editor → New query → pegar el contenido de `supabase/migrations/2026-09-06-tiempo-control.sql` → Run. Crea las tablas `app_settings`, `tiempo_sesiones`, agrega `ordenes.tiempo_total_seg`, trigger de mantenimiento, y RLS.
4. **Bug pre-existente** detectado pero NO arreglado: el sidebar fixed de 256px se superpone al contenido en mobile (390px). Es del `(dashboard)/layout.tsx` de Fase 1.2. Fix mínimo: `pl-0 md:pl-64` en el `<main>`. Fix ideal: sidebar off-canvas con hamburger en mobile.

### Corto plazo (Fase 4 — completar)
1. Definir Supabase Storage: crear bucket `fotos` (público, con policy de upload autenticado).
2. 4.4 Upload de fotos con compresión client-side (canvas resize antes de subir).
3. 4.3 Scanner QR de serie (librería `qr-scanner` o similar).

### Mediano plazo (Fase 5)
1. Pantalla `/ordenes/[id]` con timeline del historial (ya hay datos de prueba).
2. Editor de presupuesto, switch de urgencia.
3. Cambio de estado rápido (chips o dropdown).
4. Acciones: editar nota, agregar foto, marcar como entregado/cancelado.

### Mediano plazo (Fase 6)
1. Portal `/tracking/[token]` con vista simplificada para cliente.
2. QR de acceso generado por la app (o link compartible).
3. Mejorar la policy de RLS para que el `public_token` sea accesible sin auth (la del schema actual tiene un bug en `current_setting`).

## 9. Referencias cruzadas

### Dentro de este repo
- [`SPEC-taller.md`](./SPEC-taller.md) — especificación funcional completa (modelo de datos, design system, fases).
- [`AGENTS.md`](./AGENTS.md) — advertencia sobre Next.js 16.
- [`supabase-schema.sql`](./supabase-schema.sql) — DDL para correr en Supabase.

### Sitio público (repo hermano)
- [`../SierraTech-lab/README.md`](../SierraTech-lab/README.md) — overview del sitio.
- [`../SierraTech-lab/PLAN.md`](../SierraTech-lab/PLAN.md) — roadmap v2 (cerrado).
- [`../SierraTech-lab/design.md`](../SierraTech-lab/design.md) — design system del sitio (alinear con tokens del taller).

## 10. Contacto y brand

- WhatsApp: [+54 9 11 7826-7986](https://wa.me/5491178267986)
- Email: contacto@sierratech.lab
- Web pública: `https://lautaro1393.github.io/SierraTech-lab/`
- GitHub: [@Lautaro1393](https://github.com/Lautaro1393)

---

© 2026 Sierra Tech · Almagro, Buenos Aires.
