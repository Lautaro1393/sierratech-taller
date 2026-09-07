import "server-only";
import { createServerClient } from "@supabase/ssr";

/**
 * Cliente admin (service_role) — bypasea RLS.
 * Solo usar server-side y solo para operaciones que requieren
 * bypasear permisos (ej: generar signed URLs para el portal anon).
 *
 * Si SUPABASE_SERVICE_ROLE_KEY no esta en .env.local, devuelve
 * null y los callers deben manejar ese caso (mostrar fallback).
 */
export async function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;

  // Pasamos cookies vacias — el admin no las necesita.
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // no-op
        },
      },
    }
  );
}
