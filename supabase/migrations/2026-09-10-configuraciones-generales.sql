-- =====================================================
-- Configuraciones generales del taller
-- Nuevas keys en app_settings:
--   costo_fijo_mensual_ars : costo fijo mensual ($) para punto de equilibrio
--   whatsapp_taller        : numero de WhatsApp del taller (solo digitos, con pais)
--   shortcuts              : bindings de teclado del dashboard (JSON)
-- =====================================================

-- 1. SEED DE NUEVAS KEYS (on conflict: NO sobreescribe valores ya guardados)
insert into public.app_settings (key, value) values
  ('costo_fijo_mensual_ars', '1700000'::jsonb),
  ('whatsapp_taller', '"5491178267986"'::jsonb),
  ('shortcuts', '{"palette":"mod+k","nuevaOrden":"mod+n"}'::jsonb)
on conflict (key) do nothing;

-- 2. FUNCION PUBLICA: get_whatsapp_taller
-- Retorna el numero del taller sin exponer el resto de app_settings.
-- SECURITY DEFINER + grant a anon para el portal de tracking publico.
create or replace function public.get_whatsapp_taller()
returns text
language sql
security definer
stable
as $$
  select coalesce(
    (select value #>> '{}' from public.app_settings where key = 'whatsapp_taller'),
    '5491178267986'
  );
$$;

grant execute on function public.get_whatsapp_taller() to anon, authenticated;

-- =====================================================
-- NOTAS:
-- - El numero se guarda SIN '+'/' espacios, solo digitos con
--   codigo de pais, ej: '5491178267986' (Argentina movil).
-- - get_whatsapp_taller() es STABLE (no modifica datos) y solo
--   retorna el numero configurado, nunca otras settings.
-- =====================================================