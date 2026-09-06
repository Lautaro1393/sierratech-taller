"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCorto } from "@/lib/utils";
import type { SesionActivaGlobal } from "@/types";

interface TimerIndicatorProps {
  sesionActiva: SesionActivaGlobal | null;
}

export function TimerIndicator({ sesionActiva }: TimerIndicatorProps) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    if (!sesionActiva) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [sesionActiva]);

  if (!sesionActiva) return null;

  const elapsed = Math.floor(
    (now.getTime() - new Date(sesionActiva.sesion.started_at).getTime()) / 1000
  );

  return (
    <Link
      href={`/ordenes/${sesionActiva.orden.id}`}
      className="block mx-2 mb-3 p-3 rounded-lg bg-status-red/10 border border-status-red/30 hover:bg-status-red/15 transition-colors group"
      title={`Ir a ${sesionActiva.orden.numero_ot}`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-red opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-status-red" />
        </span>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-status-red">
          Trabajando en
        </span>
      </div>
      <p className="font-mono text-sm font-bold text-ink-primary group-hover:text-status-red transition-colors">
        OT-{sesionActiva.orden.numero_ot.toString().padStart(4, "0")}
      </p>
      <p className="font-mono text-xl font-bold tabular-nums text-status-red mt-1">
        {formatCorto(elapsed)}
      </p>
      <p className="text-[10px] text-ink-muted truncate mt-1">
        {sesionActiva.orden.equipo.cliente.nombre}
      </p>
    </Link>
  );
}
