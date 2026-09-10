"use client";

import { useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  actualizarTarifaHoraria,
  actualizarConfiguracionPricing,
  actualizarConfiguracionGeneral,
} from "@/app/actions/settings";
import { formatCurrency, formatShortcut, MOD_KEYS } from "@/lib/utils";
import type { ConfiguracionGeneral, Shortcuts, ViabilityConfig } from "@/types";

interface SettingsClientProps {
  initialTarifa: number;
  initialConfig: ViabilityConfig;
  initialConfigGeneral: ConfiguracionGeneral;
}

export function SettingsClient({
  initialTarifa,
  initialConfig,
  initialConfigGeneral,
}: SettingsClientProps) {
  const [configGeneral, setConfigGeneral] = useState(initialConfigGeneral);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-primary">
          Configuración
        </h1>
        <p className="text-ink-secondary mt-1">
          Parámetros globales del taller.
        </p>
      </div>

      <TarifaSimpleCard initialTarifa={initialTarifa} />

      <PricingCard
        initialConfig={initialConfig}
        costoFijoMensualArs={configGeneral.costoFijoMensualArs}
      />

      <GeneralCard
        config={configGeneral}
        onChange={setConfigGeneral}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cómo se usa esto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-ink-secondary">
          <p>
            <strong className="text-ink-primary">Costo hora piso:</strong> cuánto
            te cuesta mantener el taller abierto una hora (estructura + sueldo).
            Es lo que necesitás cubrir como mínimo.
          </p>
          <p>
            <strong className="text-ink-primary">Tarifas estándar / microscopio:</strong>{" "}
            lo que cobrás por hora de banco, según el tipo de intervención de
            cada orden.
          </p>
          <p>
            <strong className="text-ink-primary">Costo fijo mensual:</strong> total
            de costos fijos por mes. Se compara contra{" "}
            <code className="text-accent">costo_piso × horas</code> para saber cuántas
            horas necesitás facturar para cubrirlo.
          </p>
          <p>
            <strong className="text-ink-primary">Umbrales:</strong> 70% activa
            la alerta amarilla; 100% marca la orden como deficitaria (perdiste
            plata en MO).
          </p>
          <p>
            <strong className="text-ink-primary">Cálculo:</strong> en cada orden
            con timer activo, se compara{" "}
            <code className="text-accent">tiempo × costo_piso</code> contra{" "}
            <code className="text-accent">presupuesto − repuestos</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function TarifaSimpleCard({ initialTarifa }: { initialTarifa: number }) {
  const [tarifa, setTarifa] = useState(initialTarifa);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await actualizarTarifaHoraria(tarifa);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tarifa legacy (deprecada)</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tarifa horaria legacy (ARS / hora)"
            type="number"
            step="any"
            min="1"
            value={tarifa}
            onChange={(e) => setTarifa(Number(e.target.value))}
            hint={`Se mantiene por compatibilidad. Actual: ${formatCurrency(tarifa)}/h`}
            required
          />
          {error && <p className="text-sm text-status-red">{error}</p>}
          {success && <p className="text-sm text-status-green">Tarifa guardada.</p>}
          <Button type="submit" loading={isPending} variant="secondary">
            Guardar tarifa legacy
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PricingCard({
  initialConfig,
  costoFijoMensualArs,
}: {
  initialConfig: ViabilityConfig;
  costoFijoMensualArs: number;
}) {
  const [config, setConfig] = useState(initialConfig);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof ViabilityConfig>(
    key: K,
    value: ViabilityConfig[K]
  ) {
    setConfig((c) => ({ ...c, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (config.umbralRojoPct < config.umbralAmarilloPct) {
      setError("El umbral rojo no puede ser menor que el umbral amarillo");
      return;
    }
    startTransition(async () => {
      const result = await actualizarConfiguracionPricing(config);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    });
  }

  const horasPisoCobertura = config.costoHoraPisoArs > 0
    ? Math.round((costoFijoMensualArs / config.costoHoraPisoArs) * 10) / 10
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Viabilidad financiera</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold">
              Costos y tarifas (ARS / hora)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Costo hora piso"
                type="number"
                step="any"
                min="1"
                value={config.costoHoraPisoArs}
                onChange={(e) => update("costoHoraPisoArs", Number(e.target.value))}
                hint={`Lo que cuesta tener el taller abierto 1h`}
                required
              />
              <Input
                label="Tarifa estándar"
                type="number"
                step="any"
                min="1"
                value={config.tarifaHoraEstandarArs}
                onChange={(e) => update("tarifaHoraEstandarArs", Number(e.target.value))}
                hint="Módulos, baterías, pines"
                required
              />
              <Input
                label="Tarifa microscopio"
                type="number"
                step="any"
                min="1"
                value={config.tarifaHoraMicroArs}
                onChange={(e) => update("tarifaHoraMicroArs", Number(e.target.value))}
                hint="Microsoldadura, BGA, PMIC"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold">
              Umbrales de alerta (fracción del presupuesto MO)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Umbral amarillo"
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={config.umbralAmarilloPct}
                onChange={(e) => update("umbralAmarilloPct", Number(e.target.value))}
                hint={`${Math.round(config.umbralAmarilloPct * 100)}% — alerta de margen en riesgo`}
                required
              />
              <Input
                label="Umbral rojo"
                type="number"
                step="0.05"
                min="0"
                max="1.5"
                value={config.umbralRojoPct}
                onChange={(e) => update("umbralRojoPct", Number(e.target.value))}
                hint={`${Math.round(config.umbralRojoPct * 100)}% — orden deficitaria`}
                required
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-base/40 border border-white/5 text-sm text-ink-secondary">
            <p>
              <strong className="text-ink-primary">Punto de equilibrio:</strong> con{" "}
              {formatCurrency(config.costoHoraPisoArs)}/h necesitás facturar{" "}
              <strong>{horasPisoCobertura}h</strong> por mes para cubrir{" "}
              {formatCurrency(costoFijoMensualArs)} de costo fijo.
            </p>
            <p className="mt-1">
              Margen bruto por hora estándar:{" "}
              <strong className="text-status-green">
                {formatCurrency(config.tarifaHoraEstandarArs - config.costoHoraPisoArs)}
              </strong>{" "}
              ({(((config.tarifaHoraEstandarArs - config.costoHoraPisoArs) / config.costoHoraPisoArs) * 100).toFixed(0)}% sobre costo).
            </p>
          </div>

          {error && <p className="text-sm text-status-red">{error}</p>}
          {success && (
            <p className="text-sm text-status-green">Configuración guardada.</p>
          )}

          <Button type="submit" loading={isPending}>
            Guardar configuración de pricing
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

const SPECIAL_KEYS = ["f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12"];

function Kbd({ combo }: { combo: string }) {
  return (
    <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-surface-hover border border-white/10 text-xs font-mono text-ink-primary">
      {formatShortcut(combo)}
    </kbd>
  );
}

function ShortcutInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    const mod = e.metaKey || e.ctrlKey;
    const key = e.key.toLowerCase();
    if (MOD_KEYS.has(key)) return;
    const isPrintable = key.length === 1;
    const isSpecial = SPECIAL_KEYS.includes(key);
    if (!isPrintable && !isSpecial) return;
    const next = mod ? `mod+${key}` : isSpecial ? key : key;
    onChange(next);
    setRecording(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-secondary">{label}</span>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setRecording(true);
          buttonRef.current?.focus();
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => setRecording(false)}
        className={`
          inline-flex items-center justify-center gap-2 min-h-[38px] px-3 py-2 rounded-lg
          border text-sm font-medium transition-all duration-200
          focus:outline-none focus:ring-1
          ${
            recording
              ? "border-accent text-accent bg-accent/10 focus:ring-accent/30 animate-pulse"
              : "border-white/10 bg-surface-base text-ink-primary hover:border-white/20"
          }
        `}
      >
        {recording ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Presioná la tecla...
          </>
        ) : (
          <Kbd combo={value} />
        )}
      </button>
    </div>
  );
}

function GeneralCard({
  config,
  onChange,
}: {
  config: ConfiguracionGeneral;
  onChange: (config: ConfiguracionGeneral) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function updateShortcut(key: keyof Shortcuts, value: string) {
    onChange({ ...config, shortcuts: { ...config.shortcuts, [key]: value } });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await actualizarConfiguracionGeneral(config);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.data) onChange(result.data.config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Datos y atajos del taller</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold">
              Costos y contacto
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Costo fijo mensual (ARS)"
                type="number"
                step="any"
                min="1"
                value={config.costoFijoMensualArs}
                onChange={(e) =>
                  onChange({
                    ...config,
                    costoFijoMensualArs: Number(e.target.value),
                  })
                }
                hint={`Alquiler + sueldos + servicios. Actual: ${formatCurrency(config.costoFijoMensualArs)}`}
                required
              />
              <Input
                label="WhatsApp del taller"
                type="tel"
                inputMode="tel"
                value={config.whatsappTaller}
                onChange={(e) =>
                  onChange({ ...config, whatsappTaller: e.target.value })
                }
                hint="Solo dígitos con código de país (ej: 5491178267986). Se muestra en el portal de tracking y en los links generados."
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs uppercase tracking-wider text-ink-muted font-semibold">
              Atajos de teclado
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ShortcutInput
                label="Buscar órdenes (palette)"
                value={config.shortcuts.palette}
                onChange={(v) => updateShortcut("palette", v)}
              />
              <ShortcutInput
                label="Nueva orden"
                value={config.shortcuts.nuevaOrden}
                onChange={(v) => updateShortcut("nuevaOrden", v)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-status-red">{error}</p>}
          {success && (
            <p className="text-sm text-status-green">Configuración guardada.</p>
          )}

          <Button type="submit" loading={isPending} variant="secondary">
            Guardar datos y atajos
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}