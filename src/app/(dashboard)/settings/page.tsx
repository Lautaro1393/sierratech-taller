import {
  obtenerTarifaHoraria,
  obtenerConfiguracionPricing,
} from "@/app/actions/settings";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage() {
  const [tarifa, config] = await Promise.all([
    obtenerTarifaHoraria(),
    obtenerConfiguracionPricing(),
  ]);

  return <SettingsClient initialTarifa={tarifa} initialConfig={config} />;
}
