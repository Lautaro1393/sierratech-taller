"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";

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
      value: JSON.stringify(parsed.data),
      updated_at: new Date().toISOString(),
    })
    .eq("key", TARIFA_KEY);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/ordenes", "layout");
  return { ok: true, data: { tarifa: parsed.data } };
}
