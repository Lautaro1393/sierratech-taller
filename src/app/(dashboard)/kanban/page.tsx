import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { Button } from "@/components/ui/button";
import type { OrdenConRelaciones } from "@/types";

const ESTADOS_ACTIVOS = [
  "ingresado",
  "en_diagnostico",
  "esperando_repuesto",
  "en_reparacion",
  "listo_para_retiro",
] as const;

export default async function KanbanPage() {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("ordenes")
    .select(
      `
      *,
      tiempo_total_seg,
      equipo:equipos (
        *,
        cliente:clientes (*)
      )
    `
    )
    .in("estado", [...ESTADOS_ACTIVOS])
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold text-ink-primary">
          Kanban
        </h1>
        <div className="glass-card p-6 text-status-red">
          Error al cargar órdenes: {error.message}
        </div>
      </div>
    );
  }

  const ordenes = (data ?? []) as unknown as OrdenConRelaciones[];

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-primary">
            Kanban
          </h1>
          <p className="text-ink-secondary mt-1">
            {ordenes.length} {ordenes.length === 1 ? "orden activa" : "órdenes activas"} · arrastrá entre columnas
          </p>
        </div>
        <Link href="/ordenes/nueva">
          <Button>
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nueva Orden
          </Button>
        </Link>
      </div>

      <KanbanBoard ordenes={ordenes} />
    </div>
  );
}
