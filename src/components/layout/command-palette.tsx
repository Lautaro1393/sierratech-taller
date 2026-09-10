"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CornerDownLeft, FileText, Search, Sparkles } from "lucide-react";
import { buscarOrdenesQuick, type QuickOrden } from "@/app/actions/palette";
import { matchesShortcut } from "@/lib/utils";
import { ESTADO_LABELS, type Shortcuts } from "@/types";

interface PaletteContextValue {
  open: boolean;
  toggle: () => void;
  shortcuts: Shortcuts;
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

export function useCommandPalette(): PaletteContextValue {
  const ctx = useContext(PaletteContext);
  if (!ctx) {
    throw new Error("useCommandPalette debe usarse dentro de CommandPaletteProvider");
  }
  return ctx;
}

interface PaletteAction {
  type: "action";
  label: string;
  hint: string;
  href: string;
}

interface PaletteOrden {
  type: "orden";
  id: string;
  numeroOt: number;
  estado: string;
  esUrgente: boolean;
  clienteNombre: string;
  marca: string;
  modelo: string;
}

type PaletteItem = PaletteAction | PaletteOrden;

const QUICK_ACTIONS: PaletteAction[] = [
  { type: "action", label: "Nueva orden", hint: "/ordenes/nueva", href: "/ordenes/nueva" },
  { type: "action", label: "Ir a Dashboard", hint: "/", href: "/" },
  { type: "action", label: "Ir a Kanban", hint: "/kanban", href: "/kanban" },
  { type: "action", label: "Ir a Órdenes", hint: "/ordenes", href: "/ordenes" },
  { type: "action", label: "Ir a Clientes", hint: "/clientes", href: "/clientes" },
  { type: "action", label: "Ir a Configuración", hint: "/settings", href: "/settings" },
];

function matchesQuery(haystack: string, q: string): boolean {
  return haystack.toLowerCase().includes(q.toLowerCase());
}

function buildOrdenItem(o: QuickOrden): PaletteOrden {
  return {
    type: "orden",
    id: o.id,
    numeroOt: o.numero_ot,
    estado: o.estado,
    esUrgente: o.es_urgente,
    clienteNombre: o.cliente_nombre ?? "—",
    marca: o.marca,
    modelo: o.modelo,
  };
}

export function CommandPaletteProvider({
  children,
  shortcuts,
}: {
  children: React.ReactNode;
  shortcuts: Shortcuts;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (matchesShortcut(e, shortcuts.palette)) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      const target = e.target as HTMLElement | null;
      const editable =
        target &&
        (target.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT)$/i.test(target.tagName));
      if (!editable && matchesShortcut(e, shortcuts.nuevaOrden)) {
        e.preventDefault();
        setOpen(false);
        router.push("/ordenes/nueva");
        return;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcuts, open, router]);

  return (
    <PaletteContext.Provider value={{ open, toggle, shortcuts }}>
      {children}
      {open && <PaletteOverlay onClose={() => setOpen(false)} />}
    </PaletteContext.Provider>
  );
}

function PaletteOverlay({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [ordenes, setOrdenes] = useState<QuickOrden[]>([]);
  const [active, setActive] = useState(0);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inputRefCallback = useCallback((node: HTMLInputElement | null) => {
    inputRef.current = node;
    node?.focus();
  }, []);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const q = query.trim();
    timeoutRef.current = setTimeout(() => {
      void buscarOrdenesQuick(q).then((res) => {
        setOrdenes(res);
        setActive((prev) => Math.max(0, Math.min(prev, res.length - 1)));
        setLoadedOnce(true);
      });
    }, query.length > 0 ? 150 : 0);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query]);

  const q = query.trim();

  const items = useMemo<PaletteItem[]>(() => {
    const acciones = QUICK_ACTIONS.filter((a) => matchesQuery(`${a.label} ${a.hint}`, q));
    return [...acciones, ...ordenes.map(buildOrdenItem)];
  }, [q, ordenes]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const handleSelect = useCallback(
    (item: PaletteItem) => {
      if (item.type === "orden") {
        router.push(`/ordenes/${item.id}`);
      } else {
        router.push(item.href);
      }
      onClose();
    },
    [router, onClose]
  );

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(items[active]);
    }
  }

  const showEmpty = loadedOnce && items.length === 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-[15vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg glass-card rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 border-b border-white/5">
          <Search className="w-5 h-5 text-ink-muted shrink-0" />
          <input
            ref={inputRefCallback}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Buscar orden por número, falla o cliente..."
            className="flex-1 py-4 bg-transparent text-ink-primary placeholder:text-ink-muted focus:outline-none text-sm"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={active >= 0 && items[active] ? `palette-item-${active}` : undefined}
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded border border-white/10 bg-surface-hover text-[10px] font-mono text-ink-muted">
            ESC
          </kbd>
        </div>

        <div
          ref={listRef}
          id="palette-results"
          className="max-h-80 overflow-y-auto py-2 space-y-0.5"
          role="listbox"
        >
          {!loadedOnce && (
            <p className="px-4 py-3 text-sm text-ink-muted">Buscando...</p>
          )}

          {showEmpty && (
            <p className="px-4 py-3 text-sm text-ink-muted">
              Sin resultados para &quot;{query}&quot;
            </p>
          )}

          {items.map((item, index) => (
            <button
              key={item.type === "orden" ? `orden-${item.id}` : `action-${item.href}`}
              type="button"
              role="option"
              id={`palette-item-${index}`}
              aria-selected={active === index}
              data-index={index}
              onMouseEnter={() => setActive(index)}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(item);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                ${active === index ? "bg-accent/10" : "hover:bg-surface-hover"}
              `}
            >
              {item.type === "action" ? (
                <>
                  <span className="w-8 h-8 rounded-lg bg-surface-elevated border border-white/10 flex items-center justify-center shrink-0">
                    {item.href === "/ordenes/nueva" ? (
                      <Sparkles className="w-4 h-4 text-accent" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-ink-secondary" />
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-ink-primary truncate">
                      {item.label}
                    </span>
                    <span className="block text-xs text-ink-muted truncate">
                      {item.hint}
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <span className="w-8 h-8 rounded-lg bg-surface-elevated border border-white/10 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-ink-secondary" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-ink-primary truncate">
                      OT-{String(item.numeroOt).padStart(4, "0")}
                      {item.esUrgente && (
                        <span className="ml-1.5 text-[10px] font-semibold text-status-red">
                          URGENTE
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-ink-muted truncate">
                      {item.clienteNombre} · {item.marca} {item.modelo}
                    </span>
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-surface-hover text-ink-secondary shrink-0">
                    {ESTADO_LABELS[item.estado as keyof typeof ESTADO_LABELS] ?? item.estado}
                  </span>
                </>
              )}
              {active === index && (
                <CornerDownLeft className="w-4 h-4 text-ink-muted shrink-0" />
              )}
            </button>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-white/5 flex items-center gap-4 text-[11px] text-ink-muted">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-white/10 bg-surface-hover font-mono">↑↓</kbd>
            navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded border border-white/10 bg-surface-hover font-mono">↵</kbd>
            abrir
          </span>
        </div>
      </div>
    </div>
  );
}