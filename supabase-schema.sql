-- =====================================================
-- SierraTech Taller - Schema SQL para Supabase
-- Ejecutar este script en el SQL Editor de Supabase
-- =====================================================

-- 1. EXTENSIÓN PARA UUIDS
create extension if not exists "pgcrypto";

-- 2. ENUM DE ESTADOS (orden del Kanban)
create type estado_orden as enum (
    'ingresado',
    'en_diagnostico',
    'esperando_repuesto',
    'en_reparacion',
    'listo_para_retiro',
    'entregado',
    'cancelado'
);

-- 3. TABLA DE CLIENTES
create table if not exists public.clientes (
    id uuid primary key default gen_random_uuid(),
    nombre text not null,
    telefono text not null,
    email text,
    created_at timestamptz default now()
);

-- 4. TABLA DE EQUIPOS
create table if not exists public.equipos (
    id uuid primary key default gen_random_uuid(),
    cliente_id uuid not null references public.clientes(id) on delete cascade,
    tipo text not null,
    marca text not null,
    modelo text not null,
    numero_serie text,
    clave_desbloqueo text,
    accesorios text,
    created_at timestamptz default now()
);

-- 5. TABLA DE ÓRDENES DE SERVICIO
create table if not exists public.ordenes (
    id uuid primary key default gen_random_uuid(),
    numero_ot serial unique,
    public_token text unique default encode(gen_random_bytes(6), 'hex'),
    equipo_id uuid not null references public.equipos(id) on delete cascade,
    falla_declarada text not null,
    diagnostico text,
    presupuesto numeric(10, 2) default 0,
    presupuesto_aprobado boolean default false,
    estado public.estado_orden not null default 'ingresado',
    es_urgente boolean default false,
    fecha_ingreso timestamptz default now(),
    fecha_promesa timestamptz,
    fecha_entrega timestamptz,
    updated_at timestamptz default now()
);

-- 6. TABLA DE HISTORIAL DE ESTADOS
create table if not exists public.historial_estados (
    id uuid primary key default gen_random_uuid(),
    orden_id uuid not null references public.ordenes(id) on delete cascade,
    estado_anterior public.estado_orden,
    estado_nuevo public.estado_orden not null,
    nota_interna text,
    nota_cliente text,
    fotos_urls text[],
    created_at timestamptz default now()
);

-- 7. TRIGGER PARA ACTUALIZAR updated_at EN ÓRDENES
create or replace function public.actualizar_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_ordenes_updated on public.ordenes;
create trigger trigger_ordenes_updated
    before update on public.ordenes
    for each row execute function public.actualizar_updated_at();

-- 8. ÍNDICES PARA BÚSQUEDA RÁPIDA
create index if not exists idx_ordenes_estado on public.ordenes(estado);
create index if not exists idx_ordenes_token on public.ordenes(public_token);
create index if not exists idx_ordenes_updated on public.ordenes(updated_at);
create index if not exists idx_ordenes_fecha_ingreso on public.ordenes(fecha_ingreso);
create index if not exists idx_historial_orden_id on public.historial_estados(orden_id);
create index if not exists idx_historial_created on public.historial_estados(created_at);
create index if not exists idx_equipos_cliente_id on public.equipos(cliente_id);
create index if not exists idx_clientes_telefono on public.clientes(telefono);

-- 9. ROW LEVEL SECURITY (RLS)
alter table public.clientes enable row level security;
alter table public.equipos enable row level security;
alter table public.ordenes enable row level security;
alter table public.historial_estados enable row level security;

-- Policies: El usuario autenticado puede hacer todo
create policy "Usuarios autenticados pueden ver clientes"
    on public.clientes for select
    to authenticated
    using (true);

create policy "Usuarios autenticados pueden insertar clientes"
    on public.clientes for insert
    to authenticated
    with check (true);

create policy "Usuarios autenticados pueden actualizar clientes"
    on public.clientes for update
    to authenticated
    using (true);

create policy "Usuarios autenticados pueden eliminar clientes"
    on public.clientes for delete
    to authenticated
    using (true);

create policy "Usuarios autenticados pueden ver equipos"
    on public.equipos for select
    to authenticated
    using (true);

create policy "Usuarios autenticados pueden insertar equipos"
    on public.equipos for insert
    to authenticated
    with check (true);

create policy "Usuarios autenticados pueden actualizar equipos"
    on public.equipos for update
    to authenticated
    using (true);

create policy "Usuarios autenticados pueden eliminar equipos"
    on public.equipos for delete
    to authenticated
    using (true);

create policy "Usuarios autenticados pueden ver órdenes"
    on public.ordenes for select
    to authenticated
    using (true);

create policy "Usuarios autenticados pueden insertar órdenes"
    on public.ordenes for insert
    to authenticated
    with check (true);

create policy "Usuarios autenticados pueden actualizar órdenes"
    on public.ordenes for update
    to authenticated
    using (true);

create policy "Usuarios autenticados pueden eliminar órdenes"
    on public.ordenes for delete
    to authenticated
    using (true);

create policy "Usuarios autenticados pueden ver historial"
    on public.historial_estados for select
    to authenticated
    using (true);

create policy "Usuarios autenticados pueden insertar historial"
    on public.historial_estados for insert
    to authenticated
    with check (true);

-- Policy para portal público de tracking (sin auth)
create policy "Cualquiera puede ver órdenes por token público"
    on public.ordenes for select
    to public
    using (public_token = current_setting('request.jwt.claims', true)::json->>'public_token');

-- =====================================================
-- NOTAS PARA EL DESARROLLADOR:
-- =====================================================
-- 
-- 1. Crear bucket de Storage para fotos:
--    - Ir a Supabase Dashboard > Storage > New Bucket
--    - Nombre: "fotos"
--    - Public: true
--    - Agregar policy para upload autenticado
--
-- 2. Configurar Auth:
--    - Ir a Supabase Dashboard > Authentication > Providers
--    - Habilitar Email/Password
--    - Crear el primer usuario (el técnico)
--
-- 3. Variables de entorno necesarias:
--    NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon
--
-- 4. Para obtener las credenciales:
--    - Supabase Dashboard > Settings > API
--    - Project URL = NEXT_PUBLIC_SUPABASE_URL
--    - anon/public key = NEXT_PUBLIC_SUPABASE_ANON_KEY
-- =====================================================
