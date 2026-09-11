import { createServerClient } from "@/lib/supabase";
import type { Cliente, Equipo, Orden } from "@/types";

export interface ClienteListItem {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  created_at: string;
  cantidad_equipos: number;
}

export interface ClienteDetalle {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  created_at: string;
  equipos: ClienteEquipo[];
}

export interface ClienteEquipo {
  id: string;
  tipo: string;
  marca: string;
  modelo: string;
  numero_serie: string | null;
  created_at: string;
  ordenes: Pick<Orden, "id" | "numero_ot" | "falla_declarada" | "estado" | "es_urgente" | "fecha_ingreso" | "updated_at">[];
}

export interface ClientesQueryResult {
  clientes: ClienteListItem[];
  total: number;
  conEmail: number;
}

function sanitizeSearch(s: string): string {
  return s.replace(/[,()]/g, "").trim();
}

export async function fetchClientes(search?: string): Promise<ClientesQueryResult> {
  const supabase = await createServerClient();
  const q = search ? sanitizeSearch(search) : "";

  let query = supabase
    .from("clientes")
    .select("id, nombre, telefono, email, created_at")
    .order("nombre", { ascending: true });

  if (q.length > 0) {
    query = query.or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching clientes:", error);
    return { clientes: [], total: 0, conEmail: 0 };
  }

  const clientes = (data ?? []) as Array<
    Pick<Cliente, "id" | "nombre" | "telefono" | "email"> & { created_at: string }
  >;

  return {
    clientes: clientes.map((c) => ({ ...c, cantidad_equipos: 0 })),
    total: clientes.length,
    conEmail: clientes.filter((c) => c.email).length,
  };
}

export async function fetchClienteDetalle(id: string): Promise<ClienteDetalle | null> {
  const supabase = await createServerClient();

  const { data: cliente, error: clienteError } = await supabase
    .from("clientes")
    .select("id, nombre, telefono, email, created_at")
    .eq("id", id)
    .single();

  if (clienteError || !cliente) {
    console.error("Error fetching cliente:", clienteError);
    return null;
  }

  const { data: equiposData } = await supabase
    .from("equipos")
    .select("id, tipo, marca, modelo, numero_serie, created_at")
    .eq("cliente_id", id)
    .order("created_at", { ascending: false });

  const equiposList = (equiposData ?? []) as Array<
    Pick<Equipo, "id" | "tipo" | "marca" | "modelo" | "numero_serie" | "created_at">
  >;

  if (equiposList.length === 0) {
    return { ...cliente, equipos: [] };
  }

  const equipoIds = equiposList.map((e) => e.id);

  const { data: ordenesData } = await supabase
    .from("ordenes")
    .select("id, numero_ot, falla_declarada, estado, es_urgente, fecha_ingreso, updated_at, equipo_id")
    .in("equipo_id", equipoIds)
    .order("fecha_ingreso", { ascending: false });

  const ordenesList = (ordenesData ?? []) as Array<
    Pick<Orden, "id" | "numero_ot" | "falla_declarada" | "estado" | "es_urgente" | "fecha_ingreso" | "updated_at"> & { equipo_id: string }
  >;

  const ordenesPorEquipo = new Map<string, typeof ordenesList>();
  for (const o of ordenesList) {
    const arr = ordenesPorEquipo.get(o.equipo_id) ?? [];
    arr.push(o);
    ordenesPorEquipo.set(o.equipo_id, arr);
  }

  const equipos: ClienteEquipo[] = equiposList.map((e) => ({
    id: e.id,
    tipo: e.tipo,
    marca: e.marca,
    modelo: e.modelo,
    numero_serie: e.numero_serie,
    created_at: e.created_at,
    ordenes: (ordenesPorEquipo.get(e.id) ?? []).map((o) => ({
      id: o.id,
      numero_ot: o.numero_ot,
      falla_declarada: o.falla_declarada,
      estado: o.estado,
      es_urgente: o.es_urgente,
      fecha_ingreso: o.fecha_ingreso,
      updated_at: o.updated_at,
    })),
  }));

  return { ...cliente, equipos };
}
