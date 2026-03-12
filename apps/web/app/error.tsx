"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="max-w-lg p-8 text-center">
        <div className="eyebrow">Erro</div>
        <p className="mt-3 body-copy">
          {error.message || "Algo deu errado ao carregar esta pagina."}
        </p>
        <Button className="mt-6" onClick={reset}>
          Tentar novamente
        </Button>
      </Card>
    </div>
  );
}
