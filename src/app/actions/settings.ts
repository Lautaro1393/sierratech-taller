"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";
import { DEFAULT_CONFIG } from "@/lib/pricing/viability";
import {
  DEFAULT_COSTO_FIJO_MENSUAL_ARS,
  DEFAULT_SHORTCUTS,
  DEFAULT_WHATSAPP_TALLER,
  type ConfiguracionGeneral,
  type Shortcuts,
  type ViabilityConfig,
} from "@/types";

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

const GENERAL_KEYS = {
  costoFijoMensualArs: "costo_fijo_mensual_ars",
  whatsappTaller: "whatsapp_taller",
  shortcuts: "shortcuts",
} as const;

function coerceString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function coerceShortcuts(value: unknown): Shortcuts {
  const raw = value && typeof value === "object" ? (value as Partial<Shortcuts>) : {};
  return {
    palette:
      typeof raw.palette === "string" && raw.palette.trim()
        ? raw.palette.trim()
        : DEFAULT_SHORTCUTS.palette,
    nuevaOrden:
      typeof raw.nuevaOrden === "string" && raw.nuevaOrden.trim()
        ? raw.nuevaOrden.trim()
        : DEFAULT_SHORTCUTS.nuevaOrden,
  };
}

export async function obtenerConfiguracionGeneral(): Promise<ConfiguracionGeneral> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", Object.values(GENERAL_KEYS));

  const map = new Map<string, unknown>();
  for (const row of data ?? []) {
    map.set(row.key as string, row.value);
  }

  return {
    costoFijoMensualArs: coerceNumber(
      map.get(GENERAL_KEYS.costoFijoMensualArs),
      DEFAULT_COSTO_FIJO_MENSUAL_ARS
    ),
    whatsappTaller: coerceString(
      map.get(GENERAL_KEYS.whatsappTaller),
      DEFAULT_WHATSAPP_TALLER
    ),
    shortcuts: coerceShortcuts(map.get(GENERAL_KEYS.shortcuts)),
  };
}

function normalizarWhatsapp(valor: string): string {
  return valor.replace(/\D/g, "");
}

const configuracionGeneralSchema = z.object({
  costoFijoMensualArs: z.number().positive("El costo fijo debe ser mayor a 0"),
  whatsappTaller: z
    .string()
    .min(1, "Ingresá el número de WhatsApp del taller"),
  shortcuts: z.object({
    palette: z
      .string()
      .min(1, "Completá el atajo del buscador")
      .max(30, "Atajo demasiado largo"),
    nuevaOrden: z
      .string()
      .min(1, "Completá el atajo de nueva orden")
      .max(30, "Atajo demasiado largo"),
  }),
});

export async function actualizarConfiguracionGeneral(
  config: ConfiguracionGeneral
): Promise<ActionResult<{ config: ConfiguracionGeneral }>> {
  const parsed = configuracionGeneralSchema.safeParse(config);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Configuración inválida",
    };
  }

  if (parsed.data.shortcuts.palette === parsed.data.shortcuts.nuevaOrden) {
    return {
      ok: false,
      error: "El atajo del buscador y el de nueva orden no pueden ser el mismo",
    };
  }

  const whatsappTaller = normalizarWhatsapp(parsed.data.whatsappTaller);
  if (whatsappTaller.length < 8) {
    return {
      ok: false,
      error: "El número de WhatsApp parece incompleto (mínimo 8 dígitos)",
    };
  }

  const supabase = await createServerClient();
  const now = new Date().toISOString();
  const rows = [
    { key: GENERAL_KEYS.costoFijoMensualArs, value: parsed.data.costoFijoMensualArs },
    { key: GENERAL_KEYS.whatsappTaller, value: whatsappTaller },
    { key: GENERAL_KEYS.shortcuts, value: parsed.data.shortcuts },
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

  const saved: ConfiguracionGeneral = {
    ...parsed.data,
    whatsappTaller,
  };

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  revalidatePath("/tracking", "layout");
  return { ok: true, data: { config: saved } };
}
