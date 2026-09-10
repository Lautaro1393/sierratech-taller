export type EstadoOrden =
  | "ingresado"
  | "en_diagnostico"
  | "esperando_repuesto"
  | "en_reparacion"
  | "listo_para_retiro"
  | "entregado"
  | "cancelado";

export type TipoIntervencion = "estandar" | "microscopio";

export type ViabilityStatus = "OPTIMA" | "RIESGO_MARGEN" | "DEFICITARIA";

export interface ViabilityConfig {
  costoHoraPisoArs: number;
  tarifaHoraEstandarArs: number;
  tarifaHoraMicroArs: number;
  umbralAmarilloPct: number;
  umbralRojoPct: number;
}

export interface Shortcuts {
  palette: string;
  nuevaOrden: string;
}

export interface ConfiguracionGeneral {
  costoFijoMensualArs: number;
  whatsappTaller: string;
  shortcuts: Shortcuts;
}

export const DEFAULT_COSTO_FIJO_MENSUAL_ARS = 1700000;
export const DEFAULT_WHATSAPP_TALLER = "5491178267986";
export const DEFAULT_SHORTCUTS: Shortcuts = {
  palette: "mod+k",
  nuevaOrden: "mod+n",
};

export interface ViabilityResult {
  horasConsumidas: number;
  horasConsumidasFormateadas: string;
  presupuestoMOArs: number;
  costoOperativoAcumuladoArs: number;
  tarifaCobradaHoraArs: number;
  gananciaNetaMOArs: number;
  margenPorcentaje: number;
  horasRestantesRentables: number;
  status: ViabilityStatus;
  accionRecomendada: string;
}

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
  tiempo_total_seg: number;
  costo_repuestos_ars: number;
  tipo_intervencion: TipoIntervencion;
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

export interface TiempoSesion {
  id: string;
  orden_id: string;
  started_at: string;
  ended_at: string | null;
  duracion_seg: number | null;
  notas: string | null;
  creado_por: string | null;
  created_at: string;
}

export interface OrdenConRelaciones extends Orden {
  equipo: Equipo & { cliente: Cliente };
  historial: HistorialEstado[];
  sesion_activa?: TiempoSesion | null;
}

export interface SesionActivaGlobal {
  sesion: TiempoSesion;
  orden: Pick<Orden, "id" | "numero_ot"> & {
    equipo: Pick<Equipo, "id" | "marca" | "modelo"> & {
      cliente: Pick<Cliente, "id" | "nombre">;
    };
  };
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
