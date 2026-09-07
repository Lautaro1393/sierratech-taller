import "server-only";
import { createServerClient } from "@/lib/supabase";
import { createAdminClient } from "@/lib/supabase/server-admin";
import { optimizarFotoParaUpload } from "@/lib/utils/compress-image";

const BUCKET = "fotos-reparaciones";

/**
 * Sube una foto a Storage despues de comprimirla en cliente.
 * Usa el server client que lee las cookies del user autenticado.
 * Devuelve el PATH (no URL) para guardar en historial_estados.fotos_urls.
 */
export async function uploadFotoReparacion(
  ordenId: string,
  file: File
): Promise<string> {
  const compressed = await optimizarFotoParaUpload(file);
  const fileName = `${ordenId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.webp`;

  const supabase = await createServerClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, compressed, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) throw error;
  return data.path;
}

/**
 * Genera signed URLs (1h expiracion) para los paths dados.
 * Usado en server components que renderizan la galeria para el tecnico autenticado.
 */
export async function getSignedUrls(
  paths: string[],
  expiresInSeconds = 3600
): Promise<{ path: string; url: string }[]> {
  if (paths.length === 0) return [];

  const supabase = await createServerClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, expiresInSeconds);

  if (error) throw error;
  return (data ?? [])
    .map((d) => ({ path: d.path ?? "", url: d.signedUrl ?? "" }))
    .filter((d): d is { path: string; url: string } => !!d.url);
}

/**
 * Variante para el portal publico (anon): usa admin client con
 * service_role para bypasear RLS. Si no hay service_role configurada,
 * devuelve array vacio (el caller muestra fallback).
 */
export async function getSignedUrlsPublic(
  paths: string[],
  expiresInSeconds = 3600
): Promise<{ path: string; url: string }[]> {
  if (paths.length === 0) return [];
  const admin = await createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrls(paths, expiresInSeconds);

  if (error) return [];
  return (data ?? [])
    .map((d) => ({ path: d.path ?? "", url: d.signedUrl ?? "" }))
    .filter((d): d is { path: string; url: string } => !!d.url);
}

/**
 * Extrae todos los paths unicos de fotos de una lista de entradas
 * de historial (con duplicados removidos).
 */
export function extractFotoPaths(
  historial: { fotos_urls: string[] | null }[]
): string[] {
  const set = new Set<string>();
  for (const h of historial) {
    if (h.fotos_urls) {
      for (const p of h.fotos_urls) {
        if (p) set.add(p);
      }
    }
  }
  return Array.from(set);
}
