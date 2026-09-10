"use server";

import { z } from "zod";
import { createServerClient } from "@/lib/supabase";

export interface QuickOrden {
  id: string;
  numero_ot: number;
  estado: string;
  es_urgente: boolean;
  marca: string;
  modelo: string;
  cliente_nombre: string | null;
}

interface EquipoConCliente {
  id: string;
  cliente: { nombre: string } | null;
}

const querySchema = z
  .string()
  .trim()
  .max(60, "Búsqueda demasiado larga");

const MAX_CLIENTE_EQUIPOS = 50;

function sanitizeQuery(q: string): string {
  return q.replace(/[,()]/g, "").trim();
}

export async function buscarOrdenesQuick(raw: string): Promise<QuickOrden[]> {
  const parsed = querySchema.safeParse(raw ?? "");
  if (!parsed.success) return [];

  const q = sanitizeQuery(parsed.data);
  if (parsed.data.length > 0 && q.length === 0) return [];

  const supabase = await createServerClient();

  const ors: string[] = [];
  if (q.length > 0) {
    const num = /^\d+$/.test(q) ? Number(q) : null;
    if (num !== null) ors.push(`numero_ot.eq.${num}`);
    ors.push(`falla_declarada.ilike.%${q}%`);
    ors.push(`f_m.not.is.null`, `f_mo.not.is.null`);

    const { data: clientesMatch } = await supabase
      .from("equipos")
      .select("id, cliente:clientes!inner(nombre)")
      .ilike("cliente.nombre", `%${q}%`)
      .limit(MAX_CLIENTE_EQUIPOS);

    const equipoIds = ((clientesMatch ?? []) as unknown as EquipoConCliente[])
      .map((e) => e.id)
      .filter(Boolean);
    if (equipoIds.length > 0) {
      ors.push(`equipo_id.in.(${equipoIds.join(",")})`);
    }
  }

  let query = supabase
    .from("ordenes")
    .select(
      "id, numero_ot, estado, es_urgente, falla_declarada, " +
        "equipo:equipos(marca, modelo, cliente:clientes(nombre)), " +
        "f_m:equipos(), f_mo:equipos()"
    )
    .order("updated_at", { ascending: false })
    .limit(8);

  if (q.length > 0) {
    query = query
      .ilike("f_m.marca", `%${q}%`)
      .ilike("f_mo.modelo", `%${q}%`)
      .or(ors.join(","));
  }

  const { data, error } = await query;
  if (error) return [];

  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map((row) => {
    const equipo = (row.equipo ?? {}) as Record<string, unknown>;
    const cliente = (equipo.cliente ?? {}) as Record<string, unknown>;
    return {
      id: String(row.id ?? ""),
      numero_ot: Number(row.numero_ot ?? 0),
      estado: String(row.estado ?? ""),
      es_urgente: Boolean(row.es_urgente),
      marca: String(equipo.marca ?? ""),
      modelo: String(equipo.modelo ?? ""),
      cliente_nombre: typeof cliente.nombre === "string" ? cliente.nombre : null,
    };
  });
}