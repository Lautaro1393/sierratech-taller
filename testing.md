# Testing Manual - SierraTech Taller

## Configuración
- **Desktop**: 1280x720
- **Mobile**: 375x812 (iPhone)
- **Fecha**: 07 sep 2026
- **Servidor**: localhost:3000

---

## 1. Login (`/login`)

### Desktop
| # | Qué probar | Estado | Bug/Mejora | Notas |
|---|-----------|--------|------------|-------|
| 1 | Formulario visible y centrado | ✅ | | Layout centrado, branding arriba |
| 2 | Inputs: email + password | ✅ | | Pre-fill con credenciales de dev |
| 3 | Botón "Ingresar" funcional | ✅ | | Verde, full-width |
| 4 | Validación de campos vacíos | ⏭️ | | No probado (ya hay credenciales) |
| 5 | Redirect al dashboard al logear | ✅ | | Funciona correctamente |
| 6 | Error con credenciales mal | ⏭️ | | No probado |

### Mobile
| # | Qué probar | Estado | Bug/Mejora | Notas |
|---|-----------|--------|------------|-------|
| 1 | Formulario responsive | ✅ | | Se adapta correctamente |
| 2 | Inputs touch-friendly | ✅ | | Tamaño adecuado |
| 3 | Botón full-width | ✅ | | Ocupa todo el ancho |
| 4 | Teclado no tapa el formulario | ✅ | | Scroll automático |

---

## 2. Dashboard (`/`)

### Desktop
| # | Qué probar | Estado | Bug/Mejora | Notas |
|---|-----------|--------|------------|-------|
| 1 | Stats cards: 4 columnas | ✅ | | Ord. Activas, Urgentes, En Proceso, Listas |
| 2 | Órdenes recientes: lista | ✅ | | Muestra 5 órdenes con semáforo |
| 3 | Botón "Nueva Orden" funciona | ✅ | | Redirect a /ordenes/nueva |
| 4 | Links a órdenes individuales | ✅ | | Click en orden → detalle |
| 5 | Sidebar activo en "Dashboard" | ✅ | | Highlight verde |
| 6 | Header con breadcrumb | ✅ | | "SierraTech / Dashboard" |
| 7 | Estado vacío (sin órdenes) | ⏭️ | | No hay estado vacío (9 órdenes activas) |
| 8 | Colores de semáforo | ✅ | | Verde, amarillo, rojo |

### Mobile
| # | Qué probar | Estado | Bug/Mejora | Notas |
|---|-----------|--------|------------|-------|
| 1 | Stats cards: stack vertical | ✅ | | 1 columna |
| 2 | Botón hamburger funciona | ✅ | | Abre sidebar |
| 3 | Sidebar se abre/cierra | ✅ | | Slide-in + overlay |
| 4 | Órdenes recientes scrollable | ✅ | | Scroll vertical |
| 5 | Textos legibles | ✅ | | Tamaños OK |

---

## 3. Kanban (`/kanban`)

### Desktop
| # | Qué probar | Estado | Bug/Mejora | Notas |
|---|-----------|--------|------------|-------|
| 1 | 5 columnas visibles | ✅ | | Ingresado(2), Diagnóstico(1), Repuesto(1), Reparación(1), Retiro(3) |
| 2 | Tarjetas con info completa | ✅ | | OT, cliente, equipo, falla, tiempo |
| 3 | Drag & drop entre columnas | ✅ | | @dnd-kit funciona |
| 4 | Badge de estado | ✅ | | Colores por estado |
| 5 | Semáforo de tiempo | ✅ | | Verde/amarillo/rojo |
| 6 | Botón WhatsApp | ✅ | | En cada tarjeta |
| 7 | Botón ver detalle | ✅ | | Link a /ordenes/[id] |
| 8 | Botón "Nueva Orden" | ✅ | | Header |
| 9 | Columna vacía muestra placeholder | ⏭️ | | Todas tienen al menos 1 orden |

### Mobile
| # | Qué probar | Estado | Bug/Mejora | Notas |
|---|-----------|--------|------------|-------|
| 1 | Scroll horizontal funciona | ✅ | | Se ve siguiente columna al borde |
| 2 | Tarjetas compactas | ✅ | | Info condensada |
| 3 | Drag & drop funciona en touch | ✅ | | Touch events OK |
| 4 | Botones touch-friendly | ✅ | | Tamaño adecuado |

---

## 4. Órdenes - Lista (`/ordenes`)

### Desktop
| # | Qué probar | Estado | Bug/Mejora | Notas |
|---|-----------|--------|------------|-------|
| 1 | Tabla con columnas | ✅ | | OT, Cliente, Equipo, Estado, Presupuesto, Tiempo |
| 2 | Filtros: búsqueda, estado, fechas | ✅ | | Dropdown con 8 estados + date pickers |
| 3 | Paginación funciona | ⏭️ | | 11 órdenes, sin paginación visible |
| 4 | Click en fila → detalle | ✅ | | Links funcionales |
| 5 | Badges de estado | ✅ | | Colores correctos |
| 6 | Botón "Nueva Orden" | ✅ | | Header |
| 7 | Estado vacío | ⏭️ | | No probado |

### Mobile
| # | Qué probar | Estado | Bug/Mejora | Notas |
|---|-----------|--------|------------|-------|
| 1 | Tabla responsive (cards) | ✅ | | Solo OT, Cliente, Estado visibles |
| 2 | Filtros colapsados | ✅ | | Stack vertical |
| 3 | Paginación touch-friendly | ⏭️ | | Sin paginación |

**Filtros verificados**: Seleccioné "En Reparación" → filtró a 1 orden, counter actualizó, botón "Limpiar" apareció. URL actualiza con query params.

---

## 5. Órdenes - Nueva (`/ordenes/nueva`)

### Desktop
| # | Qué probar | Estado | Bug/Mejora | Notas |
|---|-----------|--------|------------|-------|
| 1 | Formulario completo visible | ✅ | | CLIENTE, EQUIPO, ORDEN |
| 2 | Autocomplete de clientes | ✅ | | Dropdown con resultados + "Crear nuevo" |
| 3 | Selector de equipo | ✅ | | Tipo dropdown, Marca autocomplete, Modelo |
| 4 | Campos obligatorios marcados | ✅ | | Asterisco rojo en * |
| 5 | Submit exitoso | ⏭️ | | No creé orden (datos reales) |
| 6 | Validación de errores | ⏭️ | | No probado |
| 7 | Cancelar → redirige | ✅ | | "Volver al Kanban" link |

### Mobile
| # | Qué probar | Estado | Bug/Mejora | Notas |
|---|-----------|--------|------------|-------|
| 1 | Formulario 1 columna | ✅ | | Stack vertical |
| 2 | Inputs touch-friendly | ✅ | | Tamaño OK |
| 3 | Botones full-width | ✅ | | "Crear orden" full-width |
| 4 | Teclado no tapa campos | ⚠️ | **BUG** | Botón "Crear orden" fijo se superpone con último campo visible |

**Bug encontrado**: En mobile, el botón "Crear orden" (position: fixed bottom) se superpone con los campos del formulario cuando se hace scroll. Puede tapar el campo de "Falla declarada" o "Presupuesto".

---

## 6. Órdenes - Detalle (`/ordenes/[id]`)

### Desktop
| # | Qué probar | Estado | Bug/Mejora | Notas |
|---|-----------|--------|------------|-------|
| 1 | Info de la orden | ✅ | | OT, estado, equipo, cliente, teléfono |
| 2 | Timeline / historial | ✅ | | "Orden creada en Ingresado" + fecha |
| 3 | Cambio de estado | ✅ | | 7 chips clickeables, estado actual disabled |
| 4 | Timer (iniciar/pausar) | ✅ | | Iniciar → timer activo → Pausar/Detener |
| 5 | Presupuesto | ✅ | | Tipo, Repuestos, MO, Total, Aprobado |
| 6 | Notas | ✅ | | "+ Agregar nota al historial" |
| 7 | Link de tracking | ✅ | | Modal con link + QR + Copiar |
| 8 | Botón WhatsApp | ✅ | | En tarjeta de cliente |

**Timer verificado**: 
- Click "Iniciar" → timer activo, sidebar muestra "TRABAJANDO EN OT-XXXX"
- Costo operativo se actualiza en vivo ($288,00 después de 1min)
- Botones cambian a "Pausar" / "Detener"
- Click "Pausar" → timer se detiene

### Mobile
| # | Qué probar | Estado | Bug/Mejora | Notas |
|---|-----------|--------|------------|-------|
| 1 | Layout stack | ✅ | | Todo vertical |
| 2 | Tabs o acordeón | ⏭️ | | No hay tabs, es scroll vertical |
| 3 | Timer visible | ✅ | | Se ve correctamente |
| 4 | Acciones touch-friendly | ✅ | | Chips y botones tamaño OK |

---

## 7. Clientes - Lista (`/clientes`)

### Desktop
| # | Qué probar | Estado | Bug/Mejora | Notas |
|---|-----------|--------|------------|-------|
| 1 | Listado de clientes | ✅ | | 738 clientes, alfabético |
| 2 | Botón importar contactos | ✅ | | Verde, header |
| 3 | Click en cliente → detalle | ❌ | **BUG** | Items NO son clickeables (StaticText, no links) |
| 4 | Estado vacío | ⏭️ | | 738 clientes |
| 5 | Stats (total, con email) | ✅ | | "738 clientes · 7 con email" |

### Mobile
| # | Qué probar | Estado | Bug/Mejora | Notas |
|---|-----------|--------|------------|-------|
| 1 | Lista responsive | ✅ | | Fechas ocultas |
| 2 | Botón importar visible | ✅ | | Header |

**Bug encontrado**: Los items de la lista de clientes NO son enlaces. No se puede navegar al detalle del cliente (`/clientes/[id]`) haciendo click en la lista. El SPEC define que debería existir `/clientes/[id]/page.tsx` pero la lista no vincula a ellos.

---

## 8. Clientes - Detalle (`/clientes/[id]`)

| # | Qué probar | Estado | Bug/Mejora | Notas |
|---|-----------|--------|------------|-------|
| 1 | Info del cliente | ❌ | **PENDIENTE** | No se puede acceder desde la lista |
| 2 | Órdenes del cliente | ❌ | **PENDIENTE** | No se puede acceder desde la lista |
| 3 | Editar cliente | ❌ | **PENDIENTE** | No se puede acceder desde la lista |

---

## 9. Settings (`/settings`)

### Desktop
| # | Qué probar | Estado | Bug/Mejora | Notas |
|---|-----------|--------|------------|-------|
| 1 | Tarifa horaria visible | ✅ | | Legacy: $5.000/h |
| 2 | Editar tarifa | ✅ | | Input funcional |
| 3 | Config pricing | ✅ | | Costo piso, Tarifa estándar, Tarifa microscopio |
| 4 | Guardar cambios | ✅ | | Botones "Guardar tarifa legacy" y "Guardar configuración de pricing" |

**Configuraciones verificadas**:
- Tarifa legacy: $5.000/h (deprecada)
- Costo hora piso: $17.000
- Tarifa estándar: $25.000
- Tarifa microscopio: $40.000
- Umbrales: amarillo 0.7, rojo 1
- Punto de equilibrio: 100h/mes, margen 47%

### Mobile
| # | Qué probar | Estado | Bug/Mejora | Notas |
|---|-----------|--------|------------|-------|
| 1 | Config responsive | ✅ | | Stack vertical |
| 2 | Inputs touch-friendly | ✅ | | Tamaño OK |

---

## 10. Tracking (`/tracking/[token]`)

### Desktop
| # | Qué probar | Estado | Bug/Mejora | Notas |
|---|-----------|--------|------------|-------|
| 1 | Portal público accesible | ✅ | | Sin auth requerida |
| 2 | Timeline de progreso | ✅ | | 6 pasos, 1 activo |
| 3 | Info del equipo | ✅ | | Falla, tipo, ingreso, promesa |
| 4 | Link WhatsApp | ✅ | | Footer con link clickable |
| 5 | Sin auth requerida | ✅ | | Accesible directamente |

### Mobile
| # | Qué probar | Estado | Bug/Mejora | Notas |
|---|-----------|--------|------------|-------|
| 1 | Portal responsive | ✅ | | Layout adaptado |
| 2 | Timeline vertical | ✅ | | Funcional |

**Portal verificado**:
- Header: "SIERRATECH TALLER"
- OT number en verde
- Saludo personalizado: "Hola, Lucía"
- Estado actual con descripción
- Timeline de 6 pasos
- Detalle del equipo
- Footer con WhatsApp + dirección

---

## 11. Logout

| # | Qué probar | Estado | Bug/Mejora | Notas |
|---|-----------|--------|------------|-------|
| 1 | Click en "Cerrar sesión" | ✅ | | Sidebar link |
| 2 | Redirect a /login | ✅ | | Funciona correctamente |
| 3 | No puede acceder a rutas protegidas | ✅ | | Redirect automático a /login |

---

## Resumen de Hallazgos

### Bugs Encontrados
| # | Severidad | Sección | Descripción |
|---|-----------|---------|-------------|
| 1 | 🔴 Alta | Clientes - Lista | Items de la lista NO son clickeables. No se puede navegar al detalle del cliente. Los items son `StaticText` en vez de `Link`. |
| 2 | 🟡 Media | Órdenes - Nueva (Mobile) | Botón "Crear orden" fijo (position: fixed bottom) se superpone con los campos del formulario al hacer scroll. Puede tapar "Falla declarada" o "Presupuesto". |
| 3 | 🟢 Baja | Órdenes - Detalle | Tipo de equipo dice "monitor" para un Samsung Galaxy A52 (es smartphone). Puede ser dato de prueba, pero sugiere que el autocomplete de Tipo no valida bien. |

### Mejoras Sugeridas
| # | Prioridad | Sección | Descripción |
|---|-----------|---------|-------------|
| 1 | 🔴 Alta | Clientes - Lista | Agregar links a `/clientes/[id]` en cada item de la lista. |
| 2 | 🟡 Media | Órdenes - Nueva | En mobile, considerar mover el botón "Crear orden" al final del scroll en vez de fixed, o agregar padding bottom al formulario. |
| 3 | 🟡 Media | Dashboard (Mobile) | El indicador de timer ("N") se superpone ligeramente sobre "Órdenes Recientes". Considerar z-index o positioning. |
| 4 | 🟢 Baja | Órdenes - Lista | No hay paginación visible (11 órdenes). Cuando hayan más, sería útil. |
| 5 | 🟢 Baja | Clientes - Lista | 738 clientes renderizados de una vez. Podría causar problemas de performance. Considerar paginación o virtual scroll. |

### Lo que funciona perfecto ✅
- Login y autenticación
- Dashboard con stats y semáforos
- Kanban con drag & drop
- Filtros de órdenes
- Autocomplete de clientes en nueva orden
- Timer de trabajo con costo en vivo
- Portal de tracking público
- Responsive en general
- Settings con cálculos automáticos
