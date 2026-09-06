import { formatFechaHora, formatCurrency, formatTiempoHumano } from "@/lib/utils";
import { calcularViabilidadOrden, statusBadgeStyles } from "@/lib/pricing/viability";
import type {
  EstadoOrden,
  ViabilityConfig,
  TipoIntervencion,
} from "@/types";

interface ResumenCierreProps {
  estado: EstadoOrden;
  fechaEntrega: string | null;
  presupuestoTotal: number;
  costoRepuestosArs: number;
  tipoIntervencion: TipoIntervencion;
  tiempoTotalSeg: number;
  config: ViabilityConfig;
}

export function ResumenCierre({
  estado,
  fechaEntrega,
  presupuestoTotal,
  costoRepuestosArs,
  tipoIntervencion,
  tiempoTotalSeg,
  config,
}: ResumenCierreProps) {
  const isFinal = estado === "entregado" || estado === "cancelado";
  if (!isFinal) return null;

  const viabilidad = calcularViabilidadOrden(
    {
      tiempoTotalSeg,
      presupuestoTotalArs: presupuestoTotal,
      costoRepuestosArs,
      tipoIntervencion,
    },
    config
  );

  const badge = statusBadgeStyles(viabilidad.status);
  const fueExitoso = estado === "entregado";

  return (
    <div
      className={`glass-card p-4 space-y-3 ${
        fueExitoso ? "border-status-green/20" : "border-status-red/20"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-ink-muted">
            Resumen de cierre
          </p>
          <p
            className={`text-sm font-semibold mt-0.5 ${
              fueExitoso ? "text-status-green" : "text-status-red"
            }`}
          >
            {fueExitoso ? "Orden entregada" : "Orden cancelada"}
          </p>
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full border ${badge.bg} ${badge.text}`}
        >
          {badge.label}
        </span>
      </div>

      {fechaEntrega && (
        <p className="text-xs text-ink-muted">
          {fueExitoso ? "Entregada" : "Cancelada"} el {formatFechaHora(fechaEntrega)}
        </p>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm pt-2 border-t border-white/5">
        <Row label="Tiempo total" value={formatTiempoHumano(tiempoTotalSeg)} />
        <Row label="Tarifa hora" value={formatCurrency(viabilidad.tarifaCobradaHoraArs)} />
        <Row label="Costo operativo" value={formatCurrency(viabilidad.costoOperativoAcumuladoArs)} />
        <Row label="Presupuesto MO" value={formatCurrency(viabilidad.presupuestoMOArs)} />
        <Row
          label="Ganancia neta MO"
          value={formatCurrency(viabilidad.gananciaNetaMOArs)}
          valueClassName={
            viabilidad.gananciaNetaMOArs < 0
              ? "text-status-red font-semibold"
              : viabilidad.gananciaNetaMOArs === 0
                ? "text-ink-secondary"
                : "text-status-green font-semibold"
          }
        />
        <Row
          label="Margen MO"
          value={`${viabilidad.margenPorcentaje > 0 ? "+" : ""}${viabilidad.margenPorcentaje.toFixed(1)}%`}
          valueClassName={
            viabilidad.status === "OPTIMA"
              ? "text-status-green font-semibold"
              : viabilidad.status === "RIESGO_MARGEN"
                ? "text-status-yellow font-semibold"
                : "text-status-red font-semibold"
          }
        />
      </div>

      <p className="text-xs italic text-ink-muted pt-2 border-t border-white/5">
        {viabilidad.accionRecomendada}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  valueClassName = "text-ink-primary",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className={`font-mono tabular-nums ${valueClassName}`}>{value}</span>
    </div>
  );
}
