import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seguimiento de orden · SierraTech Taller",
  description: "Portal público para seguir el estado de una orden de servicio.",
};

export default function TrackingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-base">
      {children}
    </div>
  );
}
