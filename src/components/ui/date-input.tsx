"use client";

import { useId, useState } from "react";
import { Calendar } from "lucide-react";

interface DateInputProps {
  name: string;
  label: string;
  defaultValue?: string; // YYYY-MM-DD
  required?: boolean;
  error?: string;
  hint?: string;
}

/**
 * Wrapper sobre <input type="date"> que le da un icono de
 * calendario visible (el nativo se ve mal en dark mode).
 * La fecha se envia como YYYY-MM-DD al server action.
 */
export function DateInput({
  name,
  label,
  defaultValue,
  required = false,
  error,
  hint,
}: DateInputProps) {
  const id = useId();
  const [value, setValue] = useState(defaultValue ?? "");

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
        <input
          id={id}
          type="date"
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required={required}
          className={`
            w-full pl-10 pr-3 py-2 rounded-lg
            bg-surface-base border text-ink-primary
            focus:outline-none focus:ring-1
            transition-all duration-200
            [color-scheme:dark]
            ${error
              ? "border-status-red focus:border-status-red focus:ring-status-red/30"
              : "border-white/10 focus:border-accent focus:ring-accent/30"
            }
          `}
        />
        <Calendar
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none"
          aria-hidden="true"
        />
      </div>
      {error && <p className="text-xs text-status-red">{error}</p>}
      {hint && !error && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
