import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchClienteDetalle } from "@/lib/queries/clientes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ESTADO_LABELS, type EstadoOrden } from "@/types";
import {
  formatFecha,
  formatNumeroOt,
  formatTelefonoParaLink,
} from "@/lib/utils";
import { MessageCircle, Smartphone, Mail, Calendar, ArrowLeft } from "lucide-react";

const BADGE_VARIANT: Record<EstadoOrden, "ingresado" | "diagnostico" | "repuesto" | "reparacion" | "listo" | "entregado" | "danger"> = {
  ingresado: "ingresado",
  en_diagnostico: "diagnostico",
  esperando_repuesto: "repuesto",
  en_reparacion: "reparacion",
  listo_para_retiro: "listo",
  entregado: "entregado",
  cancelado: "danger",
};

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cliente = await fetchClienteDetalle(id);

  if (!cliente) {
    notFound();
  }

  const totalOrdenes = cliente.equipos.reduce((acc, e) => acc + e.ordenes.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/clientes"
          className="p-2 -ml-2 text-ink-muted hover:text-ink-primary transition-colors rounded-md hover:bg-white/5"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-bold text-ink-primary truncate">
            {cliente.nombre}
          </h1>
          <p className="text-ink-secondary mt-1">
            {cliente.equipos.length} {cliente.equipos.length === 1 ? "equipo" : "equipos"} · {totalOrdenes} {totalOrdenes === 1 ? "orden" : "órdenes"}
          </p>
        </div>
        <a
          href={`https://wa.me/${formatTelefonoParaLink(cliente.telefono)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#25D366]/90 hover:bg-[#25D366] rounded-lg transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-surface-hover rounded-lg">
                <Smartphone className="h-4 w-4 text-ink-muted" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-ink-muted">Telefono</p>
                <p className="text-sm text-ink-primary">{cliente.telefono}</p>
              </div>
            </div>
            {cliente.email && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-surface-hover rounded-lg">
                  <Mail className="h-4 w-4 text-ink-muted" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-ink-muted">Email</p>
                  <p className="text-sm text-ink-primary">{cliente.email}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-surface-hover rounded-lg">
                <Calendar className="h-4 w-4 text-ink-muted" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-ink-muted">Cliente desde</p>
                <p className="text-sm text-ink-primary">{formatFecha(cliente.created_at)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {cliente.equipos.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-ink-muted">Este cliente no tiene equipos registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {cliente.equipos.map((equipo) => (
            <Card key={equipo.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-ink-primary">{equipo.marca}</span>
                  <span className="text-ink-muted font-normal">{equipo.modelo}</span>
                  {equipo.numero_serie && (
                    <span className="text-xs text-ink-muted font-mono ml-auto hidden sm:inline">
                      SN: {equipo.numero_serie}
                    </span>
                  )}
                </CardTitle>
                <p className="text-xs text-ink-muted">{equipo.tipo} · Ingresado {formatFecha(equipo.created_at)}</p>
              </CardHeader>
              <CardContent>
                {equipo.ordenes.length === 0 ? (
                  <p className="text-xs text-ink-muted py-2">Sin órdenes asociadas.</p>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {equipo.ordenes.map((orden) => (
                      <li key={orden.id}>
                        <Link
                          href={`/ordenes/${orden.id}`}
                          className="py-2.5 flex items-center gap-3 hover:bg-white/[0.03] -mx-2 px-2 rounded-md transition-colors group"
                        >
                          <span className="text-xs font-mono text-ink-muted shrink-0">
                            {formatNumeroOt(orden.numero_ot)}
                          </span>
                          <span className="text-sm text-ink-primary truncate flex-1 group-hover:text-accent-green transition-colors">
                            {orden.falla_declarada}
                          </span>
                          {orden.es_urgente && (
                            <Badge variant="danger" className="shrink-0 text-[10px]">Urgente</Badge>
                          )}
                          <Badge variant={BADGE_VARIANT[orden.estado]} className="shrink-0">
                            {ESTADO_LABELS[orden.estado]}
                          </Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
