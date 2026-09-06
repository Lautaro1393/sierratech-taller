"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase";
import { getSesionActivaPorOrden } from "@/lib/queries/tiempo";
import type { EstadoOrden, TiempoSesion } from "@/types";

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

const ESTADOS_BLOQUEADOS_PARA_TIMER: EstadoOrden[] = ["entregado", "cancelado"];

async function getOrdenEstado(ordenId: string): Promise<EstadoOrden | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("ordenes")
    .select("estado")
    .eq("id", ordenId)
    .single();
  return (data?.estado as EstadoOrden | undefined) ?? null;
}

/**
 * Inicia una nueva sesión de timer.
 * Falla si la orden está en entregado/cancelado o si ya hay sesión activa.
 */
export async function iniciarSesion(
  ordenId: string
): Promise<ActionResult<{ sesionId: string }>> {
  const estado = await getOrdenEstado(ordenId);
  if (!estado) return { ok: false, error: "Orden no encontrada" };
  if (ESTADOS_BLOQUEADOS_PARA_TIMER.includes(estado)) {
    return {
      ok: false,
      error: `No se puede iniciar timer en una orden ${estado}`,
    };
  }

  const activa = await getSesionActivaPorOrden(ordenId);
  if (activa) {
    return { ok: false, error: "Ya hay una sesión activa para esta orden" };
  }

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("tiempo_sesiones")
    .insert({
      orden_id: ordenId,
      notas: null,
      creado_por: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "No se pudo iniciar la sesión" };
  }

  revalidatePath(`/ordenes/${ordenId}`);
  revalidatePath("/kanban");
  revalidatePath("/");
  return { ok: true, data: { sesionId: data.id } };
}

/**
 * Pausa una sesión activa seteando ended_at = now().
 * La duración se calcula automáticamente vía columna generada.
 */
export async function pausarSesion(
  sesionId: string
): Promise<ActionResult> {
  const supabase = await createServerClient();
  const { data: sesion } = await supabase
    .from("tiempo_sesiones")
    .select("id, orden_id, ended_at")
    .eq("id", sesionId)
    .single();

  if (!sesion) return { ok: false, error: "Sesión no encontrada" };
  if (sesion.ended_at) return { ok: false, error: "La sesión ya está cerrada" };

  const { error } = await supabase
    .from("tiempo_sesiones")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", sesionId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/ordenes/${sesion.orden_id}`);
  revalidatePath("/kanban");
  revalidatePath("/");
  return { ok: true };
}

/**
 * Reanuda trabajo creando una nueva sesión (alias semántico de iniciarSesion).
 * Validaciones equivalentes.
 */
export async function reanudarSesion(
  ordenId: string
): Promise<ActionResult<{ sesionId: string }>> {
  return iniciarSesion(ordenId);
}

/**
 * Detiene una sesión (alias de pausar; semántica de cierre de jornada).
 */
export async function detenerSesion(sesionId: string): Promise<ActionResult> {
  return pausarSesion(sesionId);
}

/**
 * Edita las notas de una sesión (cerrada o activa).
 */
export async function editarNotaSesion(
  sesionId: string,
  notas: string | null
): Promise<ActionResult> {
  const supabase = await createServerClient();
  const { data: sesion } = await supabase
    .from("tiempo_sesiones")
    .select("id, orden_id")
    .eq("id", sesionId)
    .single();
  if (!sesion) return { ok: false, error: "Sesión no encontrada" };

  const { error } = await supabase
    .from("tiempo_sesiones")
    .update({ notas: notas?.trim() ? notas.trim() : null })
    .eq("id", sesionId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/ordenes/${sesion.orden_id}`);
  return { ok: true };
}

/**
 * Cierra forzosamente una sesión huérfana (olvidada abierta hace días).
 * Usado desde la UI cuando se detecta una sesión vieja.
 */
export async function cerrarSesionHuerfana(
  sesionId: string,
  motivo: string
): Promise<ActionResult> {
  const supabase = await createServerClient();
  const { data: sesion } = await supabase
    .from("tiempo_sesiones")
    .select("id, orden_id, ended_at, started_at")
    .eq("id", sesionId)
    .single();
  if (!sesion) return { ok: false, error: "Sesión no encontrada" };
  if (sesion.ended_at) return { ok: false, error: "La sesión ya está cerrada" };

  const { error } = await supabase
    .from("tiempo_sesiones")
    .update({
      ended_at: new Date().toISOString(),
      notas: `[Cierre forzado] ${motivo}`.trim(),
    })
    .eq("id", sesionId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/ordenes/${sesion.orden_id}`);
  revalidatePath("/kanban");
  return { ok: true };
}

/**
 * Helper interno: cierra sesión activa de una orden (auto-stop).
 * Usado por actualizarEstadoOrden cuando la orden pasa a entregado/cancelado.
 * @internal - no exportar en actions públicas
 */
export async function autoStopSesionActiva(
  ordenId: string,
  motivo: string
): Promise<void> {
  const activa = await getSesionActivaPorOrden(ordenId);
  if (!activa) return;
  const supabase = await createServerClient();
  await supabase
    .from("tiempo_sesiones")
    .update({
      ended_at: new Date().toISOString(),
      notas: `[Auto-stop] ${motivo}`.trim(),
    })
    .eq("id", activa.id);
}

/**
 * Server action pública: devuelve la sesión activa de una orden.
 * Usada por el Kanban para chequear si debe mostrar el PausePrompt.
 */
export async function getSesionActivaPorOrdenClient(
  ordenId: string
): Promise<TiempoSesion | null> {
  return getSesionActivaPorOrden(ordenId);
}
