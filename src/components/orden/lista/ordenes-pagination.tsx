"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface OrdenesPaginationProps {
  page: number;
  totalPages: number;
}

export function OrdenesPagination({ page, totalPages }: OrdenesPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  if (totalPages <= 1) return null;

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (p > 1) {
      params.set("page", String(p));
    } else {
      params.delete("page");
    }
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="flex items-center justify-center gap-3 pt-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => goTo(page - 1)}
        disabled={page <= 1 || pending}
      >
        <ChevronLeft className="w-4 h-4" />
        Anterior
      </Button>
      <span className="text-sm text-ink-muted">
        {page} / {totalPages}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages || pending}
      >
        Siguiente
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
