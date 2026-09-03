import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { OrdenForm } from "@/components/forms/orden-form";
import type { Cliente } from "@/types";

export const dynamic = "force-dynamic";

export default async function NuevaOrdenPage() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("clientes")
    .select("id, nombre, telefono, email")
    .order("nombre", { ascending: true });

  const clientes: Pick<Cliente, "id" | "nombre" | "telefono" | "email">[] =
    data ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/kanban"
          className="text-sm text-ink-muted hover:text-ink-secondary inline-flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver al Kanban
        </Link>
      </div>

      <div>
        <h1 className="font-display text-2xl font-bold text-ink-primary">
          Nueva orden
        </h1>
        <p className="text-ink-secondary mt-1">
          Ingresá el equipo al taller. Si el cliente ya existe, seleccionálo de
          la lista; si no, cargá sus datos.
        </p>
      </div>

      <OrdenForm clientes={clientes} />
    </div>
  );
}
