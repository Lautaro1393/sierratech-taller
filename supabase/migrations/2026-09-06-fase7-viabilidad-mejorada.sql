-- =====================================================
-- Fase 7.5: Viabilidad financiera mejorada
-- Separa costo de tarifa, agrega tipo de intervencion,
-- separa MO de repuestos, umbrales configurables.
-- =====================================================

-- 1. SETTINGS ADICIONALES DE PRICING
insert into public.app_settings (key, value) values
  ('costo_hora_piso_ars', '17000'::jsonb),
  ('tarifa_hora_estandar_ars', '25000'::jsonb),
  ('tarifa_hora_micro_ars', '40000'::jsonb),
  ('umbral_alerta_amarilla_pct', '0.70'::jsonb),
  ('umbral_alerta_roja_pct', '1.00'::jsonb)
on conflict (key) do nothing;

-- 2. COLUMNAS NUEVAS EN ORDENES
alter table public.ordenes
  add column if not exists costo_repuestos_ars numeric(10, 2) not null default 0,
  add column if not exists tipo_intervencion text not null default 'estandar'
    check (tipo_intervencion in ('estandar', 'microscopio'));

-- 3. INDICE PARA FILTRAR POR TIPO DE INTERVENCION
create index if not exists idx_ordenes_tipo_intervencion
  on public.ordenes(tipo_intervencion);

-- =====================================================
-- NOTAS:
-- - costo_repuestos_ars: lo que se cobra por repuestos
--   separado del presupuesto total. La mano de obra
--   (MO) se calcula como presupuesto - costo_repuestos.
-- - tipo_intervencion: determina que tarifa se cobra
--   (estandar: $25k/h, microscopio: $40k/h).
-- - costo_hora_piso: lo que cuesta mantener el taller
--   abierto por hora ($17k = $1.7M / 100h).
-- - umbral_alerta_amarilla_pct: 0.70 = alerta al 70%.
-- - umbral_alerta_roja_pct: 1.00 = alerta al 100%
--   (costo acumulado >= presupuesto MO).
-- =====================================================
