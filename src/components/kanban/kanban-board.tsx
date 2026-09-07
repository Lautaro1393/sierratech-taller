"use client";

import { useState, useTransition, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { ESTADO_LABELS, type EstadoOrden, type OrdenConRelaciones } from "@/types";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { PausePrompt } from "./pause-prompt";
import { actualizarEstadoOrden } from "@/app/actions/ordenes";
import { getSesionActivaPorOrdenClient } from "@/app/actions/tiempo";

const COLUMN_ORDER: EstadoOrden[] = [
  "ingresado",
  "en_diagnostico",
  "esperando_repuesto",
  "en_reparacion",
  "listo_para_retiro",
];

interface PausePromptState {
  ordenId: string;
  sesionId: string | null;
  numeroOt: number;
}

interface KanbanBoardProps {
  ordenes: OrdenConRelaciones[];
}

export function KanbanBoard({ ordenes }: KanbanBoardProps) {
  // Overrides locales (optimistic updates). Cuando llegan nuevas props del server
  // component, hacemos merge manteniendo los overrides activos.
  const [overrides, setOverrides] = useState<Record<string, { estado: EstadoOrden }>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pausePrompt, setPausePrompt] = useState<PausePromptState | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const items = useMemo(() => {
    return ordenes.map((o) => {
      const ov = overrides[o.id];
      return ov ? { ...o, estado: ov.estado } : o;
    });
  }, [ordenes, overrides]);

  const ordenesPorEstado = useMemo(() => {
    const map = Object.fromEntries(
      COLUMN_ORDER.map((estado) => [estado, [] as OrdenConRelaciones[]])
    ) as Record<EstadoOrden, OrdenConRelaciones[]>;
    for (const o of items) {
      map[o.estado]?.push(o);
    }
    return map;
  }, [items]);

  const activeOrden = activeId
    ? items.find((o) => o.id === activeId) ?? null
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    setError(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const targetEstado = String(over.id) as EstadoOrden;
    if (!COLUMN_ORDER.includes(targetEstado)) return;

    const ordenId = String(active.id);
    const orden = items.find((o) => o.id === ordenId);
    if (!orden || orden.estado === targetEstado) return;

    const estadoAnterior = orden.estado;
    setOverrides((prev) => ({ ...prev, [ordenId]: { estado: targetEstado } }));

    startTransition(async () => {
      const result = await actualizarEstadoOrden(ordenId, targetEstado);
      if (!result.ok) {
        setOverrides((prev) => {
          const next = { ...prev };
          next[ordenId] = { estado: estadoAnterior };
          return next;
        });
        setError(result.error ?? "No se pudo actualizar el estado");
        return;
      }
      // Limpiar override: las props ya vienen con el nuevo estado.
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[ordenId];
        return next;
      });
      if (result.pausaSugerida) {
        const sesion = await getSesionActivaPorOrdenClient(ordenId);
        if (sesion) {
          setPausePrompt({
            ordenId,
            sesionId: sesion.id,
            numeroOt: orden.numero_ot,
          });
        }
      }
    });
  }

  return (
    <>
      {pausePrompt && (
        <PausePrompt
          sesionId={pausePrompt.sesionId}
          numeroOt={pausePrompt.numeroOt}
          onDismiss={() => setPausePrompt(null)}
        />
      )}

      {error && (
        <div className="glass-card p-3 text-sm text-status-red border-status-red/30">
          {error}
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0 snap-x snap-mandatory md:snap-none">
          {COLUMN_ORDER.map((estado) => (
            <KanbanColumn
              key={estado}
              estado={estado}
              label={ESTADO_LABELS[estado]}
              ordenes={ordenesPorEstado[estado]}
              isDragTarget={isPending && activeOrden?.estado !== estado}
            />
          ))}
        </div>

        <DragOverlay>
          {activeOrden ? <KanbanCard orden={activeOrden} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
