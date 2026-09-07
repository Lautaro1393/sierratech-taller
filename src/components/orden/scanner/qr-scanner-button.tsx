"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QrScannerModal } from "./qr-scanner-modal";

interface QrScannerButtonProps {
  onScan: (text: string) => void;
}

/** @deprecated use QrScannerButton with explicit onScan type */

/**
 * Boton que abre el modal del scanner de camara.
 * Soporta QR + barcode 1D (Code128, EAN, etc) via html5-qrcode.
 *
 * En desktop (no hay camara) el boton se oculta para no confundir.
 */
export function QrScannerButton({ onScan }: QrScannerButtonProps) {
  const [open, setOpen] = useState(false);

  // Detectar si el dispositivo tiene camara. Como navigator.mediaDevices
  // solo esta disponible en contextos seguros (HTTPS o localhost),
  // usamos un fallback silencioso: si no se puede detectar, mostramos
  // el boton igual y el modal mostrara el error correspondiente.
  const showButton = typeof window !== "undefined";

  if (!showButton) return null;

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOpen(true)}
        title="Escanear codigo de barras o QR con la camara"
        className="shrink-0"
      >
        <Camera className="w-4 h-4" />
        <span className="hidden sm:inline">Escanear</span>
      </Button>
      <QrScannerModal
        open={open}
        onClose={() => setOpen(false)}
        onScan={(text) => {
          onScan(text);
          setOpen(false);
        }}
      />
    </>
  );
}
