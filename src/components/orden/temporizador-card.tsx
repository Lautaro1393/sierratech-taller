"use client";

import { useEffect, useState, useTransition } from "react";
import { Play, Pause, Square, Pencil, Check, X, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  formatHMS,
  formatCorto,
  formatTiempoHumano,
  formatCurrency,
  formatFechaHora,
  tiempoEfectivoSeg,
  calcularCosto,
  calcularMargen,
  getSemforoMargen,
  type SemforoMargen,
} from "@/lib/utils";
import {
  iniciarSesion,
  pausarSesion,
  editarNotaSesion,
  cerrarSesionHuerfana,
} from "@/app/actions/tiempo";
import type { EstadoOrden, TiempoSesion } from "@/types";

interface TemporizadorCardProps {
  ordenId: string;
  estado: EstadoOrden;
  presupuesto: number;
  tarifaHora: number;
  tiempoTotalSeg: number;
  sesiones: TiempoSesion[];
  sesionActiva: TiempoSesion | null;
}

const ESTADOS_BLOQUEADOS: EstadoOrden[] = ["entregado", "cancelado"];
const HORAS_SESION_HUERFANA = 24;

export function TemporizadorCard({
  ordenId,
  estado,
  presupuesto,
  tarifaHora,
  tiempoTotalSeg,
  sesiones,
  sesionActiva: initialSesionActiva,
}: TemporizadorCardProps) {
  const [sesionActiva, setSesionActiva] = useState<TiempoSesion | null>(
    initialSesionActiva
  );
  const [now, setNow] = useState<Date>(() => new Date());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Tick de reloj: cada 1s mientras hay sesión activa
  useEffect(() => {
    if (!sesionActiva) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [sesionActiva]);

  // Detectar sesión huérfana (>24h sin cerrar)
  const sesionHuerfana =
    sesionActiva &&
    (now.getTime() - new Date(sesionActiva.started_at).getTime()) /
      3_600_000 >
      HORAS_SESION_HUERFANA;

  const tiempoEfectivo = tiempoEfectivoSeg(tiempoTotalSeg, sesionActiva, now);
  const costo = calcularCosto(tiempoEfectivo, tarifaHora);
  const margen = calcularMargen(presupuesto, costo);
  const semaforoMargen: SemforoMargen = getSemforoMargen(margen);

  const bloqueado = ESTADOS_BLOQUEADOS.includes(estado);

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const result = await iniciarSesion(ordenId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Refrescar via revalidatePath → la página se re-renderiza y nos llega
      // la nueva sesión activa por props. Pero como estamos en client, hacemos
      // un reload manual:
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
        "Sesión olvidada abierta por más de 24h"
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
        <CardTitle className="flex items-center gap-2">
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
              {sesionActiva ? formatCorto(tiempoEfectivo) : formatHMS(tiempoEfectivo)}
            </p>
            {sesionActiva && (
              <p className="text-xs text-status-green mt-2 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-green opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-status-green" />
                </span>
                Corriendo
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 p-4 rounded-xl bg-surface-base/50 border border-white/5">
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">Costo @{formatCurrency(tarifaHora)}/h</span>
              <span className="font-mono text-ink-primary tabular-nums">
                {formatCurrency(costo)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">Presupuesto</span>
              <span className="font-mono text-ink-primary tabular-nums">
                {presupuesto > 0 ? formatCurrency(presupuesto) : "—"}
              </span>
            </div>
            <div className="h-px bg-white/5 my-1" />
            <div className="flex justify-between items-center text-sm">
              <span className="text-ink-muted">Margen</span>
              {presupuesto > 0 ? (
                <span
                  className={`font-mono font-semibold tabular-nums ${
                    semaforoMargen === "green"
                      ? "text-status-green"
                      : semaforoMargen === "yellow"
                        ? "text-status-yellow"
                        : "text-status-red"
                  }`}
                >
                  {margen > 0 ? "+" : ""}
                  {margen.toFixed(0)}%
                </span>
              ) : (
                <span className="text-ink-muted">Sin presupuesto</span>
              )}
            </div>
          </div>
        </div>

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

        {error && (
          <p className="text-sm text-status-red">{error}</p>
        )}

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
