export type EstadoOrden = 
  | "ingresado"
  | "en_diagnostico"
  | "esperando_repuesto"
  | "en_reparacion"
  | "listo_para_retiro"
  | "entregado"
  | "cancelado";

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  created_at: string;
}

export interface Equipo {
  id: string;
  cliente_id: string;
  tipo: string;
  marca: string;
  modelo: string;
  numero_serie: string | null;
  clave_desbloqueo: string | null;
  accesorios: string | null;
  created_at: string;
}

export interface Orden {
  id: string;
  numero_ot: number;
  public_token: string;
  equipo_id: string;
  falla_declarada: string;
  diagnostico: string | null;
  presupuesto: number;
  presupuesto_aprobado: boolean;
  estado: EstadoOrden;
  es_urgente: boolean;
  fecha_ingreso: string;
  fecha_promesa: string | null;
  fecha_entrega: string | null;
  updated_at: string;
}

export interface HistorialEstado {
  id: string;
  orden_id: string;
  estado_anterior: EstadoOrden | null;
  estado_nuevo: EstadoOrden;
  nota_interna: string | null;
  nota_cliente: string | null;
  fotos_urls: string[] | null;
  created_at: string;
}

export interface OrdenConRelaciones extends Orden {
  equipo: Equipo & { cliente: Cliente };
  historial: HistorialEstado[];
}

export const ESTADO_ORDER: EstadoOrden[] = [
  "ingresado",
  "en_diagnostico",
  "esperando_repuesto",
  "en_reparacion",
  "listo_para_retiro",
  "entregado",
];

export const ESTADO_LABELS: Record<EstadoOrden, string> = {
  ingresado: "Ingresado",
  en_diagnostico: "En Diagnóstico",
  esperando_repuesto: "Esperando Repuesto",
  en_reparacion: "En Reparación",
  listo_para_retiro: "Listo para Retiro",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const ESTADO_COLORS: Record<EstadoOrden, string> = {
  ingresado: "#3B82F6",
  en_diagnostico: "#8B5CF6",
  esperando_repuesto: "#F59E0B",
  en_reparacion: "#EC4899",
  listo_para_retiro: "#22C55E",
  entregado: "#6B7280",
  cancelado: "#EF4444",
};
