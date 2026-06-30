import { Gift, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Recompensa } from "@/lib/types";

interface RecompensaCardProps {
  recompensa: Recompensa;
  selosAtuais: number;
  trailerNome?: string;
  onResgatar?: () => void;
  resgatando?: boolean;
}

export function RecompensaCard({
  recompensa,
  selosAtuais,
  trailerNome,
  onResgatar,
  resgatando,
}: RecompensaCardProps) {
  const disponivel = selosAtuais >= recompensa.selos_necessarios;

  return (
    <Card className={disponivel ? "border-primary/40" : undefined}>
      <CardContent className="flex items-center gap-3 pt-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {recompensa.tipo === "desconto" ? <Percent className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
        </div>
        <div className="flex-1">
          <p className="font-semibold leading-tight">{recompensa.nome}</p>
          <p className="text-sm text-muted-foreground">{recompensa.descricao}</p>
          {trailerNome && <p className="text-xs text-muted-foreground">{trailerNome}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={disponivel ? "success" : "outline"}>
            {Math.min(selosAtuais, recompensa.selos_necessarios)}/{recompensa.selos_necessarios}
          </Badge>
          {onResgatar && (
            <Button size="sm" disabled={!disponivel || resgatando} onClick={onResgatar}>
              {resgatando ? "Resgatando..." : "Resgatar"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
