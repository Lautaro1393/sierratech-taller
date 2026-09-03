"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import type { EstadoOrden } from "@/types";

export async function actualizarEstadoOrden(
  ordenId: string,
  nuevoEstado: EstadoOrden
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServerClient();

  const { data: ordenActual, error: fetchError } = await supabase
    .from("ordenes")
    .select("estado")
    .eq("id", ordenId)
    .single();

  if (fetchError || !ordenActual) {
    return { ok: false, error: fetchError?.message ?? "Orden no encontrada" };
  }

  if (ordenActual.estado === nuevoEstado) {
    return { ok: true };
  }

  const { error: updateError } = await supabase
    .from("ordenes")
    .update({ estado: nuevoEstado })
    .eq("id", ordenId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  await supabase.from("historial_estados").insert({
    orden_id: ordenId,
    estado_anterior: ordenActual.estado,
    estado_nuevo: nuevoEstado,
    nota_interna: null,
    nota_cliente: null,
    fotos_urls: null,
  });

  revalidatePath("/kanban");
  revalidatePath("/");
  return { ok: true };
}
