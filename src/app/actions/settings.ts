"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";
import { DEFAULT_CONFIG } from "@/lib/pricing/viability";
import type { ViabilityConfig } from "@/types";

const TARIFA_KEY = "tarifa_horaria_ars";

const tarifaSchema = z.number().positive("La tarifa debe ser mayor a 0").finite();

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function obtenerTarifaHoraria(): Promise<number> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", TARIFA_KEY)
    .maybeSingle();

  if (!data) return 5000;
  const raw = data.value as unknown;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 5000;
}

export async function actualizarTarifaHoraria(
  valor: number
): Promise<ActionResult<{ tarifa: number }>> {
  const parsed = tarifaSchema.safeParse(valor);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Tarifa inválida" };
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      value: parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq("key", TARIFA_KEY);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/ordenes", "layout");
  return { ok: true, data: { tarifa: parsed.data } };
}

const PRICING_KEYS = {
  costoHoraPisoArs: "costo_hora_piso_ars",
  tarifaHoraEstandarArs: "tarifa_hora_estandar_ars",
  tarifaHoraMicroArs: "tarifa_hora_micro_ars",
  umbralAmarilloPct: "umbral_alerta_amarilla_pct",
  umbralRojoPct: "umbral_alerta_roja_pct",
} as const;

function coerceNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export async function obtenerConfiguracionPricing(): Promise<ViabilityConfig> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", Object.values(PRICING_KEYS));

  const map = new Map<string, unknown>();
  for (const row of data ?? []) {
    map.set(row.key as string, row.value);
  }

  return {
    costoHoraPisoArs: coerceNumber(map.get(PRICING_KEYS.costoHoraPisoArs), DEFAULT_CONFIG.costoHoraPisoArs),
    tarifaHoraEstandarArs: coerceNumber(map.get(PRICING_KEYS.tarifaHoraEstandarArs), DEFAULT_CONFIG.tarifaHoraEstandarArs),
    tarifaHoraMicroArs: coerceNumber(map.get(PRICING_KEYS.tarifaHoraMicroArs), DEFAULT_CONFIG.tarifaHoraMicroArs),
    umbralAmarilloPct: coerceNumber(map.get(PRICING_KEYS.umbralAmarilloPct), DEFAULT_CONFIG.umbralAmarilloPct),
    umbralRojoPct: coerceNumber(map.get(PRICING_KEYS.umbralRojoPct), DEFAULT_CONFIG.umbralRojoPct),
  };
}

const pricingSchema = z.object({
  costoHoraPisoArs: z.number().positive("Debe ser mayor a 0"),
  tarifaHoraEstandarArs: z.number().positive("Debe ser mayor a 0"),
  tarifaHoraMicroArs: z.number().positive("Debe ser mayor a 0"),
  umbralAmarilloPct: z
    .number()
    .min(0, "Mínimo 0")
    .max(1, "Máximo 1 (100%)"),
  umbralRojoPct: z
    .number()
    .min(0, "Mínimo 0")
    .max(1.5, "Máximo 1.5 (150%)"),
});

export async function actualizarConfiguracionPricing(
  config: ViabilityConfig
): Promise<ActionResult<{ config: ViabilityConfig }>> {
  const parsed = pricingSchema.safeParse(config);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Configuración inválida",
    };
  }

  const supabase = await createServerClient();
  const now = new Date().toISOString();
  const rows = [
    { key: PRICING_KEYS.costoHoraPisoArs, value: parsed.data.costoHoraPisoArs },
    { key: PRICING_KEYS.tarifaHoraEstandarArs, value: parsed.data.tarifaHoraEstandarArs },
    { key: PRICING_KEYS.tarifaHoraMicroArs, value: parsed.data.tarifaHoraMicroArs },
    { key: PRICING_KEYS.umbralAmarilloPct, value: parsed.data.umbralAmarilloPct },
    { key: PRICING_KEYS.umbralRojoPct, value: parsed.data.umbralRojoPct },
  ];

  for (const row of rows) {
    const { error } = await supabase
      .from("app_settings")
      .upsert(
        { key: row.key, value: row.value, updated_at: now },
        { onConflict: "key" }
      );
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true, data: { config: parsed.data } };
}
