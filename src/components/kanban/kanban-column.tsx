"use client";

import { useDroppable } from "@dnd-kit/core";
import { ESTADO_COLORS, type EstadoOrden, type OrdenConRelaciones } from "@/types";
import { KanbanCard } from "./kanban-card";

interface KanbanColumnProps {
  estado: EstadoOrden;
  label: string;
  ordenes: OrdenConRelaciones[];
  isDragTarget?: boolean;
}

export function KanbanColumn({
  estado,
  label,
  ordenes,
  isDragTarget,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: estado });
  const accent = ESTADO_COLORS[estado];

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-shrink-0 w-[85vw] sm:w-72 flex flex-col
        glass-card rounded-xl overflow-hidden
        transition-all duration-200
        ${isOver ? "ring-2 ring-accent/50" : ""}
        ${isDragTarget ? "opacity-60" : ""}
      `}
    >
      <div
        className="px-4 py-3 border-b border-white/5 flex items-center justify-between"
        style={{ borderTopColor: accent, borderTopWidth: 3 }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: accent }}
          />
          <h3 className="font-display text-sm font-semibold text-ink-primary">
            {label}
          </h3>
        </div>
        <span className="text-xs text-ink-muted font-mono">
          {ordenes.length}
        </span>
      </div>

      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]">
        {ordenes.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-ink-muted py-8">
            Sin órdenes
          </div>
        ) : (
          ordenes.map((orden) => <KanbanCard key={orden.id} orden={orden} />)
        )}
      </div>
    </div>
  );
}
