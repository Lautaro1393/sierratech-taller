import { differenceInHours } from "date-fns";

export type SemaphoreColor = "green" | "yellow" | "red";

export function getSemaphoreColor(
  updatedAt: Date | string,
  esUrgente: boolean
): SemaphoreColor {
  const fechaActualizacion = typeof updatedAt === "string" 
    ? new Date(updatedAt) 
    : updatedAt;
  
  const horas = differenceInHours(new Date(), fechaActualizacion);
  
  if (esUrgente) return "red";
  if (horas < 48) return "green";
  if (horas < 120) return "yellow"; // 5 días
  return "red";
}

export function getSemaphoreLabel(color: SemaphoreColor): string {
  const labels: Record<SemaphoreColor, string> = {
    green: "Reciente",
    yellow: "En espera",
    red: "Requiere atención",
  };
  return labels[color];
}

export function getSemaphoreStyles(color: SemaphoreColor): string {
  const styles: Record<SemaphoreColor, string> = {
    green: "border-l-status-green semaphore-green",
    yellow: "border-l-status-yellow semaphore-yellow",
    red: "border-l-status-red semaphore-red",
  };
  return styles[color];
}
