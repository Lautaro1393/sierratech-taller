"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

const routeNames: Record<string, string> = {
  "/": "Dashboard",
  "/kanban": "Tablero Kanban",
  "/ordenes": "Órdenes de Trabajo",
  "/clientes": "Clientes",
  "/settings": "Configuración",
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const routeName = routeNames[pathname] || "SierraTech Taller";

  return (
    <header className="h-16 bg-surface-elevated/80 backdrop-blur-lg border-b border-white/5 sticky top-0 z-30">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-surface-hover transition-colors"
            title="Menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <nav className="flex items-center gap-2 text-sm text-ink-muted">
            <Link href="/" className="hover:text-ink-secondary transition-colors">
              SierraTech
            </Link>
            <span className="text-ink-muted">/</span>
            <span className="text-ink-primary font-medium">{routeName}</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-ink-primary">
              {user?.email?.split("@")[0] || "Técnico"}
            </p>
            <p className="text-xs text-ink-muted">En línea</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-accent/20 border-2 border-accent/30 flex items-center justify-center">
            <span className="text-accent font-semibold text-sm">
              {user?.email?.[0]?.toUpperCase() || "T"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
