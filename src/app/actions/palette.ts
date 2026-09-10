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

const querySchema = z
  .string()
  .trim()
  .max(60, "Búsqueda demasiado larga");

export async function buscarOrdenesQuick(raw: string): Promise<QuickOrden[]> {
  const parsed = querySchema.safeParse(raw ?? "");
  if (!parsed.success) return [];

  const q = parsed.data;
  const supabase = await createServerClient();

  let query = supabase
    .from("ordenes")
    .select(
      "id, numero_ot, estado, es_urgente, falla_declarada, equipo:equipos(marca, modelo, cliente:clientes(nombre))"
    )
    .order("numero_ot", { ascending: false })
    .limit(8);

  if (q.length > 0) {
    const value = q.replace(/[,()]/g, "").trim();
    if (!value) return [];
    const ors: string[] = [`falla_declarada.ilike.%${value}%`];
    const num = /^\d+$/.test(value) ? Number(value) : null;
    if (num !== null) ors.unshift(`numero_ot.eq.${num}`);
    query = query.or(ors.join(","));
  }

  const { data, error } = await query;
  if (error) return [];

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
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