import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ComingSoonProps {
  title: string;
  description?: string;
  fase: string;
}

export function ComingSoon({ title, description, fase }: ComingSoonProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-primary">
          {title}
        </h1>
        {description && (
          <p className="text-ink-secondary mt-1">{description}</p>
        )}
      </div>

      <div className="glass-card p-12 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20">
          <svg
            className="w-8 h-8 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink-primary">
            Próximamente
          </h2>
          <p className="text-sm text-ink-muted mt-1">
            Esta vista llega en {fase}
          </p>
        </div>
        <Link href="/">
          <Button variant="ghost">Volver al dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
