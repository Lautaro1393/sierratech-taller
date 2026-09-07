import { createServerClient } from "@/lib/supabase";

export interface MarcasModelosUnicos {
  marcas: string[];
  modelos: string[];
  tipos: string[];
}

const TIPOS_CONOCIDOS = new Set([
  "notebook",
  "smartphone",
  "tablet",
  "monitor",
]);

/**
 * Devuelve los valores unicos de marca, modelo y tipo
 * ya cargados en la tabla equipos, para usar como
 * sugerencias en autocomplete del form de nueva orden.
 */
export async function getMarcasModelosUnicos(): Promise<MarcasModelosUnicos> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("equipos")
    .select("marca, modelo, tipo")
    .limit(500);

  const marcas = new Set<string>();
  const modelos = new Set<string>();
  const tiposCustom = new Set<string>();

  for (const e of data ?? []) {
    if (e.marca) marcas.add(e.marca);
    if (e.modelo) modelos.add(e.modelo);
    if (e.tipo && !TIPOS_CONOCIDOS.has(e.tipo)) tiposCustom.add(e.tipo);
  }

  return {
    marcas: Array.from(marcas).sort((a, b) => a.localeCompare(b)),
    modelos: Array.from(modelos).sort((a, b) => a.localeCompare(b)),
    tipos: Array.from(tiposCustom).sort((a, b) => a.localeCompare(b)),
  };
}
