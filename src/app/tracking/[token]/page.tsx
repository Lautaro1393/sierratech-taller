import Link from "next/link";
import {
  getOrdenPublicaByToken,
  getHistorialPublicoByToken,
} from "@/lib/queries/tracking";
import { ESTADO_LABELS, type EstadoOrden } from "@/types";
import { formatFecha, formatFechaHora } from "@/lib/utils";

const ESTADO_PUBLIC_LABELS: Record<EstadoOrden, { titulo: string; subtitulo: string }> = {
  ingresado: {
    titulo: "Recibimos tu equipo",
    subtitulo: "Lo estamos registrando para empezar a revisarlo.",
  },
  en_diagnostico: {
    titulo: "Estamos revisando tu equipo",
    subtitulo: "Pronto te vamos a contar qué encontramos.",
  },
  esperando_repuesto: {
    titulo: "Esperamos un repuesto para continuar",
    subtitulo: "Te avisamos en cuanto llegue para retomar la reparación.",
  },
  en_reparacion: {
    titulo: "Estamos reparando tu equipo",
    subtitulo: "Estamos trabajando para dejarlo listo cuanto antes.",
  },
  listo_para_retiro: {
    titulo: "¡Listo para retirar!",
    subtitulo: "Pasá por nuestro taller cuando puedas para retirarlo.",
  },
  entregado: {
    titulo: "Entregado",
    subtitulo: "Gracias por confiar en nosotros.",
  },
  cancelado: {
    titulo: "Orden cancelada",
    subtitulo: "Comunicate con nosotros si necesitás más información.",
  },
};

const ESTADO_PUBLIC_STYLES: Record<EstadoOrden, { bg: string; text: string; border: string }> = {
  ingresado: { bg: "bg-[#3B82F6]/15", text: "text-[#3B82F6]", border: "border-[#3B82F6]/30" },
  en_diagnostico: { bg: "bg-[#8B5CF6]/15", text: "text-[#8B5CF6]", border: "border-[#8B5CF6]/30" },
  esperando_repuesto: { bg: "bg-[#F59E0B]/15", text: "text-[#F59E0B]", border: "border-[#F59E0B]/30" },
  en_reparacion: { bg: "bg-[#EC4899]/15", text: "text-[#EC4899]", border: "border-[#EC4899]/30" },
  listo_para_retiro: { bg: "bg-[#22C55E]/15", text: "text-[#22C55E]", border: "border-[#22C55E]/30" },
  entregado: { bg: "bg-[#6B7280]/15", text: "text-[#6B7280]", border: "border-[#6B7280]/30" },
  cancelado: { bg: "bg-[#EF4444]/15", text: "text-[#EF4444]", border: "border-[#EF4444]/30" },
};

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [orden, historial] = await Promise.all([
    getOrdenPublicaByToken(token),
    getHistorialPublicoByToken(token),
  ]);

  if (!orden) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <p className="font-display text-2xl font-bold text-ink-primary">
            Link no válido
          </p>
          <p className="text-ink-secondary text-sm">
            No encontramos una orden con este link. Verificá que esté bien copiado
            o pedí uno nuevo al taller.
          </p>
          <Link
            href="/"
            className="inline-block mt-2 text-sm text-accent hover:underline"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  const estado = orden.estado as EstadoOrden;
  const style = ESTADO_PUBLIC_STYLES[estado];
  const copy = ESTADO_PUBLIC_LABELS[estado];
  const ordenesEstados: EstadoOrden[] = [
    "ingresado",
    "en_diagnostico",
    "esperando_repuesto",
    "en_reparacion",
    "listo_para_retiro",
    "entregado",
  ];
  const indiceActual = ordenesEstados.indexOf(estado);

  return (
    <div className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <p className="text-xs uppercase tracking-wider text-ink-muted">
            SierraTech Taller
          </p>
          <p className="font-mono text-sm text-accent">
            OT-{orden.numero_ot.toString().padStart(4, "0")}
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-primary">
            Hola, {orden.cliente_nombre.split(" ")[0]}
          </h1>
          <p className="text-sm text-ink-secondary">
            {orden.marca} {orden.modelo}
            {orden.es_urgente && (
              <span className="ml-2 inline-block px-2 py-0.5 text-xs font-medium text-status-red bg-status-red/15 border border-status-red/30 rounded-full">
                Urgente
              </span>
            )}
          </p>
        </header>

        <section
          className={`glass-card p-6 border-2 ${style.border} ${style.bg}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className={`w-3 h-3 rounded-full ${style.text.replace("text-", "bg-")}`} />
            <p className={`text-xs uppercase tracking-wider font-semibold ${style.text}`}>
              Estado actual
            </p>
          </div>
          <h2 className="font-display text-xl font-bold text-ink-primary mb-1">
            {copy.titulo}
          </h2>
          <p className="text-sm text-ink-secondary">{copy.subtitulo}</p>
        </section>

        <section className="glass-card p-6">
          <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold mb-4">
            Progreso
          </p>
          <ol className="space-y-3">
            {ordenesEstados.map((e, idx) => {
              const completed = idx < indiceActual;
              const isActual = idx === indiceActual;
              const styleE = ESTADO_PUBLIC_STYLES[e];
              const labelE = ESTADO_PUBLIC_LABELS[e].titulo;
              return (
                <li key={e} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center pt-1">
                    <span
                      className={`
                        w-3 h-3 rounded-full shrink-0
                        ${
                          completed
                            ? "bg-status-green"
                            : isActual
                              ? `${styleE.text.replace("text-", "bg-")} animate-pulse`
                              : "bg-surface-hover"
                        }
                      `}
                    />
                    {idx < ordenesEstados.length - 1 && (
                      <span
                        className={`w-px h-6 mt-1 ${completed ? "bg-status-green/40" : "bg-white/5"}`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      completed || isActual
                        ? "text-ink-primary"
                        : "text-ink-muted"
                    }`}
                  >
                    {labelE}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        {historial.length > 0 && (
          <section className="glass-card p-6">
            <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold mb-4">
              Mensajes del taller
            </p>
            <ol className="space-y-4">
              {historial.map((h) => {
                const estadoNuevo = h.estado_nuevo as EstadoOrden;
                const styleE = ESTADO_PUBLIC_STYLES[estadoNuevo];
                const labelE = ESTADO_LABELS[estadoNuevo];
                return (
                  <li key={h.id} className="flex gap-3">
                    <div className="flex flex-col items-center pt-1">
                      <span
                        className={`w-2 h-2 rounded-full ${styleE.text.replace("text-", "bg-")}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-ink-primary">
                          {labelE}
                        </p>
                        <span className="text-xs text-ink-muted">
                          {formatFechaHora(h.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-ink-secondary mt-1">
                        “{h.nota_cliente}”
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        <section className="glass-card p-6">
          <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold mb-3">
            Detalle del equipo
          </p>
          <dl className="space-y-2 text-sm">
            <Row label="Falla declarada" value={orden.falla_declarada} />
            <Row label="Tipo" value={orden.tipo} />
            <Row label="Ingreso" value={formatFecha(orden.fecha_ingreso)} />
            {orden.fecha_promesa && (
              <Row label="Promesa" value={formatFecha(orden.fecha_promesa)} />
            )}
            {orden.fecha_entrega && (
              <Row label="Entregado" value={formatFecha(orden.fecha_entrega)} />
            )}
          </dl>
        </section>

        <footer className="text-center pt-4 space-y-2">
          <p className="text-xs text-ink-muted">
            ¿Tenés dudas? Escribinos por WhatsApp al{" "}
            <a
              href={`https://wa.me/5491178267986?text=${encodeURIComponent(`Hola! Tengo una consulta sobre mi equipo (OT-${orden.numero_ot.toString().padStart(4, "0")})`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              +54 9 11 7826-7986
            </a>
          </p>
          <p className="text-xs text-ink-muted">
            SierraTech · Almagro, Buenos Aires
          </p>
        </footer>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted shrink-0">{label}</dt>
      <dd className="text-ink-primary text-right">{value}</dd>
    </div>
  );
}
