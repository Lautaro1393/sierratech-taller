"use client";

import { useTransition } from "react";
import { Pause, X } from "lucide-react";
import { pausarSesion } from "@/app/actions/tiempo";

interface PausePromptProps {
  sesionId: string | null;
  numeroOt: number;
  onDismiss: () => void;
}

export function PausePrompt({ sesionId, numeroOt, onDismiss }: PausePromptProps) {
  const [isPending, startTransition] = useTransition();

  function handlePause() {
    if (!sesionId) return;
    startTransition(async () => {
      const result = await pausarSesion(sesionId);
      if (result.ok) {
        onDismiss();
        window.location.reload();
      }
    });
  }

  return (
    <div className="glass-card p-4 flex items-center justify-between gap-4 border-status-yellow/30 bg-status-yellow/5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-status-yellow/20 flex items-center justify-center shrink-0">
          <Pause className="w-5 h-5 text-status-yellow" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink-primary">
            Moviste OT-{String(numeroOt).padStart(4, "0")} a Esperando Repuesto
          </p>
          <p className="text-xs text-ink-secondary mt-0.5">
            ¿Pausar el timer activo de esta orden?
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handlePause}
          disabled={isPending || !sesionId}
          className="px-3 py-1.5 rounded-md bg-status-yellow/20 text-status-yellow text-sm font-medium hover:bg-status-yellow/30 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Pausando..." : "Pausar timer"}
        </button>
        <button
          onClick={onDismiss}
          className="p-1.5 rounded-md text-ink-muted hover:text-ink-primary hover:bg-surface-hover transition-colors"
          title="Dejar corriendo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
