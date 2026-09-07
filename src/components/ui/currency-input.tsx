"use client";

import { useState, useId } from "react";

interface CurrencyInputProps {
  name: string;
  label: string;
  defaultValue?: number;
  required?: boolean;
  error?: string;
  hint?: string;
}

/**
 * Input numerico con separador de miles (.) en el display,
 * pero que envia el valor raw (sin separadores) en el form.
 *
 * - defaultValue: valor inicial en pesos (ej: 25000)
 * - Display: "25.000" (formato es-AR)
 * - Hidden input: 25000
 */
export function CurrencyInput({
  name,
  label,
  defaultValue = 0,
  required = false,
  error,
  hint,
}: CurrencyInputProps) {
  const id = useId();
  const [display, setDisplay] = useState(() =>
    defaultValue > 0 ? formatearPesos(defaultValue) : ""
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Solo digitos
    const raw = e.target.value.replace(/\D/g, "");
    const numero = raw ? Number(raw) : 0;
    setDisplay(raw ? formatearPesos(numero) : "");
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-ink-secondary"
      >
        {label}
        {required && <span className="text-status-red ml-1">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm pointer-events-none">
          $
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleChange}
          placeholder="0"
          required={required}
          className={`
            w-full pl-7 pr-3 py-2 rounded-lg
            bg-surface-base border text-ink-primary
            placeholder:text-ink-muted
            focus:outline-none focus:ring-1
            transition-all duration-200
            ${error
              ? "border-status-red focus:border-status-red focus:ring-status-red/30"
              : "border-white/10 focus:border-accent focus:ring-accent/30"
            }
          `}
        />
        <input type="hidden" name={name} value={parsearPesosAInt(display)} />
      </div>
      {error && <p className="text-xs text-status-red">{error}</p>}
      {hint && !error && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

/** Formatea un numero con separador de miles estilo es-AR (punto). */
function formatearPesos(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
  }).format(n);
}

/** Convierte el display (ej: "25.000" o "1.500,50") a numero. */
function parsearPesosAInt(display: string): number {
  if (!display) return 0;
  // Quitar separadores de miles (.) y reemplazar coma (,) por punto
  const limpio = display.replace(/\./g, "").replace(",", ".");
  const n = Number(limpio);
  return Number.isFinite(n) ? n : 0;
}
