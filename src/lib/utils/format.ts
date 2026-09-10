import { format, formatDistanceToNow, differenceInHours, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

export function formatFecha(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy", { locale: es });
}

export function formatFechaHora(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy, HH:mm", { locale: es });
}

export function formatTiempoTranscurrido(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: es });
}

export function formatTiempoCorto(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const horas = differenceInHours(new Date(), d);
  const dias = differenceInDays(new Date(), d);
  
  if (dias > 0) {
    return `${dias}d ${horas % 24}h`;
  }
  return `${horas}h`;
}

export function formatNumeroOt(numero: number): string {
  return `OT-${numero.toString().padStart(4, "0")}`;
}

export function formatCurrency(monto: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(monto);
}

export function formatWhatsAppDisplay(numero: string): string {
  const d = numero.replace(/\D/g, "");
  if (d.startsWith("549") && d.length >= 12) {
    return `+54 9 ${d.slice(3, 5)} ${d.slice(5, 9)}-${d.slice(9, 13)}`;
  }
  if (d.length >= 10) {
    return `+${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 8)}-${d.slice(8, 12)}`;
  }
  return d;
}
