import { ComingSoon } from "@/components/coming-soon";

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ComingSoon
      title="Detalle de cliente"
      description={`Historial de equipos y órdenes del cliente. (ID: ${id.slice(0, 8)}...)`}
      fase="Fase 5"
    />
  );
}
