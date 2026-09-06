import { obtenerTarifaHoraria } from "@/app/actions/settings";
import { SettingsForm } from "@/components/settings/settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const tarifa = await obtenerTarifaHoraria();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-primary">
          Configuración
        </h1>
        <p className="text-ink-secondary mt-1">
          Parámetros globales del taller.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tarifa horaria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-ink-secondary">
            Se usa para calcular el costo en vivo de cada orden mientras el
            timer está activo, y el margen final contra el presupuesto al
            cerrarla. Cambiá este valor cuando ajuste tu tarifa objetivo.
          </p>
          <SettingsForm initialTarifa={tarifa} />
        </CardContent>
      </Card>
    </div>
  );
}
