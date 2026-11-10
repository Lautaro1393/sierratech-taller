import Image from "next/image";
import { LoginForm } from "@/components/auth-login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 overflow-hidden">
            <Image
              src="/sierratech-mark.png"
              alt="SierraTech"
              width={64}
              height={64}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-primary">
            SierraTech Taller
          </h1>
          <p className="text-ink-secondary">
            Ingresá a tu cuenta para continuar
          </p>
        </div>

        <div className="glass-card p-6">
          <LoginForm />
        </div>

        <p className="text-center text-xs text-ink-muted">
          Sistema de gestión de órdenes de trabajo
        </p>
      </div>
    </main>
  );
}
