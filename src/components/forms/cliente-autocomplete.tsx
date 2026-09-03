"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import type { Cliente } from "@/types";

interface ClienteAutocompleteProps {
  clientes: Pick<Cliente, "id" | "nombre" | "telefono" | "email">[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function ClienteAutocomplete({
  clientes,
  selectedId,
  onSelect,
  onNew,
}: ClienteAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = clientes.find((c) => c.id === selectedId);
  const displayValue = open
    ? query
    : selected
      ? selected.nombre
      : query;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = query
    ? clientes.filter((c) =>
        c.nombre.toLowerCase().includes(query.toLowerCase())
      )
    : clientes;

  return (
    <div ref={containerRef} className="relative">
      <Input
        label="Cliente"
        type="text"
        placeholder="Buscar por nombre..."
        value={displayValue}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (selectedId) onSelect("");
        }}
        onFocus={() => setOpen(true)}
        required
        autoComplete="off"
      />

      {open && (
        <div className="absolute z-20 w-full mt-1 glass-card rounded-lg max-h-64 overflow-y-auto shadow-xl shadow-black/40">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-ink-muted">
              No encontramos clientes con ese nombre
            </div>
          ) : (
            <ul role="listbox">
              {filtered.slice(0, 10).map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(c.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`
                      w-full text-left px-3 py-2 hover:bg-surface-hover
                      flex flex-col gap-0.5 transition-colors
                      ${selectedId === c.id ? "bg-accent/10" : ""}
                    `}
                  >
                    <span className="text-sm text-ink-primary font-medium">
                      {c.nombre}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {c.telefono}
                      {c.email ? ` · ${c.email}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-white/5 p-2">
            <button
              type="button"
              onClick={() => {
                onNew();
                setOpen(false);
                setQuery("");
              }}
              className="w-full text-left px-3 py-2 rounded-md text-sm text-accent hover:bg-accent/10 transition-colors inline-flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Crear nuevo cliente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
