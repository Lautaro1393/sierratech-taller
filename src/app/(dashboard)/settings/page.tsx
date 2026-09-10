import {
  obtenerTarifaHoraria,
  obtenerConfiguracionPricing,
  obtenerConfiguracionGeneral,
} from "@/app/actions/settings";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage() {
  const [tarifa, config, configGeneral] = await Promise.all([
    obtenerTarifaHoraria(),
    obtenerConfiguracionPricing(),
    obtenerConfiguracionGeneral(),
  ]);

  return (
    <SettingsClient
      initialTarifa={tarifa}
      initialConfig={config}
      initialConfigGeneral={configGeneral}
    />
  );
}
