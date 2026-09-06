import { AuthProvider } from "@/components/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getSesionActivaGlobal } from "@/lib/queries/tiempo";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesionActiva = await getSesionActivaGlobal();
  return (
    <AuthProvider>
      <DashboardShell sesionActiva={sesionActiva}>
        {children}
      </DashboardShell>
    </AuthProvider>
  );
}
