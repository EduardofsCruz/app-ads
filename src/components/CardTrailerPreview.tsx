import { Link } from "react-router-dom";
import { Star, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORIAS } from "@/lib/types";
import { formatDistancia } from "@/lib/utils";

export interface TrailerPreview {
  id: string;
  nome: string;
  foto: string;
  distancia: number;
  nota: number;
  categoria: string;
  horario_funcionamento?: string;
}

export function CardTrailerPreview({ trailer }: { trailer: TrailerPreview }) {
  const categoria = CATEGORIAS.find((c) => c.value === trailer.categoria);

  return (
    <Link to={`/cardapio/${trailer.id}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative h-36 w-full overflow-hidden bg-muted">
          <img
            src={trailer.foto}
            alt={trailer.nome}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          <Badge className="absolute left-2 top-2" variant="secondary">
            {categoria ? `${categoria.emoji} ${categoria.label}` : trailer.categoria}
          </Badge>
        </div>
        <div className="p-3">
          <p className="truncate font-semibold leading-tight">{trailer.nome}</p>
          <div className="mt-1.5 flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {formatDistancia(trailer.distancia)}
            </span>
            <span className="flex items-center gap-1 font-medium text-camara-text">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {trailer.nota.toFixed(1)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
