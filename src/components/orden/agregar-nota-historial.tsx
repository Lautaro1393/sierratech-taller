"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { agregarNotaHistorial } from "@/app/actions/ordenes";

interface AgregarNotaHistorialProps {
  ordenId: string;
}

export function AgregarNotaHistorial({ ordenId }: AgregarNotaHistorialProps) {
  const [open, setOpen] = useState(false);
  const [notaInterna, setNotaInterna] = useState("");
  const [notaCliente, setNotaCliente] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await agregarNotaHistorial(ordenId, {
        nota_interna: notaInterna.trim() || null,
        nota_cliente: notaCliente.trim() || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNotaInterna("");
      setNotaCliente("");
      setOpen(false);
      window.location.reload();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-accent transition-colors"
      >
        <Plus className="w-4 h-4" />
        Agregar nota al historial
      </button>
    );
  }

  return (
    <div className="space-y-3 p-3 rounded-lg bg-surface-base/40 border border-white/5">
      <div>
        <label className="block text-xs font-medium text-ink-secondary mb-1">
          Nota interna <span className="text-ink-muted">(solo vos)</span>
        </label>
        <textarea
          value={notaInterna}
          onChange={(e) => setNotaInterna(e.target.value)}
          placeholder="Ej: cliente acepta recotización a $45k"
          rows={2}
          className="w-full px-2 py-1.5 rounded-md bg-surface-base border border-white/10 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-accent resize-none"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-ink-secondary mb-1">
          Nota para cliente <span className="text-ink-muted">(opcional)</span>
        </label>
        <textarea
          value={notaCliente}
          onChange={(e) => setNotaCliente(e.target.value)}
          placeholder="Ej: el equipo está en reparación, te avisamos cuando esté"
          rows={2}
          className="w-full px-2 py-1.5 rounded-md bg-surface-base border border-white/10 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-accent resize-none"
        />
      </div>

      {error && <p className="text-xs text-status-red">{error}</p>}

      <div className="flex gap-2">
        <Button size="sm" onClick={submit} loading={isPending}>
          Guardar nota
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setNotaInterna("");
            setNotaCliente("");
            setError(null);
          }}
          disabled={isPending}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
