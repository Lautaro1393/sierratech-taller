/**
 * Utilidades para formato y cálculo de tiempo/costo.
 * Todas las funciones son puras y seguras para usar en cliente o servidor.
 */

export function formatHMS(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
  }
  if (m > 0) {
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  }
  return `${s}s`;
}

export function formatCorto(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function formatTiempoHumano(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${total}s`;
}

export function calcularCosto(segundos: number, tarifaHora: number): number {
  if (tarifaHora <= 0) return 0;
  return (segundos / 3600) * tarifaHora;
}

export function calcularMargen(presupuesto: number, costo: number): number {
  if (presupuesto <= 0) return 0;
  return ((presupuesto - costo) / presupuesto) * 100;
}

export type SemforoMargen = "green" | "yellow" | "red";

export function getSemforoMargen(margenPct: number): SemforoMargen {
  if (margenPct > 30) return "green";
  if (margenPct >= 0) return "yellow";
  return "red";
}

/**
 * Calcula el tiempo total acumulado de una orden, incluyendo la sesión activa.
 * @param tiempoTotalSeg - Tiempo de sesiones cerradas (viene de ordenes.tiempo_total_seg)
 * @param sesionActiva - Sesión activa opcional (si existe, se suma su tiempo transcurrido)
 */
export function tiempoEfectivoSeg(
  tiempoTotalSeg: number,
  sesionActiva: { started_at: string } | null,
  ahora: Date = new Date()
): number {
  let total = tiempoTotalSeg;
  if (sesionActiva) {
    const elapsed = Math.floor(
      (ahora.getTime() - new Date(sesionActiva.started_at).getTime()) / 1000
    );
    total += Math.max(0, elapsed);
  }
  return total;
}
