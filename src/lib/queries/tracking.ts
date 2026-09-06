import { createServerClient } from "@/lib/supabase";

export interface OrdenPublica {
  id: string;
  numero_ot: number;
  estado: string;
  es_urgente: boolean;
  fecha_ingreso: string;
  fecha_promesa: string | null;
  fecha_entrega: string | null;
  falla_declarada: string;
  marca: string;
  modelo: string;
  tipo: string;
  cliente_nombre: string;
  cliente_telefono: string;
}

export interface HistorialPublicoItem {
  id: string;
  estado_anterior: string | null;
  estado_nuevo: string;
  nota_cliente: string;
  created_at: string;
}

export async function getOrdenPublicaByToken(
  token: string
): Promise<OrdenPublica | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .rpc("get_orden_publica_by_token", { p_token: token })
    .maybeSingle();
  if (error || !data) return null;
  return data as OrdenPublica;
}

export async function getHistorialPublicoByToken(
  token: string
): Promise<HistorialPublicoItem[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc(
    "get_historial_publico_by_orden",
    { p_token: token }
  );
  if (error) return [];
  return (data as HistorialPublicoItem[]) ?? [];
}
