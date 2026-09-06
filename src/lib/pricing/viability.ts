/**
 * Lógica de viabilidad financiera por orden.
 *
 * Modelo:
 * - costo_hora_piso: lo que le cuesta al taller mantener la puerta abierta
 *   por hora (cubre estructura fija + sueldo del técnico).
 * - tarifa_hora_estandar / micro: lo que el taller cobra por hora de banco,
 *   según tipo de intervención.
 * - presupuesto = MO + repuestos. El análisis compara SOLO el componente MO
 *   contra el tiempo consumido.
 *
 * Semáforo (umbrales configurables):
 * - OPTIMA: costo acumulado < umbral amarillo (default 70% del presupuesto MO).
 * - RIESGO_MARGEN: entre umbral amarillo y umbral rojo (default 70-100%).
 * - DEFICITARIA: costo acumulado >= presupuesto MO (perdiste plata).
 */

import type {
  TipoIntervencion,
  ViabilityConfig,
  ViabilityResult,
} from "@/types";

export const DEFAULT_CONFIG: ViabilityConfig = {
  costoHoraPisoArs: 17000,
  tarifaHoraEstandarArs: 25000,
  tarifaHoraMicroArs: 40000,
  umbralAmarilloPct: 0.7,
  umbralRojoPct: 1.0,
};

export function tarifaHoraPara(
  tipo: TipoIntervencion,
  config: ViabilityConfig
): number {
  return tipo === "microscopio"
    ? config.tarifaHoraMicroArs
    : config.tarifaHoraEstandarArs;
}

export interface ViabilityInput {
  tiempoTotalSeg: number;
  presupuestoTotalArs: number;
  costoRepuestosArs: number;
  tipoIntervencion: TipoIntervencion;
}

export function calcularViabilidadOrden(
  input: ViabilityInput,
  config: ViabilityConfig = DEFAULT_CONFIG
): ViabilityResult {
  const { tiempoTotalSeg, presupuestoTotalArs, costoRepuestosArs, tipoIntervencion } = input;

  const horasConsumidas = Math.max(0, tiempoTotalSeg / 3600);
  const presupuestoMOArs = Math.max(0, presupuestoTotalArs - costoRepuestosArs);
  const tarifaCobradaHoraArs = tarifaHoraPara(tipoIntervencion, config);
  const costoOperativoAcumuladoArs = horasConsumidas * config.costoHoraPisoArs;
  const gananciaNetaMOArs = presupuestoMOArs - costoOperativoAcumuladoArs;

  const margenPorcentaje =
    presupuestoMOArs > 0
      ? (gananciaNetaMOArs / presupuestoMOArs) * 100
      : 0;

  const horasMaximas =
    config.costoHoraPisoArs > 0
      ? presupuestoMOArs / config.costoHoraPisoArs
      : 0;
  const horasRestantesRentables = Math.max(0, horasMaximas - horasConsumidas);

  let status: ViabilityResult["status"] = "OPTIMA";
  let accionRecomendada = "Operación con margen comercial saludable.";

  if (presupuestoMOArs <= 0) {
    // Orden sin presupuesto MO asignado (ej: garantía, presupuesto sin
    // cargar). Tratamos como riesgosa por default.
    status = "RIESGO_MARGEN";
    accionRecomendada =
      "Asigná un presupuesto para evaluar la viabilidad de la orden.";
  } else if (costoOperativoAcumuladoArs >= presupuestoMOArs * config.umbralRojoPct) {
    status = "DEFICITARIA";
    accionRecomendada =
      "DETENER O RECOTIZAR: el tiempo consumido ya excedió el presupuesto de mano de obra.";
  } else if (
    costoOperativoAcumuladoArs >=
    presupuestoMOArs * config.umbralAmarilloPct
  ) {
    status = "RIESGO_MARGEN";
    accionRecomendada =
      `ALERTA: se consumió el ${Math.round(config.umbralAmarilloPct * 100)}% del margen de MO. Limitá pruebas a diagnóstico rápido.`;
  }

  return {
    horasConsumidas: round2(horasConsumidas),
    horasConsumidasFormateadas: formatHoras(horasConsumidas),
    presupuestoMOArs: Math.round(presupuestoMOArs),
    costoOperativoAcumuladoArs: Math.round(costoOperativoAcumuladoArs),
    tarifaCobradaHoraArs,
    gananciaNetaMOArs: Math.round(gananciaNetaMOArs),
    margenPorcentaje: round1(margenPorcentaje),
    horasRestantesRentables: round2(horasRestantesRentables),
    status,
    accionRecomendada,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function formatHoras(h: number): string {
  if (h < 1 / 60) return `${Math.round(h * 3600)}s`;
  if (h < 1) return `${Math.round(h * 60)}m`;
  const horas = Math.floor(h);
  const minutos = Math.round((h - horas) * 60);
  if (minutos === 0) return `${horas}h`;
  return `${horas}h ${minutos}m`;
}

export function statusBadgeStyles(status: ViabilityResult["status"]): {
  bg: string;
  text: string;
  label: string;
} {
  switch (status) {
    case "OPTIMA":
      return {
        bg: "bg-status-green/15 border-status-green/30",
        text: "text-status-green",
        label: "Margen OK",
      };
    case "RIESGO_MARGEN":
      return {
        bg: "bg-status-yellow/15 border-status-yellow/30",
        text: "text-status-yellow",
        label: "Margen en riesgo",
      };
    case "DEFICITARIA":
      return {
        bg: "bg-status-red/15 border-status-red/30",
        text: "text-status-red",
        label: "Deficitaria",
      };
  }
}
