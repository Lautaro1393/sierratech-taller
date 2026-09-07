"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatNumeroOt, formatFecha, formatCurrency } from "@/lib/utils/format";
import type { OrdenListItem } from "@/lib/queries/ordenes-list";
import type { EstadoOrden } from "@/types";
import { ESTADO_LABELS } from "@/types";
import { Clock, AlertTriangle } from "lucide-react";

const BADGE_VARIANT: Record<EstadoOrden, "ingresado" | "diagnostico" | "repuesto" | "reparacion" | "listo" | "entregado" | "danger"> = {
  ingresado: "ingresado",
  en_diagnostico: "diagnostico",
  esperando_repuesto: "repuesto",
  en_reparacion: "reparacion",
  listo_para_retiro: "listo",
  entregado: "entregado",
  cancelado: "danger",
};

function formatTiempo(totalSeg: number): string {
  const h = Math.floor(totalSeg / 3600);
  const m = Math.floor((totalSeg % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${totalSeg}s`;
}

interface OrdenesTableProps {
  ordenes: OrdenListItem[];
}

export function OrdenesTable({ ordenes }: OrdenesTableProps) {
  if (ordenes.length === 0) {
    return (
      <div className="text-center py-12 text-ink-muted">
        <p className="text-sm">No se encontraron órdenes con esos filtros.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-ink-muted text-left">
            <th className="pb-3 font-medium">OT</th>
            <th className="pb-3 font-medium">Cliente</th>
            <th className="pb-3 font-medium hidden sm:table-cell">Equipo</th>
            <th className="pb-3 font-medium">Estado</th>
            <th className="pb-3 font-medium hidden md:table-cell">Presupuesto</th>
            <th className="pb-3 font-medium hidden md:table-cell">Tiempo</th>
            <th className="pb-3 font-medium hidden lg:table-cell">Ingreso</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {ordenes.map((o) => (
            <tr
              key={o.id}
              className="hover:bg-surface-hover/50 transition-colors"
            >
              <td className="py-3">
                <Link
                  href={`/ordenes/${o.id}`}
                  className="flex items-center gap-2 font-mono text-accent hover:underline"
                >
                  {formatNumeroOt(o.numero_ot)}
                  {o.es_urgente && (
                    <AlertTriangle className="w-3.5 h-3.5 text-status-yellow" />
                  )}
                </Link>
              </td>
              <td className="py-3">
                <p className="text-ink-primary truncate max-w-[180px]">
                  {o.equipo.cliente.nombre}
                </p>
                <p className="text-xs text-ink-muted sm:hidden">
                  {o.equipo.marca} {o.equipo.modelo}
                </p>
              </td>
              <td className="py-3 hidden sm:table-cell">
                <p className="text-ink-secondary truncate max-w-[200px]">
                  {o.equipo.marca} {o.equipo.modelo}
                </p>
                <p className="text-xs text-ink-muted">{o.equipo.tipo}</p>
              </td>
              <td className="py-3">
                <Badge variant={BADGE_VARIANT[o.estado]} dot>
                  {ESTADO_LABELS[o.estado]}
                </Badge>
              </td>
              <td className="py-3 hidden md:table-cell text-ink-secondary">
                {formatCurrency(o.presupuesto)}
              </td>
              <td className="py-3 hidden md:table-cell">
                <span className="inline-flex items-center gap-1 text-ink-muted">
                  <Clock className="w-3 h-3" />
                  {formatTiempo(o.tiempo_total_seg)}
                </span>
              </td>
              <td className="py-3 hidden lg:table-cell text-ink-muted text-xs">
                {formatFecha(o.fecha_ingreso)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
