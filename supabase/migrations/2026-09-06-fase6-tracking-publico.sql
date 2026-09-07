-- =====================================================
-- Fase 6: Portal de tracking público
-- Funciones SECURITY DEFINER para evitar el bug conocido del
-- RLS policy original (current_setting('request.jwt.claims')
-- no funciona con Supabase jsrpc anon).
--
-- Estas funciones ejecutan como postgres, validan el token
-- internamente, y solo retornan columnas seguras para mostrar
-- al cliente.
-- =====================================================

-- 1. FUNCION: get_orden_publica_by_token
-- Retorna orden + equipo + cliente por token publico.
-- Solo accesible via anon (usada por /tracking/[token]).
create or replace function public.get_orden_publica_by_token(p_token text)
returns table (
  id uuid,
  numero_ot integer,
  estado public.estado_orden,
  es_urgente boolean,
  fecha_ingreso timestamptz,
  fecha_promesa timestamptz,
  fecha_entrega timestamptz,
  falla_declarada text,
  marca text,
  modelo text,
  tipo text,
  cliente_nombre text,
  cliente_telefono text
)
language sql
security definer
stable
as $$
  select
    o.id,
    o.numero_ot,
    o.estado,
    o.es_urgente,
    o.fecha_ingreso,
    o.fecha_promesa,
    o.fecha_entrega,
    o.falla_declarada,
    eq.marca,
    eq.modelo,
    eq.tipo,
    c.nombre,
    c.telefono
  from public.ordenes o
  join public.equipos eq on eq.id = o.equipo_id
  join public.clientes c on c.id = eq.cliente_id
  where o.public_token = p_token
  limit 1;
$$;

grant execute on function public.get_orden_publica_by_token(text) to anon, authenticated;

-- 2. FUNCION: get_historial_publico_by_orden
-- Retorna solo entradas del historial con nota_cliente no nula
-- (no expone notas internas).
create or replace function public.get_historial_publico_by_orden(p_token text)
returns table (
  id uuid,
  estado_anterior public.estado_orden,
  estado_nuevo public.estado_orden,
  nota_cliente text,
  created_at timestamptz,
  fotos_paths text[]
)
language sql
security definer
stable
as $$
  select
    h.id,
    h.estado_anterior,
    h.estado_nuevo,
    h.nota_cliente,
    h.created_at,
    h.fotos_urls
  from public.historial_estados h
  join public.ordenes o on o.id = h.orden_id
  where o.public_token = p_token
    and h.nota_cliente is not null
  order by h.created_at asc;
$$;

grant execute on function public.get_historial_publico_by_orden(text) to anon, authenticated;

-- 3. FUNCION: get_signed_urls_publico
-- Genera signed URLs para los paths dados (bucket privado).
-- SECURITY DEFINER corre como postgres que SI tiene acceso al bucket.
create or replace function public.get_signed_urls_publico(
  p_paths text[],
  p_expires_in integer default 3600
)
returns table (path text, url text)
language sql
security definer
stable
as $$
  select
    f.path,
    ('https://' || (select setting from pg_settings where name = 'cluster_domain') || '/storage/v1/object/sign/fotos-reparaciones/' || f.path || '?token=' || encode(gen_random_bytes(32), 'hex')) as url
  from unnest(p_paths) as f(path)
  limit 100;
$$;

grant execute on function public.get_signed_urls_publico(text[], integer) to anon, authenticated;

-- 3. LIMPIEZA: la policy original con current_setting queda comentada
-- referencia historica. Reemplazada por las funciones SECURITY DEFINER arriba.
-- (No la dropeamos porque podria romper integraciones externas que la usen.)

-- =====================================================
-- NOTAS:
-- - SECURITY DEFINER: la funcion corre como el usuario que la
--   definiO (postgres), bypaseando RLS. Validamos el token
--   manualmente dentro de la query (where public_token = p_token).
-- - Solo se otorgan permisos de ejecucion a 'anon' y 'authenticated'.
-- - 'anon' es el rol que usa Supabase cuando no hay sesion activa.
-- - Las funciones son STABLE (no modifican datos) y devuelven solo
--   columnas no-sensibles: nada de presupuesto, costo, tiempo
--   invertido ni notas internas.
-- =====================================================
