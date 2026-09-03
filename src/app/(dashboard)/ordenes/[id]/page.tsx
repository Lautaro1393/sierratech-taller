import { ComingSoon } from "@/components/coming-soon";

export default async function OrdenDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ComingSoon
      title="Detalle de orden"
      description={`Timeline, fotos, edición de presupuesto y cambio de estado. (ID: ${id.slice(0, 8)}...)`}
      fase="Fase 5"
    />
  );
}
