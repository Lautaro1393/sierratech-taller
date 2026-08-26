import { EstadoOrden, ESTADO_LABELS } from "@/types";

const WA_BASE_URL = "https://wa.me";

interface WhatsAppMessageOptions {
  telefono: string;
  estado?: EstadoOrden;
  numeroOt?: string | number;
  nombreCliente?: string;
  nombreEquipo?: string;
}

export function generateWhatsAppLink({
  telefono,
  estado,
  numeroOt,
  nombreCliente,
  nombreEquipo,
}: WhatsAppMessageOptions): string {
  const numeroLimpio = telefono.replace(/\D/g, "");
  
  let mensaje = "";
  
  if (estado) {
    const mensajesPorEstado: Partial<Record<EstadoOrden, string>> = {
      ingresado: "Recibimos tu equipo y ya está en nuestro sistema. Te avisaremos cuando tengamos novedades.",
      en_diagnostico: "Estamos revisando tu equipo. Te informamos el diagnóstico pronto.",
      esperando_repuesto: "Tu equipo necesita un repuesto. Te avisamos cuando llegue.",
      en_reparacion: "¡Comenzamos con la reparación! Te mantendremos informado.",
      listo_para_retiro: "¡Tu equipo ya está listo! Podés pasar a retirarlo por nuestro taller.",
      entregado: "¡Gracias por confiar en nosotros! Si tenés alguna consulta, no dudes en escribirnos.",
      cancelado: "Lamentablemente debimos cancelar la orden. Comunicate con nosotros para más información.",
    };
    
    mensaje = mensajesPorEstado[estado] || "";
  }
  
  if (numeroOt && nombreCliente) {
    mensaje = `Hola ${nombreCliente}! Tu equipo (OT #${numeroOt}) está: ${ESTADO_LABELS[estado!]}. ${mensaje}`;
  }
  
  const mensajeEncoded = encodeURIComponent(mensaje);
  
  return `${WA_BASE_URL}/${numeroLimpio}?text=${mensajeEncoded}`;
}

export function formatTelefonoParaLink(telefono: string): string {
  return telefono.replace(/\D/g, "");
}
