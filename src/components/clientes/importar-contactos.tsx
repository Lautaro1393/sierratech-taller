"use client";

import { useState, useTransition, useRef } from "react";
import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  importarContactosDesdeTexto,
} from "@/app/actions/clientes";
import {
  detectarFormato,
  type ContactoImportado,
} from "@/lib/parsers/contact-import";

interface ImportarContactosProps {
  onClose: () => void;
  onSuccess: () => void;
}

type PreviewState =
  | { type: "empty" }
  | { type: "loading" }
  | {
      type: "preview";
      formato: string;
      contactos: ContactoImportado[];
      filename: string;
    }
  | {
      type: "result";
      inserted: number;
      skipped: number;
      total: number;
    };

/**
 * Modal para importar contactos desde un archivo VCF o CSV.
 * Flujo:
 *  1) Click "Subir archivo" → file picker
 *  2) Lee el archivo en el browser, lo parsea
 *  3) Muestra preview (cuántos contactos se importarán)
 *  4) Click "Importar X contactos" → server action
 *  5) Muestra reporte final (insertados / ya existían)
 */
export function ImportarContactos({ onClose, onSuccess }: ImportarContactosProps) {
  const [state, setState] = useState<PreviewState>({ type: "empty" });
  const [importing, startImport] = useTransition();
  const [importError, setImportError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setImportError(null);
    setState({ type: "loading" });
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = String(e.target?.result ?? "");
      const formato = detectarFormato(text);
      if (formato === "desconocido") {
        setState({ type: "empty" });
        setImportError(
          "No se reconoce el formato. Proba con un .vcf (contactos) o .csv."
        );
        return;
      }
      // Parsear en el cliente para preview rapido
      const { parseContactFile } = await import("@/lib/parsers/contact-import");
      const contactos = parseContactFile(text);
      if (contactos.length === 0) {
        setState({ type: "empty" });
        setImportError("El archivo no contiene contactos con telefono valido.");
        return;
      }
      setState({
        type: "preview",
        formato: formato.toUpperCase(),
        contactos,
        filename: file.name,
      });
    };
    reader.onerror = () => {
      setState({ type: "empty" });
      setImportError("No se pudo leer el archivo.");
    };
    reader.readAsText(file);
  }

  function handleImport() {
    if (state.type !== "preview") return;
    setImportError(null);
    startImport(async () => {
      const result = await importarContactosDesdeTexto(
        // Re-serializamos el preview a texto para que el server re-parsee
        // y aplique dedupe contra la DB. Alternativa: pasar el array
        // directo, pero queremos dedupe server-side.
        serializeToVcf(state.contactos)
      );
      if (!result.ok) {
        setImportError(result.error);
        return;
      }
      setState({
        type: "result",
        inserted: result.inserted,
        skipped: result.skipped,
        total: result.total,
      });
      onSuccess();
    });
  }

  function reset() {
    setState({ type: "empty" });
    setImportError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="glass-card max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="font-display text-base font-semibold text-ink-primary flex items-center gap-2">
            <Upload className="w-5 h-5 text-accent" />
            Importar contactos
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-ink-muted hover:text-ink-primary hover:bg-surface-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {state.type === "empty" && (
            <div>
              <div
                className="relative block w-full p-8 rounded-lg border-2 border-dashed border-white/10 hover:border-accent/50 hover:bg-accent/5 transition-colors text-center cursor-pointer"
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".vcf,.csv,text/vcard,text/csv,text/plain"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                <FileText className="w-10 h-10 text-ink-muted mx-auto mb-2" />
                <p className="text-sm text-ink-primary font-medium">
                  Subir archivo .vcf o .csv
                </p>
                <p className="text-xs text-ink-muted mt-1">
                  Contactos de iOS, Android, Google Contacts, etc.
                </p>
              </div>
              {importError && (
                <div className="mt-3 flex items-center gap-2 text-sm text-status-red">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {importError}
                </div>
              )}
              <p className="text-xs text-ink-muted mt-3">
                Los contactos duplicados (mismo telefono) se omiten
                automaticamente.
              </p>
            </div>
          )}

          {state.type === "loading" && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-ink-secondary">Leyendo archivo...</p>
            </div>
          )}

          {state.type === "preview" && (
            <>
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/30 text-sm">
                <p className="text-ink-primary font-medium">
                  {state.contactos.length} contactos encontrados
                </p>
                <p className="text-xs text-ink-muted mt-1">
                  Formato: {state.formato} · Archivo: {state.filename}
                </p>
              </div>
              <div className="max-h-72 overflow-y-auto rounded-lg border border-white/5 divide-y divide-white/5">
                {state.contactos.slice(0, 50).map((c, i) => (
                  <div
                    key={`${c.telefono}-${i}`}
                    className="px-3 py-2 text-sm flex items-center justify-between gap-3"
                  >
                    <span className="text-ink-primary truncate flex-1">
                      {c.nombre}
                    </span>
                    <span className="font-mono text-xs text-ink-muted">
                      {c.telefono}
                    </span>
                  </div>
                ))}
                {state.contactos.length > 50 && (
                  <div className="px-3 py-2 text-xs text-ink-muted text-center">
                    ... y {state.contactos.length - 50} más
                  </div>
                )}
              </div>
            </>
          )}

          {state.type === "result" && (
            <div className="text-center py-8 space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-status-green/20 border border-status-green/30">
                <CheckCircle2 className="w-8 h-8 text-status-green" />
              </div>
              <p className="text-ink-primary font-medium">
                {state.inserted} contactos importados
              </p>
              <p className="text-xs text-ink-muted">
                {state.skipped > 0
                  ? `${state.skipped} ya existian en la base (mismo telefono)`
                  : "Sin duplicados"}
              </p>
            </div>
          )}

          {importError && state.type !== "empty" && (
            <div className="flex items-center gap-2 text-sm text-status-red">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {importError}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 flex justify-end gap-2">
          {state.type === "preview" && (
            <>
              <Button variant="ghost" onClick={reset}>
                Cambiar archivo
              </Button>
              <Button onClick={handleImport} loading={importing}>
                Importar {state.contactos.length} contactos
              </Button>
            </>
          )}
          {state.type === "result" && (
            <Button onClick={onClose}>Cerrar</Button>
          )}
          {state.type === "empty" && (
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Re-serializa los contactos parseados a un VCF minimo para que el
 *  server action los re-parsee y aplique dedupe contra la DB.
 *  Alternativa: pasar el array directo, pero requiere extender el
 *  server action. */
function serializeToVcf(contactos: ContactoImportado[]): string {
  return contactos
    .map(
      (c) =>
        `BEGIN:VCARD\nVERSION:2.1\nFN:${c.nombre}\nTEL;CELL:${c.telefono}${
          c.email ? `\nEMAIL:${c.email}` : ""
        }\nEND:VCARD`
    )
    .join("\n");
}
