"use client";

import { useState, useTransition } from "react";
import { Pencil, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { actualizarPresupuestoOrden } from "@/app/actions/ordenes";
import type { TipoIntervencion } from "@/types";

interface PresupuestoEditorProps {
  ordenId: string;
  presupuesto: number;
  costoRepuestosArs: number;
  tipoIntervencion: TipoIntervencion;
  presupuestoAprobado: boolean;
}

export function PresupuestoEditor({
  ordenId,
  presupuesto,
  costoRepuestosArs,
  tipoIntervencion,
  presupuestoAprobado,
}: PresupuestoEditorProps) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [monto, setMonto] = useState(presupuesto);
  const [repuestos, setRepuestos] = useState(costoRepuestosArs);
  const [tipo, setTipo] = useState<TipoIntervencion>(tipoIntervencion);
  const [aprobado, setAprobado] = useState(presupuestoAprobado);

  const mo = Math.max(0, monto - repuestos);

  function startEdit() {
    setMonto(presupuesto);
    setRepuestos(costoRepuestosArs);
    setTipo(tipoIntervencion);
    setAprobado(presupuestoAprobado);
    setError(null);
    setSuccess(false);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setError(null);
  }

  function save() {
    setError(null);
    setSuccess(false);

    if (monto < 0) return setError("El monto no puede ser negativo");
    if (repuestos < 0) return setError("El costo de repuestos no puede ser negativo");
    if (repuestos > monto)
      return setError("El costo de repuestos no puede superar el monto total");

    startTransition(async () => {
      const result = await actualizarPresupuestoOrden(ordenId, {
        presupuesto: monto,
        costoRepuestosArs: repuestos,
        tipoIntervencion: tipo,
        presupuestoAprobado: aprobado,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setEditing(false);
      setTimeout(() => window.location.reload(), 400);
    });
  }

  return (
    <div className="space-y-3">
      {!editing && (
        <div className="space-y-2 text-sm">
          <Row
            label="Tipo"
            value={tipo === "microscopio" ? "Microscopio" : "Estándar"}
          />
          <Row
            label="Repuestos"
            value={costoRepuestosArs > 0 ? formatCurrency(costoRepuestosArs) : "—"}
          />
          <Row
            label="MO presupuestada"
            value={formatCurrency(Math.max(0, presupuesto - costoRepuestosArs))}
          />
          <Row
            label="Total"
            value={presupuesto > 0 ? formatCurrency(presupuesto) : "—"}
            bold
          />
          <Row label="Aprobado" value={presupuestoAprobado ? "Sí" : "No"} />
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-accent transition-colors mt-2"
          >
            <Pencil className="w-3 h-3" />
            Editar presupuesto
          </button>
        </div>
      )}

      {editing && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Total ($)"
              type="number"
              step="any"
              min="0"
              value={monto}
              onChange={(e) => setMonto(Number(e.target.value))}
              required
            />
            <Input
              label="Repuestos ($)"
              type="number"
              step="any"
              min="0"
              value={repuestos}
              onChange={(e) => setRepuestos(Number(e.target.value))}
              hint={`MO: ${formatCurrency(mo)}`}
              required
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-ink-secondary">Tipo de intervención</p>
            <div className="flex gap-2">
              {(["estandar", "microscopio"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`
                    flex-1 px-3 py-2 rounded-md text-sm font-medium border transition-colors
                    ${
                      tipo === t
                        ? "bg-accent/15 text-accent border-accent/30"
                        : "bg-surface-hover text-ink-secondary border-white/10 hover:border-accent/30"
                    }
                  `}
                >
                  {t === "microscopio" ? "Microscopio" : "Estándar"}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={aprobado}
              onChange={(e) => setAprobado(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-surface-base text-accent focus:ring-accent"
            />
            <span className="text-ink-primary">Presupuesto aprobado por cliente</span>
          </label>

          {error && <p className="text-xs text-status-red">{error}</p>}
          {success && (
            <p className="text-xs text-status-green">Presupuesto guardado.</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={save} loading={isPending}>
              <Check className="w-3.5 h-3.5" />
              Guardar
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel} disabled={isPending}>
              <X className="w-3.5 h-3.5" />
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className={`${bold ? "font-mono font-semibold text-ink-primary" : "text-ink-primary"}`}>
        {value}
      </span>
    </div>
  );
}
