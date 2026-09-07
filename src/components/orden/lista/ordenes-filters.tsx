"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ESTADO_ORDER, ESTADO_LABELS } from "@/types";

const statusOptions = [
  { value: "", label: "Todos los estados" },
  ...ESTADO_ORDER.map((e) => ({ value: e, label: ESTADO_LABELS[e] })),
  { value: "cancelado", label: ESTADO_LABELS.cancelado },
];

export function OrdenesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => () => clearTimeout(timerRef.current!), []);

  const search = searchParams.get("search") ?? "";
  const estado = searchParams.get("estado") ?? "";
  const desde = searchParams.get("desde") ?? "";
  const hasta = searchParams.get("hasta") ?? "";

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  const hasFilters = search || estado || desde || hasta;

  function clearAll() {
    startTransition(() => {
      router.push("?", { scroll: false });
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Buscar por OT, falla..."
            defaultValue={search}
            onChange={(e) => {
              const v = e.target.value;
              clearTimeout(timerRef.current!);
              timerRef.current = setTimeout(() => {
                setParam("search", v);
              }, 300);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-base border border-white/10 text-ink-primary placeholder:text-ink-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all text-sm"
          />
        </div>
      </div>

      <div className="w-[180px]">
        <Select
          options={statusOptions}
          value={estado}
          onChange={(e) => setParam("estado", e.target.value)}
          placeholder="Estado"
        />
      </div>

      <div className="w-[150px]">
        <input
          type="date"
          value={desde}
          onChange={(e) => setParam("desde", e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-base border border-white/10 text-ink-primary text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
          placeholder="Desde"
        />
      </div>

      <div className="w-[150px]">
        <input
          type="date"
          value={hasta}
          onChange={(e) => setParam("hasta", e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-surface-base border border-white/10 text-ink-primary text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
          placeholder="Hasta"
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <X className="w-3 h-3" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
