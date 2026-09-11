"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";

export function ClientesSearch({ initialQuery }: { initialQuery?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    startTransition(() => {
      router.replace(`/clientes?${params.toString()}`);
    });
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
      <input
        type="text"
        placeholder="Buscar por nombre o telefono..."
        defaultValue={initialQuery ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full pl-9 pr-4 py-2 text-sm bg-surface-base border border-white/10 rounded-lg text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green/50 transition-colors"
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-ink-muted border-t-transparent" />
        </div>
      )}
    </div>
  );
}
