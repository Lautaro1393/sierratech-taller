"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import {
  actualizarEstadoOrden,
  type ActualizarEstadoResult,
} from "@/app/actions/ordenes";
import { ESTADO_LABELS, type EstadoOrden } from "@/types";

const ESTADOS_ACTIVOS: EstadoOrden[] = [
  "ingresado",
  "en_diagnostico",
  "esperando_repuesto",
  "en_reparacion",
  "listo_para_retiro",
];

const ESTADOS_FINALES: EstadoOrden[] = ["entregado", "cancelado"];

interface EstadoSelectorProps {
  ordenId: string;
  estadoActual: EstadoOrden;
}

export function EstadoSelector({ ordenId, estadoActual }: EstadoSelectorProps) {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function cambiar(nuevoEstado: EstadoOrden) {
    if (nuevoEstado === estadoActual) return;
    setError(null);
    setInfo(null);

    const confirmar = ESTADOS_FINALES.includes(nuevoEstado);
    if (confirmar) {
      const ok = window.confirm(
        nuevoEstado === "entregado"
          ? "¿Marcar como ENTREGADO? Esto cierra la orden y detiene el timer."
          : "¿Cancelar la orden? Esta acción no se puede deshacer."
      );
      if (!ok) return;
    }

    startTransition(async () => {
      const result: ActualizarEstadoResult = await actualizarEstadoOrden(
        ordenId,
        nuevoEstado
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.autoStop) {
        setInfo(
          nuevoEstado === "entregado"
            ? "Orden entregada. Timer detenido."
            : "Orden cancelada. Timer detenido."
        );
      } else if (result.pausaSugerida) {
        setInfo("Movida a Esperando Repuesto.");
      } else {
        setInfo(null);
      }
      // Forzar refresh del server component
      setTimeout(() => window.location.reload(), 600);
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold">
        Cambiar estado
      </p>
      <div className="flex flex-wrap gap-1.5">
        {[...ESTADOS_ACTIVOS, ...ESTADOS_FINALES].map((estado) => {
          const isActual = estado === estadoActual;
          const isFinal = ESTADOS_FINALES.includes(estado);
          return (
            <button
              key={estado}
              type="button"
              disabled={isPending || isActual}
              onClick={() => cambiar(estado)}
              className={`
                inline-flex items-center gap-1.5
                px-2.5 py-1 rounded-full text-xs font-medium
                transition-colors
                ${
                  isActual
                    ? "bg-accent/15 text-accent border border-accent/30 cursor-default"
                    : isFinal
                      ? "bg-surface-hover text-ink-secondary border border-white/10 hover:bg-status-red/10 hover:text-status-red hover:border-status-red/30 disabled:opacity-50"
                      : "bg-surface-hover text-ink-secondary border border-white/10 hover:bg-accent/10 hover:text-accent hover:border-accent/30 disabled:opacity-50"
                }
              `}
              title={isActual ? "Estado actual" : `Cambiar a ${ESTADO_LABELS[estado]}`}
            >
              {isActual && <Check className="w-3 h-3" />}
              {ESTADO_LABELS[estado]}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-status-red">{error}</p>}
      {info && <p className="text-xs text-status-green">{info}</p>}
    </div>
  );
}
