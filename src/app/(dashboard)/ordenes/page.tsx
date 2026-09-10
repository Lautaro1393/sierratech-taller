import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchOrdenes } from "@/lib/queries/ordenes-list";
import { OrdenesFilters } from "@/components/orden/lista/ordenes-filters";
import { OrdenesTable } from "@/components/orden/lista/ordenes-table";
import { OrdenesPagination } from "@/components/orden/lista/ordenes-pagination";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function OrdenesPage(props: PageProps) {
  const sp = await props.searchParams;
  const result = await fetchOrdenes({
    search: sp.search,
    estado: sp.estado,
    urgente: sp.urgente === "1",
    proceso: sp.proceso === "1",
    desde: sp.desde,
    hasta: sp.hasta,
    page: sp.page ? Number(sp.page) : 1,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-primary">
            Órdenes
          </h1>
          <p className="text-ink-secondary mt-1">
            {result.total} {result.total === 1 ? "orden" : "órdenes"}
          </p>
        </div>
        <Link href="/ordenes/nueva">
          <Button>
            <Plus className="w-4 h-4" />
            Nueva Orden
          </Button>
        </Link>
      </div>

      <Suspense>
        <OrdenesFilters />
      </Suspense>

      <Card>
        <CardContent className="p-0 sm:p-4">
          <OrdenesTable ordenes={result.ordenes} />
        </CardContent>
      </Card>

      <OrdenesPagination page={result.page} totalPages={result.totalPages} />
    </div>
  );
}
