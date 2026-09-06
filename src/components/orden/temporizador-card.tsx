"use client";

import { useEffect, useState, useTransition } from "react";
import { Play, Pause, Square, Pencil, Check, X, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  formatTiempoHumano,
  formatFechaHora,
  formatCurrency,
} from "@/lib/utils";
import {
  calcularViabilidadOrden,
  statusBadgeStyles,
  type ViabilityInput,
} from "@/lib/pricing/viability";
import {
  iniciarSesion,
  pausarSesion,
  editarNotaSesion,
  cerrarSesionHuerfana,
} from "@/app/actions/tiempo";
import type {
  EstadoOrden,
  TiempoSesion,
  ViabilityConfig,
} from "@/types";

interface TemporizadorCardProps {
  ordenId: string;
  estado: EstadoOrden;
  presupuesto: number;
  costoRepuestosArs: number;
  tipoIntervencion: "estandar" | "microscopio";
  tiempoTotalSeg: number;
  sesiones: TiempoSesion[];
  sesionActiva: TiempoSesion | null;
  config: ViabilityConfig;
}

const ESTADOS_BLOQUEADOS: EstadoOrden[] = ["entregado", "cancelado"];
const HORAS_SESION_HUERFANA = 24;

export function TemporizadorCard({
  ordenId,
  estado,
  presupuesto,
  costoRepuestosArs,
  tipoIntervencion,
  tiempoTotalSeg,
  sesiones,
  sesionActiva: initialSesionActiva,
  config,
}: TemporizadorCardProps) {
  const [sesionActiva, setSesionActiva] = useState<TiempoSesion | null>(
    initialSesionActiva
  );
  const [now, setNow] = useState<Date>(() => new Date());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!sesionActiva) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [sesionActiva]);

  const sesionHuerfana =
    sesionActiva &&
    (now.getTime() - new Date(sesionActiva.started_at).getTime()) /
      3_600_000 >
      HORAS_SESION_HUERFANA;

  const tiempoEfectivo = sesionActiva
    ? tiempoTotalSeg +
      Math.floor((now.getTime() - new Date(sesionActiva.started_at).getTime()) / 1000)
    : tiempoTotalSeg;

  const viabilityInput: ViabilityInput = {
    tiempoTotalSeg: tiempoEfectivo,
    presupuestoTotalArs: presupuesto,
    costoRepuestosArs,
    tipoIntervencion,
  };
  const viabilidad = calcularViabilidadOrden(viabilityInput, config);
  const badge = statusBadgeStyles(viabilidad.status);

  const bloqueado = ESTADOS_BLOQUEADOS.includes(estado);

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const result = await iniciarSesion(ordenId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.reload();
    });
  }

  function handlePause() {
    if (!sesionActiva) return;
    setError(null);
    const sesionId = sesionActiva.id;
    startTransition(async () => {
      const result = await pausarSesion(sesionId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSesionActiva(null);
      window.location.reload();
    });
  }

  function handleCerrarHuerfana() {
    if (!sesionActiva) return;
    setError(null);
    const sesionId = sesionActiva.id;
    startTransition(async () => {
      const result = await cerrarSesionHuerfana(
        sesionId,
        "Sesión abierta más de 24h"
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSesionActiva(null);
      window.location.reload();
    });
  }

  const sesionesCerradas = sesiones.filter((s) => s.ended_at);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Tiempo de trabajo
          </span>
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full border ${badge.bg} ${badge.text}`}
            title={viabilidad.accionRecomendada}
          >
            {badge.label}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bloqueado && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-status-red/10 border border-status-red/20 text-sm text-status-red">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Esta orden está <strong>{estado}</strong>. El timer está bloqueado.
            </span>
          </div>
        )}

        {sesionHuerfana && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-status-yellow/10 border border-status-yellow/30 text-sm">
            <div className="flex items-center gap-2 text-status-yellow">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Sesión abierta hace más de {HORAS_SESION_HUERFANA}h. ¿Cerrarla?
              </span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCerrarHuerfana}
              loading={isPending}
            >
              Cerrar
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-surface-base/50 border border-white/5">
            <p className="text-xs uppercase tracking-wider text-ink-muted mb-2">
              {sesionActiva ? "Timer activo" : "Tiempo total"}
            </p>
            <p
              className={`font-mono text-4xl md:text-5xl font-bold tabular-nums ${
                sesionActiva ? "text-accent" : "text-ink-primary"
              }`}
            >
              {viabilidad.horasConsumidasFormateadas}
            </p>
            <p className="text-xs text-ink-muted mt-2">
              {sesionActiva ? (
                <span className="flex items-center gap-1.5 text-status-green">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-green opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-status-green" />
                  </span>
                  Corriendo
                </span>
              ) : (
                "Detenido"
              )}
            </p>
          </div>

          <div className="flex flex-col gap-2 p-4 rounded-xl bg-surface-base/50 border border-white/5 text-sm">
            <Row label="Costo operativo (acumulado)" value={formatCurrency(viabilidad.costoOperativoAcumuladoArs)} />
            <Row label="Presupuesto MO" value={formatCurrency(viabilidad.presupuestoMOArs)} />
            <Row
              label="Ganancia neta MO"
              value={formatCurrency(viabilidad.gananciaNetaMOArs)}
              className={viabilidad.gananciaNetaMOArs < 0 ? "text-status-red" : undefined}
            />
            <div className="h-px bg-white/5 my-1" />
            <div className="flex justify-between items-center">
              <span className="text-ink-muted">Margen MO</span>
              <span
                className={`font-mono font-semibold tabular-nums ${margenColor(viabilidad.margenPorcentaje)}`}
              >
                {viabilidad.margenPorcentaje > 0 ? "+" : ""}
                {viabilidad.margenPorcentaje.toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-muted">Horas restantes rentables</span>
              <span className="font-mono tabular-nums text-ink-primary">
                {viabilidad.horasRestantesRentables.toFixed(2)}h
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-ink-muted">
                Tipo: {tipoIntervencion === "microscopio" ? "microscopio" : "estándar"}
              </span>
              <span className="font-mono tabular-nums text-ink-muted">
                @{formatCurrency(viabilidad.tarifaCobradaHoraArs)}/h
              </span>
            </div>
          </div>
        </div>

        {!bloqueado && (
          <p className="text-xs text-ink-muted italic border-l-2 border-white/10 pl-3">
            {viabilidad.accionRecomendada}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {!sesionActiva ? (
            <Button onClick={handleStart} loading={isPending} disabled={bloqueado}>
              <Play className="w-4 h-4" />
              Iniciar
            </Button>
          ) : (
            <>
              <Button onClick={handlePause} loading={isPending} variant="secondary">
                <Pause className="w-4 h-4" />
                Pausar
              </Button>
              <Button
                onClick={handlePause}
                loading={isPending}
                variant="ghost"
                title="Detener equivale a pausar"
              >
                <Square className="w-4 h-4" />
                Detener
              </Button>
            </>
          )}
        </div>

        {error && <p className="text-sm text-status-red">{error}</p>}

        {sesionesCerradas.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/5">
            <p className="text-xs uppercase tracking-wider text-ink-muted">
              Sesiones ({sesionesCerradas.length})
            </p>
            <div className="space-y-1.5">
              {sesionesCerradas.map((s) => (
                <SesionRow key={s.id} sesion={s} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className={`font-mono text-ink-primary tabular-nums ${className}`}>{value}</span>
    </div>
  );
}

function margenColor(margen: number): string {
  if (margen > 30) return "text-status-green";
  if (margen >= 0) return "text-status-yellow";
  return "text-status-red";
}

function SesionRow({ sesion }: { sesion: TiempoSesion }) {
  const [editing, setEditing] = useState(false);
  const [nota, setNota] = useState(sesion.notas ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await editarNotaSesion(sesion.id, nota);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditing(false);
      window.location.reload();
    });
  }

  return (
    <div className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-base/30 border border-white/5 text-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-ink-secondary">
          <span className="font-mono tabular-nums text-ink-primary">
            {formatTiempoHumano(sesion.duracion_seg ?? 0)}
          </span>
          <span className="text-ink-muted">·</span>
          <span className="text-xs text-ink-muted">
            {formatFechaHora(sesion.started_at)}
          </span>
        </div>
        {editing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Notas de la sesión (qué hiciste, qué probaste...)"
              className="w-full px-2 py-1.5 rounded-md bg-surface-base border border-white/10 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-accent resize-none"
              rows={2}
              autoFocus
            />
            {error && <p className="text-xs text-status-red">{error}</p>}
            <div className="flex gap-1.5">
              <Button size="sm" onClick={save} loading={isPending}>
                <Check className="w-3.5 h-3.5" />
                Guardar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setNota(sesion.notas ?? "");
                }}
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="mt-1 text-left text-ink-muted hover:text-ink-primary transition-colors flex items-start gap-1.5 group"
          >
            <Pencil className="w-3 h-3 mt-0.5 shrink-0 opacity-50 group-hover:opacity-100" />
            <span className="italic">
              {sesion.notas ? sesion.notas : <span className="opacity-50">Agregar nota…</span>}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
