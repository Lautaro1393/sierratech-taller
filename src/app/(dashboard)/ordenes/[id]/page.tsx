import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TemporizadorCard } from "@/components/orden/temporizador-card";
import {
  formatCurrency,
  formatFecha,
  formatNumeroOt,
  formatFechaHora,
} from "@/lib/utils";
import { ESTADO_LABELS, type EstadoOrden, type HistorialEstado } from "@/types";
import { obtenerConfiguracionPricing } from "@/app/actions/settings";
import {
  getSesionesPorOrden,
  getSesionActivaPorOrden,
} from "@/lib/queries/tiempo";

export default async function OrdenDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: orden } = await supabase
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
    .eq("id", id)
    .single();

  if (!orden) notFound();

  const [sesiones, sesionActiva, config, historialRes] = await Promise.all([
    getSesionesPorOrden(id),
    getSesionActivaPorOrden(id),
    obtenerConfiguracionPricing(),
    supabase
      .from("historial_estados")
      .select("*")
      .eq("orden_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const estado = orden.estado as EstadoOrden;
  const estadoColor: Record<EstadoOrden, "default" | "ingresado" | "diagnostico" | "repuesto" | "reparacion" | "listo" | "entregado"> = {
    ingresado: "ingresado",
    en_diagnostico: "diagnostico",
    esperando_repuesto: "repuesto",
    en_reparacion: "reparacion",
    listo_para_retiro: "listo",
    entregado: "entregado",
    cancelado: "entregado",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-xl font-bold text-accent">
              {formatNumeroOt(orden.numero_ot)}
            </span>
            <Badge variant={estadoColor[estado]} dot>
              {ESTADO_LABELS[estado]}
            </Badge>
            {orden.es_urgente && <Badge variant="danger">Urgente</Badge>}
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-primary">
            {orden.equipo.marca} {orden.equipo.modelo}
          </h1>
          <p className="text-ink-secondary mt-1">
            {orden.equipo.cliente.nombre} · {orden.equipo.cliente.telefono}
          </p>
        </div>
        <Link href="/kanban">
          <Button variant="ghost">← Volver al Kanban</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TemporizadorCard
            ordenId={orden.id}
            estado={estado}
            presupuesto={orden.presupuesto ?? 0}
            costoRepuestosArs={orden.costo_repuestos_ars ?? 0}
            tipoIntervencion={orden.tipo_intervencion ?? "estandar"}
            tiempoTotalSeg={orden.tiempo_total_seg ?? 0}
            sesiones={sesiones}
            sesionActiva={sesionActiva}
            config={config}
          />

          <Card>
            <CardHeader>
              <CardTitle>Falla declarada</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-ink-primary">{orden.falla_declarada}</p>
              {orden.diagnostico && (
                <>
                  <p className="text-xs uppercase tracking-wider text-ink-muted mt-4 mb-1">
                    Diagnóstico
                  </p>
                  <p className="text-ink-primary">{orden.diagnostico}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial</CardTitle>
            </CardHeader>
            <CardContent>
              {historialRes.data && historialRes.data.length > 0 ? (
                <ol className="space-y-3">
                  {(historialRes.data as HistorialEstado[]).map((h) => (
                    <li
                      key={h.id}
                      className="flex gap-3 pb-3 border-b border-white/5 last:border-0"
                    >
                      <div className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-ink-primary">
                          {h.estado_anterior
                            ? `${ESTADO_LABELS[h.estado_anterior]} → ${ESTADO_LABELS[h.estado_nuevo]}`
                            : `Orden creada en ${ESTADO_LABELS[h.estado_nuevo]}`}
                        </p>
                        <p className="text-xs text-ink-muted mt-0.5">
                          {formatFechaHora(h.created_at)}
                        </p>
                        {h.nota_interna && (
                          <p className="text-sm text-ink-secondary mt-1">
                            {h.nota_interna}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-ink-muted text-sm">Sin movimientos aún.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Equipo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted">Tipo</span>
                <span className="text-ink-primary">{orden.equipo.tipo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Marca</span>
                <span className="text-ink-primary">{orden.equipo.marca}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Modelo</span>
                <span className="text-ink-primary">{orden.equipo.modelo}</span>
              </div>
              {orden.equipo.numero_serie && (
                <div className="flex justify-between">
                  <span className="text-ink-muted">Serie</span>
                  <span className="text-ink-primary font-mono">
                    {orden.equipo.numero_serie}
                  </span>
                </div>
              )}
              {orden.equipo.clave_desbloqueo && (
                <div className="flex justify-between">
                  <span className="text-ink-muted">Clave</span>
                  <span className="text-ink-primary">{orden.equipo.clave_desbloqueo}</span>
                </div>
              )}
              {orden.equipo.accesorios && (
                <div>
                  <span className="text-ink-muted">Accesorios</span>
                  <p className="text-ink-primary mt-1">{orden.equipo.accesorios}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Presupuesto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted">Tipo</span>
                <span className="text-ink-primary">
                  {orden.tipo_intervencion === "microscopio" ? "Microscopio" : "Estándar"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Repuestos</span>
                <span className="font-mono text-ink-primary">
                  {orden.costo_repuestos_ars > 0 ? formatCurrency(orden.costo_repuestos_ars) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">MO presupuestada</span>
                <span className="font-mono text-ink-primary">
                  {orden.presupuesto - (orden.costo_repuestos_ars ?? 0) > 0
                    ? formatCurrency(orden.presupuesto - (orden.costo_repuestos_ars ?? 0))
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Total</span>
                <span className="font-mono text-ink-primary">
                  {orden.presupuesto > 0 ? formatCurrency(orden.presupuesto) : "—"}
                </span>
              </div>
              <div className="h-px bg-white/5 my-1" />
              <div className="flex justify-between">
                <span className="text-ink-muted">Aprobado</span>
                <span className="text-ink-primary">
                  {orden.presupuesto_aprobado ? "Sí" : "No"}
                </span>
              </div>
              {orden.fecha_promesa && (
                <div className="flex justify-between">
                  <span className="text-ink-muted">Promesa</span>
                  <span className="text-ink-primary">{formatFecha(orden.fecha_promesa)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-ink-muted">Ingreso</span>
                <span className="text-ink-primary">{formatFecha(orden.fecha_ingreso)}</span>
              </div>
              {orden.fecha_entrega && (
                <div className="flex justify-between">
                  <span className="text-ink-muted">Entregado</span>
                  <span className="text-ink-primary">{formatFecha(orden.fecha_entrega)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
