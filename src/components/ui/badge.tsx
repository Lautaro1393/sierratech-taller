import { ReactNode } from "react";

type BadgeVariant = 
  | "default" 
  | "success" 
  | "warning" 
  | "danger" 
  | "info"
  | "ingresado"
  | "diagnostico"
  | "repuesto"
  | "reparacion"
  | "listo"
  | "entregado";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-hover text-ink-secondary",
  success: "bg-status-green/20 text-status-green",
  warning: "bg-status-yellow/20 text-status-yellow",
  danger: "bg-status-red/20 text-status-red",
  info: "bg-status-blue/20 text-status-blue",
  ingresado: "bg-[#3B82F6]/20 text-[#3B82F6]",
  diagnostico: "bg-[#8B5CF6]/20 text-[#8B5CF6]",
  repuesto: "bg-[#F59E0B]/20 text-[#F59E0B]",
  reparacion: "bg-[#EC4899]/20 text-[#EC4899]",
  listo: "bg-[#22C55E]/20 text-[#22C55E]",
  entregado: "bg-[#6B7280]/20 text-[#6B7280]",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-ink-secondary",
  success: "bg-status-green",
  warning: "bg-status-yellow",
  danger: "bg-status-red",
  info: "bg-status-blue",
  ingresado: "bg-[#3B82F6]",
  diagnostico: "bg-[#8B5CF6]",
  repuesto: "bg-[#F59E0B]",
  reparacion: "bg-[#EC4899]",
  listo: "bg-[#22C55E]",
  entregado: "bg-[#6B7280]",
};

export function Badge({ children, variant = "default", className = "", dot = false }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2 py-0.5 rounded-full text-xs font-medium
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}
