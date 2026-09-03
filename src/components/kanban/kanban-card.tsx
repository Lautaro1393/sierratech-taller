"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { formatTiempoCorto, formatNumeroOt, generateWhatsAppLink } from "@/lib/utils";
import { getSemaphoreStyles } from "@/lib/utils/semaphore";
import { Badge } from "@/components/ui/badge";
import type { OrdenConRelaciones } from "@/types";

interface KanbanCardProps {
  orden: OrdenConRelaciones;
  isOverlay?: boolean;
}

export function KanbanCard({ orden, isOverlay = false }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: orden.id, disabled: isOverlay });

  const semaphore = getSemaphoreStyles(
    getSemaphoreFromUpdated(orden.updated_at, orden.es_urgente)
  );

  const waLink = generateWhatsAppLink({
    telefono: orden.equipo.cliente.telefono,
    estado: orden.estado,
    numeroOt: orden.numero_ot,
    nombreCliente: orden.equipo.cliente.nombre,
  });

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={
        !isOverlay && transform
          ? { transform: CSS.Translate.toString(transform) }
          : undefined
      }
      className={`
        group relative rounded-lg p-3
        bg-surface-base border border-white/5 border-l-4
        ${semaphore}
        ${isOverlay ? "shadow-2xl shadow-black/50 rotate-1" : ""}
        ${isDragging ? "opacity-30" : ""}
        transition-shadow
      `}
      {...(isOverlay ? {} : listeners)}
      {...(isOverlay ? {} : attributes)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-mono text-sm font-semibold text-accent">
          {formatNumeroOt(orden.numero_ot)}
        </span>
        {orden.es_urgente && (
          <Badge variant="danger" dot>
            Urgente
          </Badge>
        )}
      </div>

      <p className="text-sm font-medium text-ink-primary line-clamp-2 mb-1">
        {orden.equipo.cliente.nombre}
      </p>
      <p className="text-xs text-ink-secondary line-clamp-1 mb-2">
        {orden.equipo.marca} {orden.equipo.modelo}
      </p>

      <p className="text-xs text-ink-muted line-clamp-2 mb-3">
        {orden.falla_declarada}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-muted">
          {formatTiempoCorto(orden.updated_at)}
        </span>
        <div
          className={`
            flex items-center gap-1
            ${isOverlay ? "" : "opacity-0 group-hover:opacity-100"}
            transition-opacity
          `}
        >
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-md text-ink-muted hover:text-status-green hover:bg-surface-hover transition-colors"
            title="Enviar WhatsApp al cliente"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </a>
          <Link
            href={`/ordenes/${orden.id}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-md text-ink-muted hover:text-accent hover:bg-surface-hover transition-colors"
            title="Ver detalle"
          >
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

function getSemaphoreFromUpdated(
  updatedAt: string,
  esUrgente: boolean
): "green" | "yellow" | "red" {
  if (esUrgente) return "red";
  const horas = (Date.now() - new Date(updatedAt).getTime()) / 3_600_000;
  if (horas < 48) return "green";
  if (horas < 120) return "yellow";
  return "red";
}
