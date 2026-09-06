"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import type { SesionActivaGlobal } from "@/types";

interface DashboardShellProps {
  children: React.ReactNode;
  sesionActiva: SesionActivaGlobal | null;
}

export function DashboardShell({ children, sesionActiva }: DashboardShellProps) {
  const { loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <Sidebar
        sesionActiva={sesionActiva}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="md:pl-64 min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
