"use client";

import { useEffect, useState, useTransition } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateInput } from "@/components/ui/date-input";
import { ClienteAutocomplete } from "./cliente-autocomplete";
import { QrScannerButton } from "@/components/orden/scanner/qr-scanner-button";
import { buscarEquipoExistente, crearOrdenYRedirigir } from "@/app/actions/ordenes";
import { CheckCircle2, Dices } from "lucide-react";
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

const TIPOS_BASE_VALUES = new Set(TIPO_BASE.map((t) => t.value));

// Charset sin ambigüedades (sin 0/O/1/I) para que la serie sea legible
// en etiquetas y códigos QR. Formato: XXXX-XXXX-XXXX.
const SERIE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generarSerieAleatoria(): string {
  const grupo = () =>
    Array.from(
      { length: 4 },
      () => SERIE_CHARS[Math.floor(Math.random() * SERIE_CHARS.length)]
    ).join("");
  return `${grupo()}-${grupo()}-${grupo()}`;
}

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
  const [reusoDetectado, setReusoDetectado] = useState<string | null>(null);

  const tiposCustomNormalizados = tiposCustom.map((t) => t.toLowerCase());

  // Hint de reuso automático: si el cliente ya tiene un equipo con la misma
  // marca + modelo + serie, avisamos que se reutilizará (evita duplicados).
  useEffect(() => {
    let cancelada = false;
    if (
      clienteModo !== "existente" ||
      !clienteId ||
      marca.trim().length < 2 ||
      modelo.trim().length < 2
    ) {
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const eq = await buscarEquipoExistente({
          clienteId,
          marca: marca.trim(),
          modelo: modelo.trim(),
          numeroSerie: numeroSerie.trim(),
        });
        if (!cancelada && eq && (eq.marca || eq.modelo)) {
          const serie = eq.numero_serie ? ` · ${eq.numero_serie}` : "";
          setReusoDetectado(`${eq.marca ?? ""} ${eq.modelo ?? ""}${serie}`);
        }
      } catch {
        // Silencioso: el reuso igual lo resuelve el server action.
      }
    }, 400);
    return () => {
      cancelada = true;
      clearTimeout(timeout);
    };
  }, [clienteModo, clienteId, marca, modelo, numeroSerie]);

  const tipoOptions = [
    ...TIPO_BASE,
    ...tiposCustom.map((t) => ({ value: `existente:${t}`, label: t })),
    { value: "otro", label: "+ Otro tipo" },
  ];

  // Detección de duplicado mientras el user tipea en "+ Otro tipo"
  // (case-insensitive + trim). Si coincide con un tipo custom conocido,
  // lo marcamos como warning visual (el server action también valida).
  const tipoCustomNormalizado = tipoCustom.trim().toLowerCase();
  const tipoCustomDuplicado =
    tipoCustomNormalizado.length >= 2 &&
    (TIPOS_BASE_VALUES.has(tipoCustomNormalizado) ||
      tiposCustomNormalizados.includes(tipoCustomNormalizado))
      ? tiposCustom.find(
          (t) => t.toLowerCase() === tipoCustomNormalizado
        ) ?? tipoCustomNormalizado
      : null;

  // El Select controla solo el STATE local; NO tiene name="tipo".
  // El server action espera tipo ∈ {notebook, smartphone, tablet, monitor, otro}.
  // Para tipos custom (existentes o nuevos) mandamos tipo="otro" + tipoCustom="nombre".
  const esCustom = tipo.startsWith("existente:") || tipo === "otro";
  const tipoEnviado: "notebook" | "smartphone" | "tablet" | "monitor" | "otro" =
    esCustom
      ? "otro"
      : (tipo as "notebook" | "smartphone" | "tablet" | "monitor");
  const tipoCustomEnviado: string | undefined = esCustom
    ? (tipo.startsWith("existente:")
        ? tipo.slice("existente:".length).toLowerCase()
        : tipoCustom.trim().toLowerCase())
    : undefined;

  async function handleSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});

    const presupuestoRaw = formData.get("presupuesto") as string;
    const presupuesto = presupuestoRaw ? Number(presupuestoRaw) : 0;

    const fechaPromesa = (formData.get("fechaPromesa") as string) || "";

    // Validación cliente (safety net; Zod también valida).
    // Solo bloqueamos si el user está CREANDO uno nuevo (tipo === "otro" sin
    // haber seleccionado uno existente del dropdown).
    if (!tipo) {
      setFieldErrors({ tipo: "Seleccioná un tipo" });
      setError("Revisá los datos del formulario");
      return;
    }
    if (tipo === "otro") {
      const custom = tipoCustom.trim().toLowerCase();
      if (!custom) {
        setFieldErrors({ tipoCustom: "Especificá el tipo de equipo" });
        setError("Revisá los datos del formulario");
        return;
      }
      if (
        TIPOS_BASE_VALUES.has(custom) ||
        tiposCustomNormalizados.includes(custom)
      ) {
        setFieldErrors({
          tipoCustom: `Ya existe el tipo "${custom}". Seleccionalo de la lista.`,
        });
        setError("Revisá los datos del formulario");
        return;
      }
    }

    const input =
      clienteModo === "existente"
        ? {
            clienteModo: "existente" as const,
            clienteId,
            tipo: tipoEnviado,
            tipoCustom: tipoCustomEnviado,
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
            tipo: tipoEnviado,
            tipoCustom: tipoCustomEnviado,
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
              onClick={() => {
                setClienteModo("existente");
                setReusoDetectado(null);
              }}
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
                setReusoDetectado(null);
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
            onSelect={(id) => {
              setClienteId(id);
              setReusoDetectado(null);
            }}
            onNew={() => {
              setClienteModo("nuevo");
              setClienteId("");
              setReusoDetectado(null);
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
          label="Tipo"
          options={tipoOptions}
          placeholder="Seleccioná..."
          required
          error={fieldErrors.tipo}
          value={tipo}
          onChange={(e) => {
            const value = e.target.value;
            setTipo(value);
            const errors = { ...fieldErrors };
            delete errors.tipoCustom;
            setFieldErrors(errors);
            if (value.startsWith("existente:")) {
              setTipoCustom(value.slice("existente:".length));
            } else {
              setTipoCustom("");
            }
          }}
        />

        {tipo === "otro" && (
          <div className="space-y-1.5">
            <Input
              name="tipoCustom"
              label="Especificá el tipo"
              placeholder="Ej: Parlantes, Consola, Auriculares..."
              value={tipoCustom}
              onChange={(e) => setTipoCustom(e.target.value)}
              required
              error={fieldErrors.tipoCustom}
            />
            {tipoCustomDuplicado && !fieldErrors.tipoCustom && (
              <p className="text-xs text-status-yellow">
                Ya existe &quot;{tipoCustomDuplicado}&quot;. Seleccionalo del
                desplegable en lugar de crearlo de nuevo.
              </p>
            )}
          </div>
        )}

        {tipo.startsWith("existente:") && (
          <p className="text-xs text-ink-muted -mt-2">
            Tipo custom existente:{" "}
            <span className="text-accent font-medium">{tipoCustom}</span>{" "}
            (se mantiene en la lista para futuros ingresos)
          </p>
        )}

        {/* Hidden inputs que envían el tipo resuelto al server action */}
        <input type="hidden" name="tipo" value={tipoEnviado} />
        <input
          type="hidden"
          name="tipoCustom"
          value={tipoCustomEnviado ?? ""}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            name="marca"
            label="Marca"
            placeholder="Lenovo, Samsung, HP..."
            list="marcas-list"
            required
            error={fieldErrors.marca}
            value={marca}
            onChange={(e) => {
              setMarca(e.target.value);
              setReusoDetectado(null);
            }}
          />
          <Input
            name="modelo"
            label="Modelo"
            placeholder="IdeaPad 3, Galaxy A52..."
            list="modelos-list"
            required
            error={fieldErrors.modelo}
            value={modelo}
            onChange={(e) => {
              setModelo(e.target.value);
              setReusoDetectado(null);
            }}
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
              onChange={(e) => {
                setNumeroSerie(e.target.value);
                setReusoDetectado(null);
              }}
              className={`
                flex-1 px-3 py-2 rounded-lg
                bg-surface-base border border-white/10
                text-ink-primary placeholder:text-ink-muted
                focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
                transition-all duration-200
              `}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setNumeroSerie(generarSerieAleatoria())}
              title="Generar número de serie aleatorio"
              className="shrink-0"
            >
              <Dices className="w-4 h-4" />
              <span className="hidden sm:inline">Aleatorio</span>
            </Button>
            <QrScannerButton onScan={(text) => setNumeroSerie(text)} />
          </div>
          {reusoDetectado && (
            <p className="mt-2 text-xs text-accent">
              <CheckCircle2 className="inline w-3.5 h-3.5 -mt-0.5 mr-1" />
              Ya tenés este equipo cargado ({reusoDetectado}). Se reutilizará
              sin crear duplicados.
            </p>
          )}
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

      <div className="md:sticky md:bottom-0 md:-mx-6 md:px-6 md:pt-4 md:pb-2 md:bg-gradient-to-t md:from-surface-base md:via-surface-base md:to-transparent mt-6 md:mt-0">
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
