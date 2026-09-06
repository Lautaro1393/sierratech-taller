-- =====================================================
-- Fase 7: Control de tiempo y viabilidad
-- Tablas: app_settings, tiempo_sesiones
-- Campos: ordenes.tiempo_total_seg
-- Trigger: mantiene tiempo_total_seg sincronizado
-- =====================================================

-- 1. SETTINGS GLOBALES DEL TALLER (key/value)
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

insert into public.app_settings (key, value)
values ('tarifa_horaria_ars', '5000'::jsonb)
on conflict (key) do nothing;

-- 2. SESIONES DE TRABAJO (una fila por start/pause)
create table if not exists public.tiempo_sesiones (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null references public.ordenes(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duracion_seg integer generated always as (
    case
      when ended_at is null then null
      else extract(epoch from (ended_at - started_at))::int
    end
  ) stored,
  notas text,
  creado_por uuid references auth.users(id),
  created_at timestamptz default now(),
  constraint chk_ended_after_started check (ended_at is null or ended_at >= started_at)
);

-- Índice para queries por orden
create index if not exists idx_tiempo_sesiones_orden
  on public.tiempo_sesiones(orden_id);

-- Índice parcial: optimiza la query "sesión activa" (ended_at IS NULL)
-- Al ser parcial, es mucho más chico que un índice completo.
create index if not exists idx_tiempo_sesiones_activas
  on public.tiempo_sesiones(orden_id)
  where ended_at is null;

-- 3. CAMPO ACUMULATIVO EN ORDENES (para queries rápidas sin JOIN)
alter table public.ordenes
  add column if not exists tiempo_total_seg integer not null default 0;

-- 4. TRIGGER: mantiene tiempo_total_seg sincronizado
create or replace function public.recalcular_tiempo_total()
returns trigger as $$
declare
  orden_id_target uuid;
  total integer;
begin
  orden_id_target := coalesce(new.orden_id, old.orden_id);
  select coalesce(sum(duracion_seg), 0) into total
  from public.tiempo_sesiones
  where orden_id = orden_id_target
    and ended_at is not null;
  update public.ordenes
  set tiempo_total_seg = total
  where id = orden_id_target;
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_recalcular_tiempo on public.tiempo_sesiones;
create trigger trg_recalcular_tiempo
  after insert or update or delete on public.tiempo_sesiones
  for each row execute function public.recalcular_tiempo_total();

-- 5. RLS
alter table public.tiempo_sesiones enable row level security;
alter table public.app_settings enable row level security;

create policy "auth select tiempo_sesiones"
  on public.tiempo_sesiones for select
  to authenticated using (true);

create policy "auth insert tiempo_sesiones"
  on public.tiempo_sesiones for insert
  to authenticated with check (true);

create policy "auth update tiempo_sesiones"
  on public.tiempo_sesiones for update
  to authenticated using (true);

create policy "auth delete tiempo_sesiones"
  on public.tiempo_sesiones for delete
  to authenticated using (true);

create policy "auth select app_settings"
  on public.app_settings for select
  to authenticated using (true);

create policy "auth update app_settings"
  on public.app_settings for update
  to authenticated using (true);

create policy "auth insert app_settings"
  on public.app_settings for insert
  to authenticated with check (true);

-- =====================================================
-- NOTAS:
-- - Solo puede haber UNA sesion activa (ended_at IS NULL) por orden,
--   validado en server action (no en DB para no romper inserciones masivas).
-- - El trigger NO actualiza tiempo_total_seg cuando hay una sesion activa
--   (ended_at IS NULL → duracion_seg es NULL → no se suma al total).
-- - Si necesitas "tiempo incluyendo sesion activa", calcular en runtime
--   con: tiempo_total_seg + extract(epoch from (now() - started_at))::int
-- =====================================================
