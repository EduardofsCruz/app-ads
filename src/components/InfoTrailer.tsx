import { Clock, CreditCard, MapPin, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CATEGORIAS } from "@/lib/types";
import type { Trailer } from "@/lib/types";
import { formatDistancia } from "@/lib/utils";

export function InfoTrailer({ trailer, distancia, nota }: { trailer: Trailer; distancia?: number; nota?: number }) {
  const categoria = CATEGORIAS.find((c) => c.value === trailer.categoria);

  return (
    <Card className="overflow-hidden">
      <div className="h-48 w-full overflow-hidden bg-muted sm:h-60">
        <img src={trailer.foto} alt={trailer.nome} className="h-full w-full object-cover" />
      </div>
      <CardContent className="pt-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold">{trailer.nome}</h1>
            <p className="text-sm text-muted-foreground">
              {categoria ? `${categoria.emoji} ${categoria.label}` : trailer.categoria}
            </p>
          </div>
          {typeof nota === "number" && (
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              {nota.toFixed(1)}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-camara-text/80">{trailer.descricao}</p>
        <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> {trailer.horario_funcionamento}
          </span>
          {typeof distancia === "number" && (
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {formatDistancia(distancia)} de você
            </span>
          )}
          <span className="flex items-center gap-2 sm:col-span-2">
            <CreditCard className="h-4 w-4" /> {trailer.formas_pagamento.join(", ")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
