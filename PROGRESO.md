# PROGRESO — "Cambios y fixes" del taller

> Documento de avance para retomar la sesión en cualquier momento.
> Método de trabajo: implementar **parte por parte** → `npx tsc --noEmit` + `npx eslint src` → test manual en dev (Chrome DevTools) antes de pasar a la siguiente.
> Plan detallado de las partes en [`cambios y fixes.md`](./cambios%20y%20fixes.md).

## Estado global

- [x] **Parte 1 — Configuraciones generales** (costo fijo mensual, WhatsApp del taller, atajos de teclado editables desde Settings)
- [x] **Parte 2 — Shortcuts de teclado + Command Palette** (búsqueda de órdenes + acciones rápidas)
- [x] **Parte 3 — Dashboard clickeable + búsqueda amplia** (sin RPC por ahora: búsqueda hecha con PostgREST puro validado en DB real) — testeado OK en Chrome DevTools
- [x] **Parte 4 — Clientes**: buscador (`q`) + detalle real `/clientes/[id]` (equipos + historial de órdenes)
- [x] **Parte 5 — Kanban mobile**: drag handle en touch, acciones siempre visibles, long-press → action sheet (WhatsApp, Ver detalle, Copiar link de tracking) + menú "···" en desktop — testeado OK en Chrome DevTools
- [x] **Parte 6 — Nueva orden**: reuso automático de equipo existente, serial alfanumérico random, fix bug marcas/tipos duplicados — testeado OK en Chrome DevTools
- [x] **Estética visual — Fondo animado** (partículas @tsparticles, acento del branding `#2EDC1B`, 18 partículas, detrás de todo, respeta `prefers-reduced-motion`)
- [ ] **Acciones automáticas — pendiente**: popup WhatsApp con QR de seguimiento al crear una orden y al finalizarla

## Entorno para testear

- Dev server: `npx next dev -H 0.0.0.0 -p 3000` (log en `/tmp/opencode/next-dev.log`).
- **User dev**: `dev@sierratech.com.ar` / `dev123456`.
- Páginas de test en Chrome DevTools: `/settings` (logueado), `/tracking/db79059ac04c` (portal público).
- Notas: `rg` NO está instalado → usar `grep`. Banco de datos prod = `crjtucqucgxiqcnhpmgs`.
- Test de PostgREST sin dev server: `curl.exe -G --data-urlencode` + token del user dev (guardado en `%TEMP%\opencode\tok.json`; credenciales + anon key en `%TEMP%\opencode\sf.json`). Obtener token: `POST /rest/v1/../auth/v1/token?grant_type=password`. **No armar URLs a mano** (los `or=(...)`/paréntesis se corrompen) → siempre `--data-urlencode`; supabase-js mantiene los puntos/parentesis crudos (`URLSearchParams` no los escapa).
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

## Parte 3 — DONE (dashboard clickeable + búsqueda amplia)

> Sin acceso a Supabase MCP / psql / CLI en esta sesión → no se pudo crear la RPC `buscar_ordenes`. Se implementó con **PostgREST puro**, patrón validado contra la DB real (query exacta reproducida con supabase-js en `%TEMP%\opencode\palette_test.cjs`).

- **Búsqueda amplia (palette + listado)** — OR sobre: `numero_ot` exacto (si numérico) | `falla_declarada` ILIKE | `marca` ILIKE | `modelo` ILIKE | `cliente.nombre` ILIKE. Patrón:
  - Select con embeds alias **vacíos**: `f_m:equipos(), f_mo:equipos()`.
  - Filtros top-level `f_m.marca=ilike.*q*` y `f_mo.modelo=ilike.*q*`.
  - `or=(numero_ot.eq.N, falla.ilike.*q*, f_m.not.is.null, f_mo.not.is.null, [equipo_id.in.(ids)])`. **Importante**: el `f_m.not.is.null` es lo que hace que el filtro de marca/modelo propague al padre; sin él, devuelve 0 resultados.
  - Para cliente: query previa `equipos?select=id,cliente:clientes!inner(nombre)&cliente.nombre=ilike.*q*` → `equipo_id.in.(...)` en el `or()`. (El null-check de 2 niveles `f_c.fc.not.is.null` dentro de `or()` NO parsea → PGRST100; por eso se resuelve por ids.)
- `src/app/actions/palette.ts`: `buscarOrdenesQuick` busca por los 5 campos (antes solo OT/falla), orders `updated_at desc`, limit 8.
- `src/lib/queries/ordenes-list.ts`: `fetchOrdenes` con la misma búsqueda amplia + filtros `urgente`/`proceso` (proceso = estado in `en_diagnostico|esperando_repuesto|en_reparacion`).
- `src/components/ui/stats-card.tsx`: prop `href` → `StatsCard` clickeable (Link + hover). `src/app/(dashboard)/page.tsx` enlaza las 4 tarjetas: Activas→`/ordenes`, Urgentes→`/ordenes?urgente=1`, En Proceso→`/ordenes?proceso=1`, Listas→`/ordenes?estado=listo_para_retiro`.
- `src/app/(dashboard)/ordenes/page.tsx`: lee `urgente`/`proceso` de `searchParams`. `src/components/orden/lista/ordenes-filters.tsx`: toggles "Urgentes"/"En proceso" + placeholder nuevo.
- **Validado en DB real** (via supabase-js): `ger`→OT-9/8, `samsung`→6, `pantalla`→5, `5`→7 (incluye OT-5), `hp`→2, `aspi`→OT-7. Typecheck + eslint OK (solo warns preexistentes). **Testeado OK en Chrome DevTools** (palette por marca/cliente/falla + stats clickeables → filtros).

## Parte 4 — DONE (clientes: buscador + detalle)

- `src/lib/queries/clientes.ts` (nuevo): `fetchClientes(q?)` (or nombre/telefono ilike) + `fetchClienteDetalle(id)` (cliente + equipos + órdenes de cada equipo, con alerta de error y null si no existe).
- `src/app/(dashboard)/clientes/page.tsx`: lee `?q=` de `searchParams`, muestra "resultados para ..." y usa `fetchClientes`. Eliminado footer placeholder.
- `src/components/clientes/clientes-search.tsx` (nuevo): input tipo buscador, client-side, `router.replace` con debounce de transición + spinner.
- `src/app/(dashboard)/clientes/[id]/page.tsx`: reemplaza ComingSoon → detalle real: header con nombre + contador equipos/órdenes + botón WhatsApp (`wa.me`), card con teléfono/email/cliente-desde, y por cada equipo: marca/modelo/SN/tipo + historial de órdenes (badge estado + badge Urgente) clickeables → `/ordenes/[id]`. `notFound()` si el cliente no existe.
- **Testeado OK en Chrome DevTools**: buscador "Carlos" → 6 resultados, URL `?q=Carlos`, detalle de Carlos Pérez (2 equipos, 3 órdenes), links a órdenes OK, WhatsApp link OK, sin errores de consola.

## Parte 5 — DONE (kanban mobile)

- `src/components/kanban/kanban-card.tsx`:
  - **Drag handle** con `GripVertical` (`touch-none`, `cursor-grab`): en mobile solo el handle dispara el `TouchSensor` (delay 100) → el drag no compite con el long-press.
  - **Acciones siempre visibles** en la card (WhatsApp verde, "Ver detalle", "···").
  - **Long-press ~500ms** (solo `pointerType !== mouse`) en el cuerpo → `kanban-card-menu` en modo **sheet** fullscreen bottom (mobile) o **dropdown** portal (desktop, botón "···").
  - Copiar link de tracking con `navigator.clipboard` (fallback textarea), estado "¡Copiado!" 1.5s + foco al botón.
  - `useIsCoarsePointer` (hook `use-coarse-pointer`): el long-press y el sheet solo aplican en `(pointer: coarse)`; en desktop la card mantiene el drag con mouse vía `listeners`.
  - Fix de regresión: en desktop, `{...listeners}` quedaba sobreescrito por `handlePointerDown` → el `PointerSensor` nunca se activaba (drag con mouse roto). Se delega a `listeners?.onPointerDown?.(e)` cuando `pointerType === "mouse" && !isCoarse && !isOverlay`.
- `src/components/kanban/kanban-card-menu.tsx` (nuevo): sheet con header "Acciones" + 3 opciones; dropdown con mismo contenido; ambos portaleados a `document.body`.
- `src/components/kanban/kanban-board.tsx`: DragOverlay + sensores (`PointerSensor` dist 8, `TouchSensor` delay 100/tol 8, `KeyboardSensor`) sin cambios.
- **Testeado OK en Chrome DevTools**:
  - Mobile (390x780 touch): `isCoarse=true`, handle visible (20x20); long-press en cuerpo → sheet con las 3 acciones; short-tap NO abre menú; "Copiar link" copia `http://localhost:3000/tracking/9ba55a466842`; sheet se cierra con ESC; drag por handle activa el DragOverlay y el drop no corrompe el estado (conteos intactos).
  - Desktop (1280x800): drag con mouse funcional de nuevo (card movida a otra columna y restaurada; conteos 2/1/3/1/4 intactos), dropdown "···" abre las 3 acciones y cierra con ESC.
  - Sin errores de consola; `npx tsc --noEmit` + `npx eslint src` limpios (solo 2 warns preexistentes).

## Parte 6 — DONE (nueva orden)

- **Fix bug de marcas/tipos duplicados** (`src/lib/queries/equipos.ts`): `getMarcasModelosUnicos()` comparaba `TIPOS_CONOCIDOS` (en minúscula) contra `e.tipo` sin normalizar → en la DB había "Notebook"/"Smartphone"/"Tablet" con mayúscula que entraban como tipos **custom**, generando opciones repetidas en el dropdown de Tipo. Al elegir esa opción custom duplicada, el form mandaba `tipo="otro"` + `tipoCustom="smartphone"` y el server lo rechazaba ("ya existe como categoría base") → **la leyenda de error impedía elegir**. Ahora la comparación es case-insensitive y marcas/modelos/tipos custom se deduplican en minúscula.
- **Botón serie aleatoria** (`src/components/forms/orden-form.tsx`): `Dices` al lado de "Escanear" genera `XXXX-XXXX-XXXX` con charset sin ambigüedades (sin 0/O/1/I) para etiquetas/QR.
- **Reuso automático de equipo**: en `crearOrden` (`src/app/actions/ordenes.ts`), si el cliente es **existente** y ya tiene un equipo con la misma `marca+modelo+serie` (case-insensitive; serie vacía matcha `IS NULL`), se reutiliza ese `equipo_id` en vez de crear otro. Nueva server action `buscarEquipoExistente` (misma lógica) para el hint del form: aviso verde "Ya tenés este equipo cargado (...) Se reutilizará sin crear duplicados." con debounce 400ms y reset en cada cambio de campos.
- **Testeado OK en Chrome DevTools**:
  - Dropdown de Tipo ya no muestra opciones duplicadas.
  - "Aleatorio" → `W9QM-TRLD-3952`.
  - Hint de reuso con Lucía Fernández (Samsung / Galaxy A52 / 123123sdfsdf) → "Ya tenés este equipo cargado…".
  - Flujo E2E: creada OT-0014 para Lucía reutilizando su equipo existente `380c1a33…` (la cuenta de equipos de Lucía quedó en 2, sin duplicado) → orden de prueba eliminada para no ensuciar el kanban.
  - Sin errores de consola; `npx tsc --noEmit` + `npx eslint src` limpios (solo 2 warns preexistentes).

## Fondo animado (estética) — DONE

- `@tsparticles/react` + `@tsparticles/all` + `@tsparticles/engine` v4.4.0 (mantenidas; en v4 NO existe `initParticlesEngine`, se usa `<ParticlesProvider init={(engine) => loadAll(engine)}>`).
- `src/components/layout/particles-background.tsx` (nuevo): canvas cliente montado en `src/app/layout.tsx`. Config convertida de `particlesjs-config.json` pero adaptada al branding:
  - Color **`#2EDC1B`** (acento SierraTech), forma polígono de 4 lados, links suaves (opacity 0.12/width 1.5).
  - **Pocas partículas (18)** sin density para no penalizar el render (fpsLimit 60).
  - Wrapper `fixed inset-0 z-0 pointer-events-none mix-blend-screen` → **queda por debajo** de sidebar, topbar, menús y tarjetas (verificado con `elementFromPoint`); los clicks pasan de largo.
  - Respeta `prefers-reduced-motion` (mueve `particles.move.enable: false`).
- **Verificado**: canvas presente y renderizando (incluso con Overlay/backdrop), 0 errores de consola.

## Notas / bugs conocidos pendientes (ver también CONTEXT.md)

- **OT-0011** (`a735a452-7ea2-43eb-9f2e-d4ff36c94c33`): presupuesto "sucio" (refleja cálculo que ya no coincide con la lógica actual).
- VCF: problemas de encoding al importar contactos (~738 clientes ya importados).
- Vercel MCP sin permisos (403) para deploy/env vars → los deploys/env vars se gestionan manualmente.

## Último commit

- `8a9d0e5` — Parte 6 (nueva orden) + fondo animado de partículas, pusheado a `origin/main`.
- Partes anteriores (`ef5cf39`, `5608f5f`, …) ya en `origin/main`.