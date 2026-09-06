import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TemporizadorCard } from "@/components/orden/temporizador-card";
import { EstadoSelector } from "@/components/orden/estado-selector";
import { PresupuestoEditor } from "@/components/orden/presupuesto-editor";
import { ResumenCierre } from "@/components/orden/resumen-cierre";
import { AgregarNotaHistorial } from "@/components/orden/agregar-nota-historial";
import { CompartirTrackingSection } from "@/components/orden/compartir-tracking-section";
import {
  formatNumeroOt,
  formatFechaHora,
} from "@/lib/utils";
import { ESTADO_LABELS, type EstadoOrden, type HistorialEstado, type TipoIntervencion } from "@/types";
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
  const tipoIntervencion: TipoIntervencion = orden.tipo_intervencion ?? "estandar";

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

      <CompartirTrackingSection publicToken={orden.public_token} />

      <Card>
        <CardContent className="pt-6">
          <EstadoSelector ordenId={orden.id} estadoActual={estado} />
        </CardContent>
      </Card>

      <ResumenCierre
        estado={estado}
        fechaEntrega={orden.fecha_entrega}
        presupuestoTotal={orden.presupuesto ?? 0}
        costoRepuestosArs={orden.costo_repuestos_ars ?? 0}
        tipoIntervencion={tipoIntervencion}
        tiempoTotalSeg={orden.tiempo_total_seg ?? 0}
        config={config}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TemporizadorCard
            ordenId={orden.id}
            estado={estado}
            presupuesto={orden.presupuesto ?? 0}
            costoRepuestosArs={orden.costo_repuestos_ars ?? 0}
            tipoIntervencion={tipoIntervencion}
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
            <CardContent className="space-y-4">
              <AgregarNotaHistorial ordenId={orden.id} />
              {historialRes.data && historialRes.data.length > 0 ? (
                <ol className="space-y-3 pt-2">
                  {(historialRes.data as HistorialEstado[]).map((h) => (
                    <li
                      key={h.id}
                      className="flex gap-3 pb-3 border-b border-white/5 last:border-0"
                    >
                      <div className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm text-ink-primary">
                            {h.estado_anterior
                              ? `${ESTADO_LABELS[h.estado_anterior]} → ${ESTADO_LABELS[h.estado_nuevo]}`
                              : `Orden creada en ${ESTADO_LABELS[h.estado_nuevo]}`}
                          </p>
                          {h.nota_cliente && (
                            <span className="text-[10px] uppercase tracking-wider text-status-blue bg-status-blue/10 px-1.5 py-0.5 rounded">
                              Para cliente
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-muted mt-0.5">
                          {formatFechaHora(h.created_at)}
                        </p>
                        {h.nota_interna && (
                          <p className="text-sm text-ink-secondary mt-1">
                            {h.nota_interna}
                          </p>
                        )}
                        {h.nota_cliente && (
                          <p className="text-sm text-status-blue mt-1">
                            “{h.nota_cliente}”
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
            <CardContent>
              <PresupuestoEditor
                ordenId={orden.id}
                presupuesto={orden.presupuesto ?? 0}
                costoRepuestosArs={orden.costo_repuestos_ars ?? 0}
                tipoIntervencion={tipoIntervencion}
                presupuestoAprobado={orden.presupuesto_aprobado ?? false}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
