import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/utils";

export interface CardapioItemData {
  id: string;
  nome: string;
  foto: string;
  descricao: string;
  preco: number;
  disponivel: boolean;
}

interface CardapioItemProps {
  item: CardapioItemData;
  onPedir?: (item: CardapioItemData) => void;
  pedindo?: boolean;
}

export function CardapioItem({ item, onPedir, pedindo }: CardapioItemProps) {
  return (
    <Card className="flex gap-3 p-3">
      <img
        src={item.foto}
        alt={item.nome}
        className="h-20 w-20 shrink-0 rounded-lg object-cover"
        loading="lazy"
      />
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold leading-tight">{item.nome}</p>
          {!item.disponivel && <Badge variant="muted">Esgotado</Badge>}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{item.descricao}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-semibold text-primary">{formatBRL(item.preco)}</span>
          {onPedir && (
            <Button size="sm" disabled={!item.disponivel || pedindo} onClick={() => onPedir(item)}>
              {pedindo ? "Pedindo..." : "Pedir"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
