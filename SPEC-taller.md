# =====================================================
# SPEC-TALLER.md - Sistema de Gestión SierraTech
# =====================================================

## 1. Visión y Principios

### Propósito
Sistema de gestión de taller de electrónica/software con doble propósito:
1. **Backoffice interno** para Lautaro (técnico) - máximo speed y eficiencia
2. **Portal de seguimiento** para clientes - transparencia y confianza

### Principios de Diseño

| Principio | Aplicación |
|-----------|------------|
| **Velocidad > Features** | Cada funcionalidad debe tardar <3 clicks desde landing en el Kanban |
| **Información densa pero clara** | Mucha info visible sin scroll, sin saturar |
| **Mobile-first para intake** | El técnico recibe equipos con el celular |
| **Desktop-optimized para gestión** | Vista completa del tablero en monitores |
| **Offline-resilient** | Optimistic UI, sync cuando hay red |

---

## 2. Arquitectura del Proyecto

```
sierratech-taller/                      # Next.js 15 + TypeScript
├── src/
│   ├── app/                            # App Router
│   │   ├── (auth)/                    # Grupo de rutas autenticadas
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/               # Grupo del backoffice
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # Dashboard
│   │   │   ├── kanban/page.tsx       # Tablero Kanban
│   │   │   ├── ordenes/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   └── clientes/
│   │   │       ├── page.tsx
│   │   │       └── [id]/page.tsx
│   │   ├── tracking/
│   │   │   └── [token]/page.tsx      # Portal público
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Landing/Redirect
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                        # Componentes base
│   │   │   ├── button.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── select.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── supabase/                 # Clientes Supabase
│   │   ├── utils/                    # Utilidades
│   │   └── hooks/                    # React hooks
│   └── types/                         # Tipos TypeScript
├── supabase-schema.sql                # Schema para ejecutar en Supabase
└── .env.example                       # Template de variables de entorno
```

---

## 3. Schema de Base de Datos

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `clientes` | Nombre, teléfono, email |
| `equipos` | Tipo, marca, modelo, serie, clave, accesorios |
| `ordenes` | Estado, falla, diagnóstico, presupuesto, token público |
| `historial_estados` | Timeline con notas y fotos |

### Estados del Kanban (enum)
1. `ingresado` - Equipo recibido
2. `en_diagnostico` - Siendo diagnosticado
3. `esperando_repuesto` - Pendiente de repuesto
4. `en_reparacion` - En reparación
5. `listo_para_retiro` - Listo para entregar
6. `entregado` - Entregado al cliente
7. `cancelado` - Orden cancelada

### Tablas de Tiempo (Fase 7)

| Tabla | Descripción |
|-------|-------------|
| `app_settings` | Key/value para config global (ej: `tarifa_horaria_ars`) |
| `tiempo_sesiones` | Una fila por start/pause (FK a `ordenes`, `duracion_seg` calculado) |
| `ordenes.tiempo_total_seg` | Campo acumulativo actualizado por trigger (suma de duraciones cerradas) |

**Reglas de negocio:**
- Solo una sesión activa por orden (validado en server action).
- Timer bloqueado en `entregado` / `cancelado`.
- Auto-stop al pasar a `entregado` o `cancelado`.
- Auto-prompt al pasar a `esperando_repuesto` (pausar si querés).
- Sesiones huérfanas (>24h sin cerrar) ofrecen cierre forzado.

---

## 4. Design System

### Colores
- **Surface Base**: `#0D1117`
- **Surface Elevated**: `#18243D`
- **Accent (Verde SierraTech)**: `#2EDC1B`
- **Ink Primary**: `#DCE2F3`

### Tipografías
- **Display**: Space Grotesk
- **Body**: Geist
- **Mono/Code**: JetBrains Mono

### Componentes UI
- Button (primary, secondary, ghost, danger)
- Badge (para estados, con dot de color)
- Card (glass, glass-interactive)
- Input, Textarea, Select

---

## 5. Fases de Implementación

### Fase 1: Setup y Configuración ✅
- [x] 1.1.1 Proyecto Next.js 15 + TypeScript + Tailwind
- [x] 1.1.2 Tokens de diseño en Tailwind config
- [x] 1.1.3 Componentes UI base
- [x] 1.1.4 Clientes Supabase (browser + server)
- [x] 1.1.5 Schema SQL para ejecutar en Supabase
- [ ] 1.1.6 Commit y push

### Fase 2: Auth y Layout
- [x] 2.1 Login con Supabase Auth
- [x] 2.2 Middleware para proteger rutas (renombrado a `proxy.ts` en Next 16)
- [x] 2.3 Layout con sidebar + header
- [x] 2.4 Dashboard con stats

### Fase 3: Kanban Board
- [x] 3.1 Board con columnas por estado
- [x] 3.2 Tarjetas de orden con semáforo
- [x] 3.3 Drag & drop entre columnas
- [x] 3.4 Acciones rápidas (WhatsApp, ver detalle)

### Fase 4: Formulario de Ingreso
- [ ] 4.1 Autocomplete de clientes
- [ ] 4.2 Selector de equipo
- [ ] 4.3 Scanner QR de série
- [ ] 4.4 Upload de fotos con compresión

### Fase 5: Detalle de Orden ✅
- [x] 5.1 Vista detalle con timeline (ya estaba la base)
- [x] 5.2 Agregar notas y fotos al historial — notas sí, fotos pendientes (requiere Storage)
- [x] 5.3 Editar presupuesto — total + repuestos + tipo intervención + aprobado
- [x] 5.4 Cambio de estado rápido — chips clickeables, con confirmación para estados finales
- [x] 5.5 Resumen de cierre automático — banner con costo/ganancia/margen cuando estado = entregado/cancelado
- [x] 5.6 Auto-stop de timer al cerrar orden (validado E2E)

#### Pendientes para Fase 5+
- Fotos en historial (requiere Supabase Storage bucket)

### Fase 6: Portal de Tracking
- [ ] 6.1 Ruta pública `/tracking/[token]`
- [ ] 6.2 Vista simplificada para cliente
- [ ] 6.3 QR de acceso

### Fase 7: Control de Tiempo y Viabilidad ✅
- [x] 7.1 Schema: `app_settings` + `tiempo_sesiones` + `ordenes.tiempo_total_seg` + trigger
- [x] 7.2 Server actions: start/pause/resume/stop + editar notas + cerrar huérfana
- [x] 7.3 Settings: tarifa horaria configurable en `/settings`
- [x] 7.4 `TemporizadorCard` en `/ordenes/[id]` con timer en vivo, costo y margen
- [x] 7.5 Indicador global en sidebar (chip rojo con OT activa)
- [x] 7.6 Auto-prompt al mover a `esperando_repuesto`
- [x] 7.7 Auto-stop al cerrar orden (`entregado` / `cancelado`)

#### Out of scope (Fase 8+)
- Reportes de profitability por tipo de equipo / falla
- Histórico comparativo "tiempo promedio por tipo"
- Export CSV
- Multi-usuario con atribución por sesión (campo `creado_por` ya existe)

---

## 6. Tareas Pendientes Detalladas

### Fase 1.6: Commit y Push ✅
- [x] Crear archivo SPEC-taller.md
- [x] git init / git add
- [x] git commit
- [x] git push

### Fase 2: Auth y Layout ✅
- [x] 2.1 Login con Supabase Auth
- [x] 2.2 Middleware para proteger rutas (renombrado a `proxy.ts`)
- [x] 2.3 Layout con sidebar + header
- [x] 2.4 Dashboard con stats

### Fase 3: Kanban Board ✅
- [x] 3.1 Board con columnas por estado
- [x] 3.2 Tarjetas de orden con semáforo
- [x] 3.3 Drag & drop entre columnas
- [x] 3.4 Acciones rápidas (WhatsApp, ver detalle)

### Fase 4: Formulario de Ingreso (próximo)
- [ ] 4.1 Autocomplete de clientes
- [ ] 4.2 Selector de equipo
- [ ] 4.3 Scanner QR de serie
- [ ] 4.4 Upload de fotos con compresión

---

## 7. API Reference

### Rutas Principales
- `/login` - Login del técnico
- `/` - Dashboard
- `/kanban` - Tablero Kanban
- `/ordenes` - Lista de órdenes
- `/ordenes/[id]` - Detalle de orden
- `/clientes` - Gestión de clientes
- `/tracking/[token]` - Portal público

### Componentes Utilizados
- `@supabase/ssr` - Cliente de Supabase
- `date-fns` - Formateo de fechas
- `tailwindcss` - Estilos

---

## 8. Decisiones Técnicas

| Decisión | Valor |
|----------|-------|
| Stack | Next.js 15 + TypeScript |
| CSS | Tailwind CSS 4 |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Drag & Drop | @dnd-kit/core |
| Validación | Zod |
| Iconos | Lucide React |
