"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";
import type { EstadoOrden } from "@/types";
import { ordenFormSchema, type OrdenFormInput } from "@/lib/validations/orden";
import { autoStopSesionActiva } from "./tiempo";
import { uploadFotoReparacion, getSignedUrls, extractFotoPaths } from "@/lib/supabase/storage";

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

  const tipoFinal = data.tipo === "otro" && data.tipoCustom?.trim()
    ? data.tipoCustom.trim().toLowerCase()
    : data.tipo;

  const { data: equipo, error: equipoError } = await supabase
    .from("equipos")
    .insert({
      cliente_id: clienteId,
      tipo: tipoFinal,
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

const presupuestoSchema = z.object({
  presupuesto: z.number().min(0, "Debe ser ≥ 0"),
  costoRepuestosArs: z.number().min(0, "Debe ser ≥ 0"),
  tipoIntervencion: z.enum(["estandar", "microscopio"]),
  presupuestoAprobado: z.boolean(),
});

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export async function actualizarPresupuestoOrden(
  ordenId: string,
  input: z.infer<typeof presupuestoSchema>
): Promise<ActionResult> {
  const parsed = presupuestoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const supabase = await createServerClient();
  const { data: ordenActual, error: fetchError } = await supabase
    .from("ordenes")
    .select("estado")
    .eq("id", ordenId)
    .single();

  if (fetchError || !ordenActual) {
    return { ok: false, error: "Orden no encontrada" };
  }

  const { error } = await supabase
    .from("ordenes")
    .update({
      presupuesto: parsed.data.presupuesto,
      costo_repuestos_ars: parsed.data.costoRepuestosArs,
      tipo_intervencion: parsed.data.tipoIntervencion,
      presupuesto_aprobado: parsed.data.presupuestoAprobado,
    })
    .eq("id", ordenId);

  if (error) return { ok: false, error: error.message };

  await supabase.from("historial_estados").insert({
    orden_id: ordenId,
    estado_anterior: ordenActual.estado,
    estado_nuevo: ordenActual.estado,
    nota_interna: `Presupuesto actualizado a $${parsed.data.presupuesto} (${parsed.data.tipoIntervencion}, repuestos $${parsed.data.costoRepuestosArs})${parsed.data.presupuestoAprobado ? " — aprobado" : ""}`,
    nota_cliente: null,
    fotos_urls: null,
  });

  revalidatePath(`/ordenes/${ordenId}`);
  revalidatePath("/kanban");
  revalidatePath("/", "layout");
  return { ok: true };
}

const notaSchema = z.object({
  nota_interna: z.string().trim().max(2000).optional().nullable(),
  nota_cliente: z.string().trim().max(2000).optional().nullable(),
});

export async function agregarNotaHistorial(
  ordenId: string,
  input: { nota_interna?: string | null; nota_cliente?: string | null }
): Promise<ActionResult<{ historialId: string }>> {
  const parsed = notaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const interna = parsed.data.nota_interna?.trim();
  const cliente = parsed.data.nota_cliente?.trim();

  if (!interna && !cliente) {
    return { ok: false, error: "Escribí al menos una nota (interna o para cliente)" };
  }

  const supabase = await createServerClient();
  const { data: ordenActual, error: fetchError } = await supabase
    .from("ordenes")
    .select("estado")
    .eq("id", ordenId)
    .single();

  if (fetchError || !ordenActual) {
    return { ok: false, error: "Orden no encontrada" };
  }

  const { data, error } = await supabase
    .from("historial_estados")
    .insert({
      orden_id: ordenId,
      estado_anterior: ordenActual.estado,
      estado_nuevo: ordenActual.estado,
      nota_interna: interna || null,
      nota_cliente: cliente || null,
      fotos_urls: null,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Error al guardar" };

  revalidatePath(`/ordenes/${ordenId}`);
  return { ok: true, data: { historialId: data.id } };
}

const MAX_FOTOS_POR_SUBIDA = 3;

export async function agregarFotoHistorial(
  ordenId: string,
  formData: FormData
): Promise<ActionResult<{ count: number }>> {
  const files = formData.getAll("files").filter(isImageFile);
  if (files.length === 0) {
    return { ok: false, error: "Subí al menos una imagen" };
  }
  if (files.length > MAX_FOTOS_POR_SUBIDA) {
    return {
      ok: false,
      error: `Máximo ${MAX_FOTOS_POR_SUBIDA} fotos por subida`,
    };
  }

  const supabase = await createServerClient();
  const { data: ordenActual, error: fetchError } = await supabase
    .from("ordenes")
    .select("estado")
    .eq("id", ordenId)
    .single();
  if (fetchError || !ordenActual) {
    return { ok: false, error: "Orden no encontrada" };
  }

  const paths: string[] = [];
  for (const file of files) {
    try {
      const path = await uploadFotoReparacion(ordenId, file as File);
      paths.push(path);
    } catch (err) {
      console.error("Error subiendo foto:", err);
      return {
        ok: false,
        error: `No se pudo subir ${(file as File).name}. Probá de nuevo.`,
      };
    }
  }

  const { error: insertError } = await supabase
    .from("historial_estados")
    .insert({
      orden_id: ordenId,
      estado_anterior: ordenActual.estado,
      estado_nuevo: ordenActual.estado,
      nota_interna: `${paths.length === 1 ? "Foto subida" : `${paths.length} fotos subidas`}`,
      nota_cliente: null,
      fotos_urls: paths,
    });

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  revalidatePath(`/ordenes/${ordenId}`);
  return { ok: true, data: { count: paths.length } };
}

function isImageFile(value: FormDataEntryValue | null): boolean {
  return (
    value !== null &&
    value !== "undefined" &&
    typeof value === "object" &&
    "name" in value &&
    value instanceof File &&
    value.type.startsWith("image/")
  );
}

export async function obtenerSignedUrlsDeOrden(
  ordenId: string,
  expiresInSeconds = 3600
): Promise<{ path: string; url: string }[]> {
  const supabase = await createServerClient();
  const { data: historial } = await supabase
    .from("historial_estados")
    .select("fotos_urls")
    .eq("orden_id", ordenId);
  if (!historial) return [];
  const paths = extractFotoPaths(historial);
  if (paths.length === 0) return [];
  return getSignedUrls(paths, expiresInSeconds);
}
