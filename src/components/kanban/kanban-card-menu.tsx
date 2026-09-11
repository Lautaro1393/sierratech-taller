"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Check, ChevronRight, Copy, MessageCircle, X } from "lucide-react";

interface KanbanCardMenuProps {
  mode: "sheet" | "dropdown";
  waLink: string;
  ordenId: string;
  publicToken: string;
  anchor: { left: number; top: number } | null;
  onClose: () => void;
}

export function KanbanCardMenu({
  mode,
  waLink,
  ordenId,
  publicToken,
  anchor,
  onClose,
}: KanbanCardMenuProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleCopy() {
    if (typeof window === "undefined" || !window.navigator.clipboard) return;
    const trackingUrl = `${window.location.origin}/tracking/${publicToken}`;
    window.navigator.clipboard
      .writeText(trackingUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  const itemClass =
    "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-ink-primary hover:bg-surface-hover transition-colors text-left";

  const actions = (
    <>
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClose}
        className={itemClass}
      >
        <MessageCircle className="w-4 h-4 shrink-0 text-status-green" />
        Enviar WhatsApp
      </a>
      <Link href={`/ordenes/${ordenId}`} onClick={onClose} className={itemClass}>
        <ChevronRight className="w-4 h-4 shrink-0 text-accent" />
        Ver detalle
      </Link>
      <button type="button" onClick={handleCopy} className={itemClass}>
        {copied ? (
          <Check className="w-4 h-4 shrink-0 text-status-green" />
        ) : (
          <Copy className="w-4 h-4 shrink-0 text-ink-muted" />
        )}
        {copied ? "Link de tracking copiado" : "Copiar link de tracking"}
      </button>
    </>
  );

  if (typeof document === "undefined") return null;

  if (mode === "sheet") {
    return createPortal(
      <div
        className="fixed inset-0 z-[80] flex items-end justify-center"
        role="dialog"
        aria-modal="true"
        aria-label="Acciones de la orden"
      >
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <div className="relative w-full sm:max-w-sm glass-card rounded-t-2xl sm:rounded-2xl p-2 sm:p-3 mb-2 mx-auto sm:mb-10">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-semibold text-ink-secondary">Acciones</span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-ink-muted hover:text-ink-primary hover:bg-surface-hover transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">{actions}</div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="fixed inset-0 z-[79] cursor-default"
      />
      <div
        role="dialog"
        aria-label="Acciones de la orden"
        className="fixed z-[80] w-56 max-w-[calc(100vw-1rem)] glass-card rounded-xl p-2 shadow-2xl"
        style={
          anchor
            ? { top: anchor.top, left: anchor.left }
            : { top: "40vh", left: "50vw", transform: "translateX(-50%)" }
        }
      >
        <div className="space-y-1">{actions}</div>
      </div>
    </>,
    document.body
  );
}