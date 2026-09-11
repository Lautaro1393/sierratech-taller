import Link from "next/link";
import { fetchClientes } from "@/lib/queries/clientes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportarContactosButton } from "@/components/clientes/importar-contactos-button";
import { formatFecha } from "@/lib/utils";
import { ClientesSearch } from "@/components/clientes/clientes-search";

export const dynamic = "force-dynamic";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const { clientes, total, conEmail } = await fetchClientes(q);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-primary">
            Clientes
          </h1>
          <p className="text-ink-secondary mt-1">
            {q ? (
              <>
                {total} {total === 1 ? "resultado" : "resultados"} para &ldquo;{q}&rdquo;
              </>
            ) : (
              <>
                {total} {total === 1 ? "cliente" : "clientes"}
                {conEmail > 0 && ` · ${conEmail} con email`}
              </>
            )}
          </p>
        </div>
        <ImportarContactosButton />
      </div>

      <ClientesSearch initialQuery={q} />

      {total === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-3">
            <p className="text-ink-muted">
              {q
                ? `No se encontraron clientes para "${q}".`
                : "Todavia no hay clientes."}
            </p>
            {!q && (
              <p className="text-xs text-ink-muted">
                Importa contactos desde tu celular o crea uno al hacer una
                orden nueva.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{q ? "Resultados" : "Listado"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-white/5">
              {clientes.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/clientes/${c.id}`}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-white/[0.03] -mx-3 px-3 rounded-md transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink-primary truncate group-hover:text-accent-green transition-colors">
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
                    <span
                      aria-hidden="true"
                      className="text-ink-muted group-hover:text-accent-green shrink-0 transition-colors"
                    >
                      ›
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
