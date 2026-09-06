"use client";

import { useAuth } from "@/components/auth-provider";
import { Header, Sidebar } from "@/components/layout";
import type { SesionActivaGlobal } from "@/types";

interface DashboardShellProps {
  children: React.ReactNode;
  sesionActiva: SesionActivaGlobal | null;
}

export function DashboardShell({ children, sesionActiva }: DashboardShellProps) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base">
        <div className="text-center space-y-4">
          <div className="animate-spin w-10 h-10 border-2 border-accent border-t-transparent rounded-full mx-auto" />
          <p className="text-ink-secondary">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <Sidebar sesionActiva={sesionActiva} />
      <main className="pl-64 min-h-screen">
        <Header />
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
