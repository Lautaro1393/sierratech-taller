"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  actualizarTarifaHoraria,
  actualizarConfiguracionPricing,
} from "@/app/actions/settings";
import { formatCurrency } from "@/lib/utils";
import type { ViabilityConfig } from "@/types";

interface SettingsClientProps {
  initialTarifa: number;
  initialConfig: ViabilityConfig;
}

export function SettingsClient({ initialTarifa, initialConfig }: SettingsClientProps) {
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

      <PricingCard initialConfig={initialConfig} />

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

function PricingCard({ initialConfig }: { initialConfig: ViabilityConfig }) {
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
    ? Math.round((1700000 / config.costoHoraPisoArs) * 10) / 10
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
              {formatCurrency(1700000)} de costo fijo.
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
