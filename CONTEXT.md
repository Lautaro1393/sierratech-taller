# SierraTech — Contexto de proyecto

> Snapshot para que cualquier sesión nueva entienda el estado sin reconstruir historia.
> Última actualización: 2026-09-03.

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

- HEAD = `origin/main` = `95271a6`. Working tree limpio. Sincronizado con GitHub.
- Commits:
  1. `a02e569` — Fase 1.1: Setup inicial (Next.js 16 + TS + Tailwind 4 + Supabase clients).
  2. `b373ae9` — Fase 1.2: Login, Auth y Dashboard.
  3. `8722780` — test git email config.
  4. `95271a6` — fix sidebar layout (`pl-64` en lugar de `ml-64`).
- README y `CONTEXT.md` actualizados el 2026-09-03.
- **Fases 2–6 de `SPEC-taller.md` pendientes.**

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
- [ ] **Fase 2** — Auth refinada + Middleware + Layout (sidebar + header) + Dashboard con stats reales.
- [ ] **Fase 3** — Kanban board: columnas por estado, tarjetas con semáforo, drag & drop, acciones rápidas.
- [ ] **Fase 4** — Formulario de ingreso: autocomplete clientes, scanner QR de serie, upload de fotos con compresión.
- [ ] **Fase 5** — Detalle de orden: timeline, notas y fotos al historial, editar presupuesto, cambio de estado rápido.
- [ ] **Fase 6** — Portal de tracking público: ruta `/tracking/[token]`, vista simplificada para cliente, QR de acceso.

## 6. Gotchas críticos

1. **Next.js 16.3.3 rompe convenciones.** El `AGENTS.md` del proyecto lo advierte: APIs, convenciones y estructura de archivos pueden diferir de versiones anteriores. **Antes de escribir código nuevo, leer la doc local en `node_modules/next/dist/docs/`.** Verificar deprecation notices.
2. **Sidebar Vercel "raro".** El último deploy se veía mal por bug del sidebar (commit `95271a6` lo arregla con `pl-64` en vez de `ml-64`). Ese fix ya está en `origin/main`, así que Vercel ya debería haberlo redesplegado. **Verificar el deploy antes de empezar Fase 2.**
3. **Variables de entorno del taller.** `.env.local` con keys de Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) — **NO se commitea** (cubierto por `.gitignore`). `.env.example` sí está versionado como template.

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

### Inmediato
1. Verificar el deploy de Vercel post-fix sidebar (commit `95271a6`). Si sigue viéndose mal, abrir DevTools remoto y reportar.
2. Confirmar que `.env.local` está completo antes de levantar `npm run dev`.

### Corto plazo (Fase 2)
1. Refinar el flujo de login (errores, redirect post-login).
2. Middleware de Next.js para proteger rutas del grupo `(dashboard)`.
3. Layout con sidebar persistente + header glass (consistente con el sitio público).
4. Dashboard con stats reales consultando Supabase.

### Mediano plazo (Fase 3)
1. Kanban con `@dnd-kit/core` — el grueso del backoffice.
2. Acciones rápidas en tarjetas (WhatsApp al cliente, cambio de estado).

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
