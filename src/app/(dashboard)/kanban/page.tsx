import { createServerClient } from "@/lib/supabase";
import { KanbanBoard } from "@/components/kanban/kanban-board";
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
      </div>

      <KanbanBoard ordenes={ordenes} />
    </div>
  );
}
