import { createServerClient } from "@/lib/supabase";
import type { EstadoOrden } from "@/types";

export interface OrdenListItem {
  id: string;
  numero_ot: number;
  falla_declarada: string;
  estado: EstadoOrden;
  es_urgente: boolean;
  fecha_ingreso: string;
  updated_at: string;
  presupuesto: number;
  tiempo_total_seg: number;
  equipo: {
    marca: string;
    modelo: string;
    tipo: string;
    cliente: {
      nombre: string;
      telefono: string;
    };
  } | null;
}

export interface OrdenesQueryResult {
  ordenes: OrdenListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OrdenesFilters {
  search?: string;
  estado?: string;
  urgente?: boolean;
  proceso?: boolean;
  desde?: string;
  hasta?: string;
  page?: number;
  pageSize?: number;
}

interface EquipoConCliente {
  id: string;
}

const MAX_CLIENTE_EQUIPOS = 100;

const ESTADOS_EN_PROCESO: EstadoOrden[] = [
  "en_diagnostico",
  "esperando_repuesto",
  "en_reparacion",
];

function sanitizeSearch(s: string): string {
  return s.replace(/[,()]/g, "").trim();
}

export async function fetchOrdenes(
  filters: OrdenesFilters = {}
): Promise<OrdenesQueryResult> {
  const supabase = await createServerClient();
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const search = filters.search ? sanitizeSearch(filters.search) : "";

  const ors: string[] = [];
  if (search.length > 0) {
    const num = /^\d+$/.test(search) ? Number(search) : null;
    if (num !== null) ors.push(`numero_ot.eq.${num}`);
    ors.push(`falla_declarada.ilike.%${search}%`);
    ors.push(`f_m.not.is.null`, `f_mo.not.is.null`);

    const { data: clientesMatch } = await supabase
      .from("equipos")
      .select("id, cliente:clientes!inner(nombre)")
      .ilike("cliente.nombre", `%${search}%`)
      .limit(MAX_CLIENTE_EQUIPOS);

    const equipoIds = ((clientesMatch ?? []) as EquipoConCliente[])
      .map((e) => e.id)
      .filter(Boolean);
    if (equipoIds.length > 0) {
      ors.push(`equipo_id.in.(${equipoIds.join(",")})`);
    }
  }

  let query = supabase
    .from("ordenes")
    .select(
      `
      id, numero_ot, falla_declarada, estado, es_urgente,
      fecha_ingreso, updated_at, presupuesto, tiempo_total_seg,
      equipo:equipos(
        marca, modelo, tipo,
        cliente:clientes(nombre, telefono)
      ),
      f_m:equipos(), f_mo:equipos()
    `,
      { count: "exact" }
    );

  if (search.length > 0) {
    query = query
      .ilike("f_m.marca", `%${search}%`)
      .ilike("f_mo.modelo", `%${search}%`)
      .or(ors.join(","));
  }

  if (filters.estado) {
    query = query.eq("estado", filters.estado as EstadoOrden);
  }

  if (filters.urgente) {
    query = query.eq("es_urgente", true);
  }

  if (filters.proceso) {
    query = query.in("estado", ESTADOS_EN_PROCESO);
  }

  if (filters.desde) {
    query = query.gte("fecha_ingreso", filters.desde);
  }

  if (filters.hasta) {
    query = query.lte("fecha_ingreso", filters.hasta);
  }

  query = query.order("updated_at", { ascending: false });
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching ordenes:", error);
    return { ordenes: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const ordenes = ((data ?? []) as unknown as OrdenListItem[]);
  const total = count ?? 0;

  return {
    ordenes,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}