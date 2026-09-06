"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { actualizarTarifaHoraria } from "@/app/actions/settings";
import { formatCurrency } from "@/lib/utils";

interface SettingsFormProps {
  initialTarifa: number;
}

export function SettingsForm({ initialTarifa }: SettingsFormProps) {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Tarifa horaria objetivo (ARS / hora)"
        type="number"
        step="any"
        min="1"
        value={tarifa}
        onChange={(e) => setTarifa(Number(e.target.value))}
        hint={`Se usa para calcular el costo en vivo de cada orden. Actual: ${formatCurrency(tarifa)}/h`}
        required
      />
      {error && (
        <p className="text-sm text-status-red">{error}</p>
      )}
      {success && (
        <p className="text-sm text-status-green">Tarifa guardada.</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" loading={isPending}>
          Guardar tarifa
        </Button>
      </div>
    </form>
  );
}
