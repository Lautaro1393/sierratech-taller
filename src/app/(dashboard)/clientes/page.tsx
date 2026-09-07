import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImportarContactosButton } from "@/components/clientes/importar-contactos-button";
import { formatFecha } from "@/lib/utils";
import type { Cliente } from "@/types";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("clientes")
    .select("id, nombre, telefono, email, created_at")
    .order("nombre", { ascending: true });

  const clientes = (data ?? []) as Array<
    Pick<Cliente, "id" | "nombre" | "telefono" | "email"> & { created_at: string }
  >;

  const total = clientes.length;
  const conEmail = clientes.filter((c) => c.email).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-primary">
            Clientes
          </h1>
          <p className="text-ink-secondary mt-1">
            {total} {total === 1 ? "cliente" : "clientes"}
            {conEmail > 0 && ` · ${conEmail} con email`}
          </p>
        </div>
        <ImportarContactosButton />
      </div>

      {total === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-3">
            <p className="text-ink-muted">Todavia no hay clientes.</p>
            <p className="text-xs text-ink-muted">
              Importa contactos desde tu celular o crea uno al hacer una
              orden nueva.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Listado</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-white/5">
              {clientes.map((c) => (
                <li
                  key={c.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-primary truncate">
                      {c.nombre}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {c.telefono}
                      {c.email && ` · ${c.email}`}
                    </p>
                  </div>
                  <span className="text-[10px] text-ink-muted/60 shrink-0 hidden sm:inline">
                    {formatFecha(c.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="text-center pt-2">
        <Link
          href="/clientes"
          className="text-xs text-ink-muted hover:text-ink-secondary"
        >
          Busqueda y filtros por cliente / equipo (Fase 9) — placeholder
        </Link>
      </div>
    </div>
  );
}
