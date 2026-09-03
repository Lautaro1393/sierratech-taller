import { ComingSoon } from "@/components/coming-soon";

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="min-h-screen bg-surface-base p-6">
      <ComingSoon
        title="Portal de Tracking"
        description={`Vista pública para que el cliente siga su orden. Token: ${token.slice(0, 8)}...`}
        fase="Fase 6"
      />
    </div>
  );
}
