import { z } from "zod";

export const clienteSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100),
  telefono: z
    .string()
    .min(6, "Mínimo 6 dígitos")
    .max(30)
    .regex(/^[\d\s+\-()]+$/, "Solo números, espacios y + - ( )"),
  email: z
    .string()
    .email("Email inválido")
    .or(z.literal(""))
    .optional(),
});

export const equipoSchema = z.object({
  clienteId: z.string().uuid("ID de cliente inválido"),
  tipo: z.enum(["notebook", "smartphone", "tablet", "monitor", "otro"], {
    message: "Seleccioná un tipo",
  }),
  tipoCustom: z
    .string()
    .max(40, "Máximo 40 caracteres")
    .optional()
    .or(z.literal("")),
  marca: z.string().min(1, "Ingresá la marca").max(60),
  modelo: z.string().min(1, "Ingresá el modelo").max(80),
  numeroSerie: z.string().max(80).optional().or(z.literal("")),
  claveDesbloqueo: z.string().max(80).optional().or(z.literal("")),
  accesorios: z.string().max(200).optional().or(z.literal("")),
});

export const ordenSchema = z.object({
  equipoId: z.string().uuid("ID de equipo inválido"),
  fallaDeclarada: z.string().min(5, "Describí brevemente la falla").max(500),
  presupuesto: z
    .union([z.number().nonnegative(), z.literal(0)])
    .default(0),
  esUrgente: z.boolean().default(false),
  fechaPromesa: z.string().optional().or(z.literal("")),
});

export const ordenFormSchema = z.discriminatedUnion("clienteModo", [
  z.object({
    clienteModo: z.literal("existente"),
    clienteId: z.string().uuid("Seleccioná un cliente"),
    tipo: equipoSchema.shape.tipo,
    tipoCustom: equipoSchema.shape.tipoCustom,
    marca: equipoSchema.shape.marca,
    modelo: equipoSchema.shape.modelo,
    numeroSerie: equipoSchema.shape.numeroSerie,
    claveDesbloqueo: equipoSchema.shape.claveDesbloqueo,
    accesorios: equipoSchema.shape.accesorios,
    fallaDeclarada: ordenSchema.shape.fallaDeclarada,
    presupuesto: ordenSchema.shape.presupuesto,
    esUrgente: ordenSchema.shape.esUrgente,
    fechaPromesa: ordenSchema.shape.fechaPromesa,
  }),
  z.object({
    clienteModo: z.literal("nuevo"),
    nombre: clienteSchema.shape.nombre,
    telefono: clienteSchema.shape.telefono,
    email: clienteSchema.shape.email,
    tipo: equipoSchema.shape.tipo,
    tipoCustom: equipoSchema.shape.tipoCustom,
    marca: equipoSchema.shape.marca,
    modelo: equipoSchema.shape.modelo,
    numeroSerie: equipoSchema.shape.numeroSerie,
    claveDesbloqueo: equipoSchema.shape.claveDesbloqueo,
    accesorios: equipoSchema.shape.accesorios,
    fallaDeclarada: ordenSchema.shape.fallaDeclarada,
    presupuesto: ordenSchema.shape.presupuesto,
    esUrgente: ordenSchema.shape.esUrgente,
    fechaPromesa: ordenSchema.shape.fechaPromesa,
  }),
]);

export type OrdenFormInput = z.infer<typeof ordenFormSchema>;
