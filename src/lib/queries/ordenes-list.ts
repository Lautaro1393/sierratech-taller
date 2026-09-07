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
  desde?: string;
  hasta?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchOrdenes(
  filters: OrdenesFilters = {}
): Promise<OrdenesQueryResult> {
  const supabase = await createServerClient();
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("ordenes")
    .select(
      `
      id, numero_ot, falla_declarada, estado, es_urgente,
      fecha_ingreso, updated_at, presupuesto, tiempo_total_seg,
      equipo:equipos(
        marca, modelo, tipo,
        cliente:clientes(nombre, telefono)
      )
    `,
      { count: "exact" }
    );

  if (filters.search) {
    const safe = filters.search.replace(/[,()]/g, "");
    const s = `%${safe}%`;
    const num = Number(safe);
    if (!isNaN(num) && num > 0) {
      query = query.or(
        `numero_ot.eq.${num},falla_declarada.ilike.${s}`,
      );
    } else {
      query = query.ilike("falla_declarada", s);
    }
  }

  if (filters.estado) {
    query = query.eq("estado", filters.estado as EstadoOrden);
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
