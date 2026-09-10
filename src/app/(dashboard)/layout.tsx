import { AuthProvider } from "@/components/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getSesionActivaGlobal } from "@/lib/queries/tiempo";
import { obtenerConfiguracionGeneral } from "@/app/actions/settings";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sesionActiva, configGeneral] = await Promise.all([
    getSesionActivaGlobal(),
    obtenerConfiguracionGeneral(),
  ]);
  return (
    <AuthProvider>
      <DashboardShell
        sesionActiva={sesionActiva}
        shortcuts={configGeneral.shortcuts}
      >
        {children}
      </DashboardShell>
    </AuthProvider>
  );
}
