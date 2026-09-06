import { createServerClient } from "@/lib/supabase";
import type { TiempoSesion, SesionActivaGlobal } from "@/types";

export async function getSesionActivaPorOrden(
  ordenId: string
): Promise<TiempoSesion | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("tiempo_sesiones")
    .select("*")
    .eq("orden_id", ordenId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as TiempoSesion | null) ?? null;
}

export async function getSesionesPorOrden(
  ordenId: string
): Promise<TiempoSesion[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("tiempo_sesiones")
    .select("*")
    .eq("orden_id", ordenId)
    .order("started_at", { ascending: false });
  return (data as TiempoSesion[]) ?? [];
}

export async function getSesionActivaGlobal(): Promise<SesionActivaGlobal | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("tiempo_sesiones")
    .select(
      `
      id,
      orden_id,
      started_at,
      ended_at,
      duracion_seg,
      notas,
      creado_por,
      created_at,
      orden:ordenes (
        id,
        numero_ot,
        equipo:equipos (
          id,
          marca,
          modelo,
          cliente:clientes (
            id,
            nombre
          )
        )
      )
    `
    )
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const row = data as unknown as Omit<SesionActivaGlobal, "sesion"> & {
    id: string;
    orden_id: string;
    started_at: string;
    ended_at: string | null;
    duracion_seg: number | null;
    notas: string | null;
    creado_por: string | null;
    created_at: string;
    orden: SesionActivaGlobal["orden"];
  };
  return {
    sesion: {
      id: row.id,
      orden_id: row.orden_id,
      started_at: row.started_at,
      ended_at: row.ended_at,
      duracion_seg: row.duracion_seg,
      notas: row.notas,
      creado_por: row.creado_por,
      created_at: row.created_at,
    },
    orden: row.orden,
  };
}

/**
 * Enriquece una orden con sus sesiones y sesión activa.
 * Útil cuando ya tenés la orden cargada y querés agregar info de tiempo.
 */
export async function attachTiempoToOrden<
  T extends { id: string; tiempo_total_seg: number }
>(orden: T): Promise<T & { sesiones: TiempoSesion[]; sesion_activa: TiempoSesion | null }> {
  const [sesiones, sesionActiva] = await Promise.all([
    getSesionesPorOrden(orden.id),
    getSesionActivaPorOrden(orden.id),
  ]);
  return {
    ...orden,
    sesiones,
    sesion_activa: sesionActiva,
  };
}

/**
 * Helper para hidratar múltiples órdenes con su sesión activa.
 * Más eficiente que llamar attachTiempoToOrden en loop.
 */
export async function getSesionesActivasPorOrdenes(
  ordenIds: string[]
): Promise<Map<string, TiempoSesion>> {
  if (ordenIds.length === 0) return new Map();
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("tiempo_sesiones")
    .select("*")
    .in("orden_id", ordenIds)
    .is("ended_at", null);
  const map = new Map<string, TiempoSesion>();
  for (const s of (data as TiempoSesion[]) ?? []) {
    map.set(s.orden_id, s);
  }
  return map;
}
