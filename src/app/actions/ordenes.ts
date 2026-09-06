"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import type { EstadoOrden } from "@/types";
import { ordenFormSchema, type OrdenFormInput } from "@/lib/validations/orden";
import { autoStopSesionActiva } from "./tiempo";

export type ActualizarEstadoResult =
  | { ok: true; pausaSugerida?: boolean; autoStop?: boolean }
  | { ok: false; error: string };

export async function actualizarEstadoOrden(
  ordenId: string,
  nuevoEstado: EstadoOrden
): Promise<ActualizarEstadoResult> {
  const supabase = await createServerClient();

  const { data: ordenActual, error: fetchError } = await supabase
    .from("ordenes")
    .select("estado")
    .eq("id", ordenId)
    .single();

  if (fetchError || !ordenActual) {
    return { ok: false, error: fetchError?.message ?? "Orden no encontrada" };
  }

  if (ordenActual.estado === nuevoEstado) {
    return { ok: true };
  }

  const { error: updateError } = await supabase
    .from("ordenes")
    .update({ estado: nuevoEstado })
    .eq("id", ordenId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  // Auto-stop del timer si la orden se cierra definitivamente
  let autoStop = false;
  if (nuevoEstado === "entregado" || nuevoEstado === "cancelado") {
    await autoStopSesionActiva(
      ordenId,
      `Orden marcada como ${nuevoEstado}`
    );
    autoStop = true;
  }

  await supabase.from("historial_estados").insert({
    orden_id: ordenId,
    estado_anterior: ordenActual.estado,
    estado_nuevo: nuevoEstado,
    nota_interna: null,
    nota_cliente: null,
    fotos_urls: null,
  });

  revalidatePath("/kanban");
  revalidatePath("/");
  revalidatePath(`/ordenes/${ordenId}`);

  return {
    ok: true,
    pausaSugerida: nuevoEstado === "esperando_repuesto" ? true : undefined,
    autoStop: autoStop ? true : undefined,
  };
}

export type CrearOrdenResult =
  | { ok: true; ordenId: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function crearOrden(
  input: OrdenFormInput
): Promise<CrearOrdenResult> {
  const parsed = ordenFormSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_";
      fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Revisá los datos del formulario", fieldErrors };
  }
  const data = parsed.data;

  const supabase = await createServerClient();

  let clienteId: string;
  if (data.clienteModo === "nuevo") {
    const { data: nuevo, error: clienteError } = await supabase
      .from("clientes")
      .insert({
        nombre: data.nombre,
        telefono: data.telefono,
        email: data.email || null,
      })
      .select("id")
      .single();
    if (clienteError || !nuevo) {
      return { ok: false, error: clienteError?.message ?? "No se pudo crear el cliente" };
    }
    clienteId = nuevo.id;
  } else {
    clienteId = data.clienteId;
  }

  const { data: equipo, error: equipoError } = await supabase
    .from("equipos")
    .insert({
      cliente_id: clienteId,
      tipo: data.tipo,
      marca: data.marca,
      modelo: data.modelo,
      numero_serie: data.numeroSerie || null,
      clave_desbloqueo: data.claveDesbloqueo || null,
      accesorios: data.accesorios || null,
    })
    .select("id")
    .single();

  if (equipoError || !equipo) {
    return { ok: false, error: equipoError?.message ?? "No se pudo registrar el equipo" };
  }

  const { data: orden, error: ordenError } = await supabase
    .from("ordenes")
    .insert({
      equipo_id: equipo.id,
      falla_declarada: data.fallaDeclarada,
      presupuesto: data.presupuesto ?? 0,
      es_urgente: data.esUrgente,
      fecha_promesa: data.fechaPromesa || null,
      estado: "ingresado",
    })
    .select("id")
    .single();

  if (ordenError || !orden) {
    return { ok: false, error: ordenError?.message ?? "No se pudo crear la orden" };
  }

  await supabase.from("historial_estados").insert({
    orden_id: orden.id,
    estado_anterior: null,
    estado_nuevo: "ingresado",
    nota_interna: "Orden creada desde formulario de ingreso",
    nota_cliente: null,
    fotos_urls: null,
  });

  revalidatePath("/kanban");
  revalidatePath("/");
  revalidatePath("/ordenes");

  return { ok: true, ordenId: orden.id };
}

export async function crearOrdenYRedirigir(
  input: OrdenFormInput
): Promise<CrearOrdenResult> {
  const result = await crearOrden(input);
  if (result.ok) {
    redirect(`/ordenes/${result.ordenId}`);
  }
  return result;
}
