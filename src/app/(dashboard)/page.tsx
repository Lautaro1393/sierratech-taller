import Link from "next/link";
import { createServerClient } from "@/lib/supabase";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTiempoCorto, formatNumeroOt } from "@/lib/utils";
import { getSemaphoreColor } from "@/lib/utils/semaphore";
import type { Orden, EstadoOrden } from "@/types";

const ESTADOS_ACTIVOS = [
  "ingresado",
  "en_diagnostico",
  "esperando_repuesto",
  "en_reparacion",
  "listo_para_retiro",
] as const;

const estadoLabels: Record<EstadoOrden, string> = {
  ingresado: "Ingresado",
  en_diagnostico: "Diagnóstico",
  esperando_repuesto: "Repuesto",
  en_reparacion: "Reparación",
  listo_para_retiro: "Listo",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("ordenes")
    .select("*")
    .in("estado", [...ESTADOS_ACTIVOS])
    .order("updated_at", { ascending: false });

  const ordenes: Orden[] = data ?? [];

  const stats = {
    total: ordenes.length,
    urgentes: ordenes.filter((o) => o.es_urgente).length,
    enProceso: ordenes.filter(
      (o) => !["ingresado", "listo_para_retiro"].includes(o.estado)
    ).length,
    listas: ordenes.filter((o) => o.estado === "listo_para_retiro").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-primary">
            Dashboard
          </h1>
          <p className="text-ink-secondary mt-1">Resumen de tu taller</p>
        </div>
        <Link href="/kanban">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Órdenes Activas"
          value={stats.total}
          icon={
            <svg
              className="w-6 h-6 text-ink-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
        />
        <StatsCard
          title="Urgentes"
          value={stats.urgentes}
          variant={stats.urgentes > 0 ? "danger" : "default"}
          icon={
            <svg
              className="w-6 h-6 text-status-red"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          }
        />
        <StatsCard
          title="En Proceso"
          value={stats.enProceso}
          variant="warning"
          icon={
            <svg
              className="w-6 h-6 text-status-yellow"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          }
        />
        <StatsCard
          title="Listas para Retiro"
          value={stats.listas}
          variant={stats.listas > 0 ? "success" : "default"}
          icon={
            <svg
              className="w-6 h-6 text-status-green"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Órdenes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {ordenes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-ink-muted">No hay órdenes activas</p>
              <Link href="/kanban">
                <Button variant="ghost" className="mt-2">
                  Crear primera orden
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {ordenes.slice(0, 5).map((orden) => {
                const semaphore = getSemaphoreColor(
                  orden.updated_at,
                  orden.es_urgente
                );
                return (
                  <Link
                    key={orden.id}
                    href={`/ordenes/${orden.id}`}
                    className={`
                      flex items-center justify-between p-3 rounded-lg
                      bg-surface-hover/50 hover:bg-surface-hover
                      border-l-4 transition-colors
                      ${semaphore === "green" ? "border-l-status-green" : ""}
                      ${semaphore === "yellow" ? "border-l-status-yellow" : ""}
                      ${semaphore === "red" ? "border-l-status-red" : ""}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-accent">
                        {formatNumeroOt(orden.numero_ot)}
                      </span>
                      <div>
                        <p className="text-sm text-ink-primary">
                          {orden.falla_declarada}
                        </p>
                        <p className="text-xs text-ink-muted">
                          Actualizado {formatTiempoCorto(orden.updated_at)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={orden.es_urgente ? "danger" : "default"} dot>
                      {estadoLabels[orden.estado]}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}