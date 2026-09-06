"use client";

import { useState } from "react";
import { Copy, Check, Link as LinkIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompartirTrackingProps {
  publicToken: string;
}

export function CompartirTracking({ publicToken }: CompartirTrackingProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const trackingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/tracking/${publicToken}`
      : `/tracking/${publicToken}`;

  function handleCopy() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(trackingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-2">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-accent transition-colors"
        >
          <LinkIcon className="w-3 h-3" />
          Compartir link de seguimiento con cliente
        </button>
      ) : (
        <div className="space-y-2 p-3 rounded-lg bg-surface-base/40 border border-white/5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-ink-secondary">
              Link público (sin login)
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded text-ink-muted hover:text-ink-primary hover:bg-surface-hover transition-colors"
              title="Cerrar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              readOnly
              value={trackingUrl}
              className="flex-1 px-2 py-1.5 rounded-md bg-surface-base border border-white/10 text-xs font-mono text-ink-primary focus:outline-none"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar
                </>
              )}
            </Button>
          </div>
          <p className="text-[10px] text-ink-muted">
            El cliente ve solo el estado y los mensajes para él (no ve costos ni notas internas).
          </p>
        </div>
      )}
    </div>
  );
}
