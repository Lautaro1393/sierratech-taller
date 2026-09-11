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
 * La deduplicacion es case-insensitive para que "Notebook"
 * no aparezca dos veces cuando en la DB hay variantes de
 * mayuscula/minuscula del mismo tipo base.
 */
export async function getMarcasModelosUnicos(): Promise<MarcasModelosUnicos> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("equipos")
    .select("marca, modelo, tipo")
    .limit(500);

  const marcas = new Map<string, string>();
  const modelos = new Map<string, string>();
  const tiposCustom = new Map<string, string>();

  for (const e of data ?? []) {
    if (e.marca) {
      const key = e.marca.trim().toLowerCase();
      if (!marcas.has(key)) marcas.set(key, e.marca.trim());
    }
    if (e.modelo) {
      const key = e.modelo.trim().toLowerCase();
      if (!modelos.has(key)) modelos.set(key, e.modelo.trim());
    }
    const tipo = (e.tipo ?? "").trim();
    const tipoKey = tipo.toLowerCase();
    if (tipo && !TIPOS_CONOCIDOS.has(tipoKey) && !tiposCustom.has(tipoKey)) {
      tiposCustom.set(tipoKey, tipo);
    }
  }

  return {
    marcas: Array.from(marcas.values()).sort((a, b) => a.localeCompare(b)),
    modelos: Array.from(modelos.values()).sort((a, b) => a.localeCompare(b)),
    tipos: Array.from(tiposCustom.values()).sort((a, b) => a.localeCompare(b)),
  };
}
