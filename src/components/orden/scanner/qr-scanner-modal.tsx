"use client";

import { useEffect, useRef, useState } from "react";
import { X, Camera, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (text: string) => void;
}

const FORMATS: Html5QrcodeSupportedFormats[] = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
];

type Status =
  | { type: "idle" }
  | { type: "starting" }
  | { type: "scanning" }
  | { type: "detected"; text: string }
  | { type: "error"; message: string };

/**
 * Modal fullscreen para escanear codigos QR o barcode 1D con la camara
 * trasera del dispositivo. Usa html5-qrcode.
 *
 * Limitaciones:
 * - getUserMedia requiere HTTPS o localhost. En HTTP desde LAN, el
 *   browser rechaza el acceso a la camara -> se muestra error.
 * - En desktop (no hay camara) -> se muestra error.
 */
export function QrScannerModal({ open, onClose, onScan }: QrScannerModalProps) {
  if (!open) return null;
  return (
    <QrScannerContent key="scanner" onClose={onClose} onScan={onScan} />
  );
}

function QrScannerContent({
  onClose,
  onScan,
}: {
  onClose: () => void;
  onScan: (text: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [status, setStatus] = useState<Status>({ type: "starting" });

  useEffect(() => {
    // Detector id unico (html5-qrcode lo requiere)
    const scannerId = "qr-scanner-region";

    const scanner = new Html5Qrcode(scannerId, {
      formatsToSupport: FORMATS,
      verbose: false,
    });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" }, // camara trasera
        {
          fps: 10,
          qrbox: (vw, vh) => {
            const minEdge = Math.min(vw, vh);
            const size = Math.floor(minEdge * 0.7);
            return { width: size, height: size };
          },
        },
        (decodedText) => {
          // Deteccion exitosa
          setStatus({ type: "detected", text: decodedText });
          // Cerrar despues de un breve delay para que se vea la confirmacion
          setTimeout(() => {
            onScan(decodedText);
            stopScanner();
          }, 800);
        },
        () => {
          // Fallo de deteccion (frame no contiene codigo) - ignorar
        }
      )
      .then(() => {
        setStatus({ type: "scanning" });
      })
      .catch((err) => {
        const msg = String(err?.message ?? err);
        let mensaje = "No se pudo acceder a la camara.";
        if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
          mensaje =
            "Necesitamos permiso de camara. Habilitalo en los settings del browser.";
        } else if (msg.includes("NotFoundError")) {
          mensaje = "No se detecto ninguna camara en este dispositivo.";
        } else if (
          msg.includes("secure") ||
          msg.includes("https") ||
          msg.includes("Permissions check failed")
        ) {
          mensaje =
            "La camara requiere HTTPS o localhost. Si abris desde http://, no funciona.";
        }
        setStatus({ type: "error", message: mensaje });
      });

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopScanner() {
    const scanner = scannerRef.current;
    if (!scanner) return;
    scanner
      .stop()
      .then(() => scanner.clear())
      .catch(() => {
        // Ignorar errores de stop (puede ya estar detenido)
      })
      .finally(() => {
        scannerRef.current = null;
      });
  }

  function handleClose() {
    stopScanner();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-surface-elevated/80 backdrop-blur">
        <h2 className="font-display text-base font-semibold text-ink-primary flex items-center gap-2">
          <Camera className="w-5 h-5 text-accent" />
          Escanear codigo
        </h2>
        <button
          type="button"
          onClick={handleClose}
          className="p-2 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-surface-hover transition-colors"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
        {status.type === "error" ? (
          <div className="max-w-md text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-status-red/20 border border-status-red/30">
              <AlertTriangle className="w-8 h-8 text-status-red" />
            </div>
            <p className="text-ink-primary">{status.message}</p>
            <p className="text-xs text-ink-muted">
              El scanner funciona en HTTPS o localhost. En produccion (Vercel)
              andara sin problemas.
            </p>
            <Button variant="secondary" onClick={handleClose}>
              Cerrar
            </Button>
          </div>
        ) : status.type === "detected" ? (
          <div className="max-w-md text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-status-green/20 border border-status-green/30">
              <CheckCircle2 className="w-8 h-8 text-status-green" />
            </div>
            <p className="text-sm text-ink-muted">Codigo detectado</p>
            <p className="font-mono text-base text-ink-primary break-all px-4">
              {status.text}
            </p>
          </div>
        ) : (
          <>
            <div
              id="qr-scanner-region"
              ref={containerRef}
              className="w-full max-w-md aspect-square bg-black rounded-2xl overflow-hidden border-2 border-accent/30"
            />
            <p className="text-sm text-ink-muted text-center">
              {status.type === "starting"
                ? "Iniciando camara..."
                : "Apuntá al codigo QR o de barras"}
            </p>
            <p className="text-[10px] text-ink-muted/60">
              Soporta QR + Code128 + EAN-13 + Code39 + UPC + Code93 + ITF + Codabar
            </p>
          </>
        )}
      </div>
    </div>
  );
}
