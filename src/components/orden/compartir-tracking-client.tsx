"use client";

import { useState } from "react";
import { Copy, Check, Link as LinkIcon, X, QrCode as QrCodeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompartirTrackingClientProps {
  trackingUrl: string;
  qrSvg: string;
}

export function CompartirTrackingClient({
  trackingUrl,
  qrSvg,
}: CompartirTrackingClientProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  function handleCopy() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(trackingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowQr((s) => !s)}
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-accent transition-colors"
        >
          <LinkIcon className="w-3 h-3" />
          {showQr ? "Ocultar" : "Compartir"} link de seguimiento
        </button>
        <button
          type="button"
          onClick={() => setShowQr((s) => !s)}
          className={`inline-flex items-center gap-1.5 text-xs transition-colors ${
            showQr ? "text-accent" : "text-ink-muted hover:text-accent"
          }`}
          title="Ver QR"
        >
          <QrCodeIcon className="w-3 h-3" />
          QR
        </button>
      </div>

      {showQr && (
        <div className="space-y-3 p-3 rounded-lg bg-surface-base/40 border border-white/5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-ink-secondary">
              Link público (sin login)
            </p>
            <button
              type="button"
              onClick={() => setShowQr(false)}
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
              className="flex-1 min-w-0 px-2 py-1.5 rounded-md bg-surface-base border border-white/10 text-xs font-mono text-ink-primary focus:outline-none"
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
          <div className="flex flex-col items-center gap-2 pt-2 border-t border-white/5">
            <div
              className="inline-flex items-center justify-center rounded-lg bg-surface-base p-3 border border-white/10"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
              aria-label={`Código QR para ${trackingUrl}`}
              role="img"
            />
            <a
              href={`data:image/svg+xml;utf8,${encodeURIComponent(qrSvg)}`}
              download={`tracking-OT-${trackingUrl.split("/").pop()}.svg`}
              className="text-[10px] text-ink-muted hover:text-accent underline"
            >
              Descargar QR
            </a>
          </div>
          <p className="text-[10px] text-ink-muted">
            El cliente ve solo el estado y los mensajes para él. El QR apunta al mismo link.
          </p>
        </div>
      )}
    </div>
  );
}
