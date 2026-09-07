"use client";

import { useState, useRef, useTransition, type DragEvent } from "react";
import { Camera, X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { agregarFotoHistorial } from "@/app/actions/ordenes";

const MAX_FILES = 3;
const MAX_BYTES = 5 * 1024 * 1024;

interface FotoUploaderProps {
  ordenId: string;
}

interface Preview {
  id: string;
  file: File;
  url: string;
}

export function FotoUploader({ ordenId }: FotoUploaderProps) {
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function addFiles(filesList: FileList | null) {
    if (!filesList || filesList.length === 0) return;
    setError(null);
    const incoming = Array.from(filesList);
    const accepted: Preview[] = [];
    for (const file of incoming) {
      if (!file.type.startsWith("image/")) {
        setError(`"${file.name}" no es una imagen`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`"${file.name}" supera los 5 MB`);
        continue;
      }
      accepted.push({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
      });
    }
    if (accepted.length === 0) return;
    setPreviews((prev) => {
      const combined = [...prev, ...accepted].slice(0, MAX_FILES);
      if (prev.length + accepted.length > MAX_FILES) {
        setError(`Máximo ${MAX_FILES} fotos por subida`);
      }
      return combined;
    });
  }

  function removePreview(id: string) {
    setPreviews((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  function upload() {
    if (previews.length === 0) return;
    const formData = new FormData();
    for (const p of previews) {
      formData.append("files", p.file);
    }
    startTransition(async () => {
      const result = await agregarFotoHistorial(ordenId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      setPreviews([]);
      window.location.reload();
    });
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`
          p-6 rounded-lg border-2 border-dashed text-center cursor-pointer
          transition-colors
          ${dragOver
            ? "border-accent bg-accent/10"
            : "border-white/10 bg-surface-base/30 hover:border-accent/50"
          }
        `}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <Camera className="w-6 h-6 text-ink-muted mx-auto mb-2" />
        <p className="text-sm text-ink-secondary">
          Arrastrá fotos o{" "}
          <span className="text-accent underline">hacé click para elegir</span>
        </p>
        <p className="text-xs text-ink-muted mt-1">
          Max {MAX_FILES} fotos · 5 MB cada una · se comprimen a WebP antes de subir
        </p>
      </div>

      {previews.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-ink-muted">
            {previews.length} foto{previews.length === 1 ? "" : "s"} lista
            {previews.length === 1 ? "" : "s"} para subir
          </p>
          <div className="grid grid-cols-3 gap-2">
            {previews.map((p) => (
              <div
                key={p.id}
                className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-surface-base"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.file.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePreview(p.id);
                  }}
                  className="absolute top-1 right-1 p-1 rounded-full bg-surface-base/80 hover:bg-status-red text-ink-muted hover:text-white transition-colors"
                  title="Quitar"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={upload} loading={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Subir {previews.length} foto{previews.length === 1 ? "" : "s"}
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                previews.forEach((p) => URL.revokeObjectURL(p.url));
                setPreviews([]);
              }}
              disabled={isPending}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-status-red">{error}</p>}
    </div>
  );
}
