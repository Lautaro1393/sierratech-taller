"use client";

import { useState, useTransition } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateInput } from "@/components/ui/date-input";
import { ClienteAutocomplete } from "./cliente-autocomplete";
import { QrScannerButton } from "@/components/orden/scanner/qr-scanner-button";
import { crearOrdenYRedirigir } from "@/app/actions/ordenes";
import type { Cliente } from "@/types";

interface OrdenFormProps {
  clientes: Pick<Cliente, "id" | "nombre" | "telefono" | "email">[];
  marcas: string[];
  modelos: string[];
  tiposCustom: string[];
}

const TIPO_BASE = [
  { value: "notebook", label: "Notebook" },
  { value: "smartphone", label: "Smartphone" },
  { value: "tablet", label: "Tablet" },
  { value: "monitor", label: "Monitor" },
];

export function OrdenForm({
  clientes,
  marcas,
  modelos,
  tiposCustom,
}: OrdenFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [clienteModo, setClienteModo] = useState<"existente" | "nuevo">(
    clientes.length > 0 ? "existente" : "nuevo"
  );
  const [clienteId, setClienteId] = useState<string>("");

  const [tipo, setTipo] = useState<string>("");
  const [tipoCustom, setTipoCustom] = useState<string>("");
  const [marca, setMarca] = useState<string>("");
  const [modelo, setModelo] = useState<string>("");
  const [numeroSerie, setNumeroSerie] = useState<string>("");

  const tipoOptions = [
    ...TIPO_BASE,
    ...tiposCustom.map((t) => ({ value: `otro:${t}`, label: `${t} (otro)` })),
    { value: "otro", label: "+ Otro tipo" },
  ];

  async function handleSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});

    const presupuestoRaw = formData.get("presupuesto") as string;
    const presupuesto = presupuestoRaw ? Number(presupuestoRaw) : 0;

    const fechaPromesa = (formData.get("fechaPromesa") as string) || "";

    // Si el value es "otro:speaker", guardar el prefijo y usar tipoCustom
    let tipoFinal: "notebook" | "smartphone" | "tablet" | "monitor" | "otro" =
      "otro";
    if (tipo.startsWith("otro:")) {
      tipoFinal = "otro";
    } else if (tipo === "otro") {
      tipoFinal = "otro";
    } else {
      tipoFinal = tipo as typeof tipoFinal;
    }

    const input =
      clienteModo === "existente"
        ? {
            clienteModo: "existente" as const,
            clienteId,
            tipo: tipoFinal,
            tipoCustom: tipoCustom.trim() || undefined,
            marca,
            modelo,
            numeroSerie,
            claveDesbloqueo: (formData.get("claveDesbloqueo") as string) || "",
            accesorios: (formData.get("accesorios") as string) || "",
            fallaDeclarada: formData.get("fallaDeclarada") as string,
            presupuesto,
            esUrgente: formData.get("esUrgente") === "on",
            fechaPromesa,
          }
        : {
            clienteModo: "nuevo" as const,
            nombre: formData.get("nombre") as string,
            telefono: formData.get("telefono") as string,
            email: (formData.get("email") as string) || "",
            tipo: tipoFinal,
            tipoCustom: tipoCustom.trim() || undefined,
            marca,
            modelo,
            numeroSerie,
            claveDesbloqueo: (formData.get("claveDesbloqueo") as string) || "",
            accesorios: (formData.get("accesorios") as string) || "",
            fallaDeclarada: formData.get("fallaDeclarada") as string,
            presupuesto,
            esUrgente: formData.get("esUrgente") === "on",
            fechaPromesa,
          };

    startTransition(async () => {
      const result = await crearOrdenYRedirigir(input);
      if (!result.ok) {
        setError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      {error && (
        <div className="glass-card p-4 text-sm text-status-red border-status-red/30">
          {error}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-sm font-semibold text-ink-secondary uppercase tracking-wider">
          Cliente
        </h2>

        {clientes.length > 0 && (
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setClienteModo("existente")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                clienteModo === "existente"
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "bg-surface-hover text-ink-muted border border-white/5"
              }`}
            >
              Existente
            </button>
            <button
              type="button"
              onClick={() => {
                setClienteModo("nuevo");
                setClienteId("");
              }}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                clienteModo === "nuevo"
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "bg-surface-hover text-ink-muted border border-white/5"
              }`}
            >
              Nuevo
            </button>
          </div>
        )}

        {clienteModo === "existente" ? (
          <ClienteAutocomplete
            clientes={clientes}
            selectedId={clienteId}
            onSelect={setClienteId}
            onNew={() => {
              setClienteModo("nuevo");
              setClienteId("");
            }}
          />
        ) : (
          <div className="space-y-4">
            <Input
              name="nombre"
              label="Nombre completo"
              placeholder="Ej: Juan Pérez"
              required
              autoComplete="name"
              error={fieldErrors.nombre}
            />
            <Input
              name="telefono"
              type="tel"
              label="Teléfono"
              placeholder="+54 9 11 5555-1234"
              required
              autoComplete="tel"
              error={fieldErrors.telefono}
            />
            <Input
              name="email"
              type="email"
              label="Email (opcional)"
              placeholder="cliente@example.com"
              autoComplete="email"
              error={fieldErrors.email}
            />
          </div>
        )}

        {fieldErrors.clienteId && (
          <p className="text-xs text-status-red">{fieldErrors.clienteId}</p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-sm font-semibold text-ink-secondary uppercase tracking-wider">
          Equipo
        </h2>

        <Select
          name="tipo"
          label="Tipo"
          options={tipoOptions}
          placeholder="Seleccioná..."
          required
          error={fieldErrors.tipo}
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        />

        {tipo === "otro" && (
          <Input
            name="tipoCustom"
            label="Especificá el tipo"
            placeholder="Ej: Parlantes, Consola, Auriculares..."
            value={tipoCustom}
            onChange={(e) => setTipoCustom(e.target.value)}
            required
            error={fieldErrors.tipoCustom}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            name="marca"
            label="Marca"
            placeholder="Lenovo, Samsung, HP..."
            list="marcas-list"
            required
            error={fieldErrors.marca}
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
          />
          <Input
            name="modelo"
            label="Modelo"
            placeholder="IdeaPad 3, Galaxy A52..."
            list="modelos-list"
            required
            error={fieldErrors.modelo}
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
          />
        </div>

        {/* Datalists con sugerencias de la DB */}
        <datalist id="marcas-list">
          {marcas.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <datalist id="modelos-list">
          {modelos.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>

        <div>
          <label
            htmlFor="numeroSerie"
            className="block text-sm font-medium text-ink-secondary mb-1.5"
          >
            Número de serie (opcional)
          </label>
          <div className="flex gap-2">
            <input
              id="numeroSerie"
              name="numeroSerie"
              type="text"
              placeholder="Para QR o etiqueta"
              value={numeroSerie}
              onChange={(e) => setNumeroSerie(e.target.value)}
              className={`
                flex-1 px-3 py-2 rounded-lg
                bg-surface-base border border-white/10
                text-ink-primary placeholder:text-ink-muted
                focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
                transition-all duration-200
              `}
            />
            <QrScannerButton onScan={(text) => setNumeroSerie(text)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            name="claveDesbloqueo"
            label="Clave / patrón (opcional)"
            placeholder="PIN o patrón de desbloqueo"
            error={fieldErrors.claveDesbloqueo}
          />
          <Input
            name="accesorios"
            label="Accesorios recibidos (opcional)"
            placeholder="Cargador, funda, mouse..."
            error={fieldErrors.accesorios}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-sm font-semibold text-ink-secondary uppercase tracking-wider">
          Orden
        </h2>

        <Textarea
          name="fallaDeclarada"
          label="Falla declarada"
          placeholder="Describí brevemente qué le pasa al equipo..."
          required
          rows={3}
          error={fieldErrors.fallaDeclarada}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CurrencyInput
            name="presupuesto"
            label="Presupuesto estimado"
            error={fieldErrors.presupuesto}
          />
          <DateInput
            name="fechaPromesa"
            label="Fecha promesa (opcional)"
            error={fieldErrors.fechaPromesa}
          />
        </div>

        <label className="flex items-center gap-3 p-3 rounded-lg bg-surface-hover/50 border border-white/5 cursor-pointer hover:bg-surface-hover transition-colors">
          <input
            type="checkbox"
            name="esUrgente"
            className="w-5 h-5 rounded border-white/20 bg-surface-base text-accent focus:ring-accent focus:ring-offset-0"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-ink-primary">
              Marcar como urgente
            </span>
            <p className="text-xs text-ink-muted">
              Se destaca en el Kanban con badge rojo
            </p>
          </div>
        </label>
      </section>

      <div className="sticky bottom-0 -mx-6 px-6 pt-4 pb-2 bg-gradient-to-t from-surface-base via-surface-base to-transparent">
        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={isPending}
        >
          {isPending ? "Creando orden..." : "Crear orden"}
        </Button>
      </div>
    </form>
  );
}
