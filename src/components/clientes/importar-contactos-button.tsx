"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportarContactos } from "./importar-contactos";
import { useRouter } from "next/navigation";

export function ImportarContactosButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Upload className="w-4 h-4" />
        Importar contactos
      </Button>
      {open && (
        <ImportarContactos
          onClose={() => setOpen(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}
