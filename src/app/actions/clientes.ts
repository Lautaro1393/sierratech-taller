"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";
import {
  parseContactFile,
  type ContactoImportado,
} from "@/lib/parsers/contact-import";

const importSchema = z.object({
  contactos: z
    .array(
      z.object({
        nombre: z.string().min(1).max(100),
        telefono: z.string().min(6).max(20),
        email: z.string().email().nullable().optional(),
      })
    )
    .min(1, "Sin contactos para importar")
    .max(2000, "Maximo 2000 contactos por importacion"),
});

type ImportResult =
  | {
      ok: true;
      inserted: number;
      skipped: number;
      invalid: number;
      total: number;
    }
  | { ok: false; error: string };

export async function importarContactos(
  rawContactos: ContactoImportado[]
): Promise<ImportResult> {
  const parsed = importSchema.safeParse({
    contactos: rawContactos.map((c) => ({
      nombre: c.nombre,
      telefono: c.telefono,
      email: c.email,
    })),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const supabase = await createServerClient();

  // Deduplicar: buscar telefonos que ya existen en la DB
  const telefonosUnicos = Array.from(
    new Set(parsed.data.contactos.map((c) => c.telefono))
  );

  const { data: existentes } = await supabase
    .from("clientes")
    .select("telefono")
    .in("telefono", telefonosUnicos);

  const telefonosExistentes = new Set(
    (existentes ?? []).map((c) => c.telefono as string)
  );

  // Filtrar y deduplicar dentro del batch
  const aInsertar = new Map<string, { nombre: string; telefono: string; email: string | null }>();
  for (const c of parsed.data.contactos) {
    if (telefonosExistentes.has(c.telefono)) continue;
    // Dedupe en el batch: gana el primero
    if (!aInsertar.has(c.telefono)) {
      aInsertar.set(c.telefono, {
        nombre: c.nombre,
        telefono: c.telefono,
        email: c.email ?? null,
      });
    }
  }

  const toInsert = Array.from(aInsertar.values());
  const skipped = parsed.data.contactos.length - toInsert.length;

  if (toInsert.length === 0) {
    revalidatePath("/clientes");
    return {
      ok: true,
      inserted: 0,
      skipped,
      invalid: 0,
      total: parsed.data.contactos.length,
    };
  }

  // Insertar en chunks de 100 (limite de Supabase)
  const CHUNK = 100;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK);
    const { error } = await supabase.from("clientes").insert(chunk);
    if (error) {
      // Si falla un chunk, reportamos lo que se inserto hasta el momento
      return {
        ok: false,
        error: `Error insertando chunk ${i / CHUNK + 1}: ${error.message}`,
      };
    }
    inserted += chunk.length;
  }

  revalidatePath("/clientes");
  return {
    ok: true,
    inserted,
    skipped,
    invalid: 0,
    total: parsed.data.contactos.length,
  };
}

/**
 * Wrapper para que el componente client pueda pasar el texto
 * del archivo sin tener que parsear en el browser.
 */
export async function importarContactosDesdeTexto(
  text: string
): Promise<ImportResult> {
  const contactos = parseContactFile(text);
  if (contactos.length === 0) {
    return {
      ok: false,
      error:
        "No se encontraron contactos validos. Verifica que el archivo sea VCF o CSV con telefonos.",
    };
  }
  return importarContactos(contactos);
}
