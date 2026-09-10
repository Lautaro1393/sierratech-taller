# PROGRESO — "Cambios y fixes" del taller

> Documento de avance para retomar la sesión en cualquier momento.
> Método de trabajo: implementar **parte por parte** → `npx tsc --noEmit` + `npx eslint src` → test manual en dev (Chrome DevTools) antes de pasar a la siguiente.
> Plan detallado de las partes en [`cambios y fixes.md`](./cambios%20y%20fixes.md).

## Estado global

- [x] **Parte 1 — Configuraciones generales** (costo fijo mensual, WhatsApp del taller, atajos de teclado editables desde Settings)
- [x] **Parte 2 — Shortcuts de teclado + Command Palette** (búsqueda de órdenes + acciones rápidas)
- [ ] **Parte 3 — Dashboard clickeable + búsqueda amplia** (RPC `buscar_ordenes`, tarjetas con link, filtros urgente/proceso)
- [ ] **Parte 4 — Clientes**: buscador (`q`) + detalle real `/clientes/[id]` (equipos + historial de órdenes)
- [ ] **Parte 5 — Kanban mobile**: drag handle en touch, acciones siempre visibles, long-press → action sheet (WhatsApp, Ver detalle, Copiar link de tracking) + menú "···" en desktop
- [ ] **Parte 6 — Nueva orden**: reuso automático de equipo existente, serial alfanumérico random, fix bug marcas/tipos duplicados

## Entorno para testear

- Dev server: `npx next dev -H 0.0.0.0 -p 3000` (log en `/tmp/opencode/next-dev.log`).
- **User dev**: `dev@sierratech.com.ar` / `dev123456`.
- Páginas de test en Chrome DevTools: `/settings` (logueado), `/tracking/db79059ac04c` (portal público).
- Notas: `rg` NO está instalado → usar `grep`. Banco de datos prod = `crjtucqucgxiqcnhpmgs`.
- Evitar testear páginas aisladas en Chrome DevTools: puede perder la sesión auth.

## Parte 1 — DONE (configuraciones generales)

- **Migración** `supabase/migrations/2026-09-10-configuraciones-generales.sql`:
  - Keys en `app_settings`: `costo_fijo_mensual_ars` (default `1700000`), `whatsapp_taller` (default `"5491178267986"`), `shortcuts` (default `{"palette":"mod+k","nuevaOrden":"mod+n"}`).
  - Función `get_whatsapp_taller()` SECURITY DEFINER (app_settings tiene RLS solo-auth) con grants a `anon` y `authenticated`.
  - Aplicada al proyecto remoto vía MCP (`configuraciones_generales`).
- `src/types/index.ts`: tipos `Shortcuts`, `ConfiguracionGeneral` + defaults.
- `src/app/actions/settings.ts`: `GENERAL_KEYS`, `obtenerConfiguracionGeneral()`, `actualizarConfiguracionGeneral()` (zod; normaliza WhatsApp a dígitos; rechaza shortcuts duplicados; revalida `/settings`, `/` y `/tracking` layout).
- `src/components/settings/settings-client.tsx`: `GeneralCard` (costo fijo + WhatsApp + `ShortcutInput` con grabación de tecla y `Kbd`), `PricingCard` usa `costoFijoMensualArs` prop (reemplaza hardcode 1700000 del punto de equilibrio), `TarifaSimpleCard`.
- `src/lib/queries/tracking.ts`: `getWhatsAppTallerPublico()` (RPC + fallback). `src/app/tracking/[token]/page.tsx` muestra WhatsApp configurable.
- `src/lib/utils/format.ts`: `formatWhatsAppDisplay()`.
- **Probado**: settings renderiza/guarda, captura de atajo (ej. `mod+o`), tracking muestra `+54 9 11 7826-7986` → `wa.me/5491178267986`. Valores de prueba restaurados a defaults por SQL.

## Parte 2 — DONE (shortcuts + command palette)

- `src/lib/utils/shortcuts.ts`: `matchesShortcut()` / `formatShortcut()` (⌘ en Mac, `Ctrl+` en el resto) / `MOD_KEYS`. Re-exportados desde `src/lib/utils/index.ts`; `settings-client` los reutiliza (dedupe).
- `src/app/actions/palette.ts`: `buscarOrdenesQuick()` — últimas 8 órdenes, o búsqueda por `numero_ot` exacto / `falla_declarada` ILIKE. Select con alias **`equipo:equipos(... cliente:clientes(nombre))`** (patrón del listado existente; la forma sin alias `equipo(...)` da error PostgREST → devuelve `[]`).
- `src/components/layout/command-palette.tsx`: `CommandPaletteProvider` + hook `useCommandPalette` + overlay tipo Spotlight:
  - Acciones rápidas (Nueva orden, Dashboard, Kanban, Órdenes, Clientes, Configuración) + resultados de órdenes (con OT/URGENTE/cliente/marca/estado).
  - Navegación `↑↓`/`Enter`, `ESC` cierra, debounce 150ms, foco automático, mobile-first.
  - Atajos configurables desde Settings (lees del `shortcuts` pasado por el layout).
- Montado en `src/components/layout/dashboard-shell.tsx`; `(dashboard)/layout.tsx` pasa `configGeneral.shortcuts`.
- Triggers: botón de búsqueda en `src/components/layout/header.tsx` (visible desktop y mobile) + fila "Buscar Ctrl+K" en `src/components/layout/sidebar.tsx`.
- **Probado**: `Ctrl+K` abre, "pantalla" → OT-0009, `Enter` navega a la orden, `Ctrl+N` → `/ordenes/nueva`, `ESC` cierra, viewport mobile OK.

## Parte 3 — PENDIENTE

- **RPC `buscar_ordenes`** (migración + SQL): un input que busque por `numero_ot` (si numérico), `falla_declarada` ILIKE, **nombre de cliente ILIKE**, **marca/modelo ILIKE** (joins a clientes/equipos). Params opcionales: `p_urgente boolean`, `p_proceso boolean` (estado en proceso → pase de `diagnostico|reparacion|repuesto`), `p_estado`, paginación (`p_page`, `p_page_size`), ordenado por `updated_at desc`, retorna total.
- `src/components/ui/stats-card.tsx`: agregar prop `href` (wrap en Link) para:
  - Activas → `/ordenes`
  - Urgentes → `/ordenes?urgente=1`
  - En Proceso → `/ordenes?proceso=1`
  - Listas → `/ordenes?estado=listo_para_retiro`
- `src/app/(dashboard)/page.tsx` (dashboard) y `/ordenes` (grid): leer los filtros de `searchParams` y aplicar en la query (o reemplazar por el RPC).
- Opcional: conectar la palette al RPC para buscar por cliente/marca/modelo.

## Parte 4 — PENDIENTE

- `/clientes`: agregar buscador con `?q=` (nombre/telefono).
- `/clientes/[id]`: página real (hoy placeholder/resumen) con **equipos del cliente** + **historial de órdenes**.

## Parte 5 — PENDIENTE

- Kanban mobile:
  - **Drag handle** visible en touch (evitar conflicto con long-press; el `TouchSensor` tiene delay 100).
  - **Acciones siempre visibles** en la card (hoy ocultas).
  - **Long-press ~500ms** → action sheet con: WhatsApp, Ver detalle, Copiar link de tracking.
  - Desktop: menú "···" con las mismas 3 acciones.

## Parte 6 — PENDIENTE

- Nueva orden: si el cliente ya tiene un equipo con la misma **marca+modelo+serie**, reusarlo automáticamente (decisión confirmada).
- Botón para generar **número de serie alfanumérico random**.
- **Fix bug marcas/tipos duplicados** en el formulario (reproducir primero en browser; sospecha: warning `tipoCustomDuplicado` / `marcaCustomDuplicado` al elegir una opción `existente:X`).

## Notas / bugs conocidos pendientes (ver también CONTEXT.md)

- **OT-0011** (`a735a452-7ea2-43eb-9f2e-d4ff36c94c33`): presupuesto "sucio" (refleja cálculo que ya no coincide con la lógica actual).
- VCF: problemas de encoding al importar contactos (~738 clientes ya importados).
- Vercel MCP sin permisos (403) para deploy/env vars → los deploys/env vars se gestionan manualmente.

## Último commit

- `fb4481f` — Partes 1-2 implementadas + `PROGRESO.md` (pusheado a `origin/main`).