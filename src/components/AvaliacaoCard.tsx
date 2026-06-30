import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Avaliacao } from "@/lib/types";

export function AvaliacaoCard({ avaliacao }: { avaliacao: Avaliacao }) {
  const data = new Date(avaliacao.created_at).toLocaleDateString("pt-BR");
  return (
    <div className="flex gap-3 border-b border-border py-3 last:border-0">
      <Avatar className="h-9 w-9">
        <AvatarFallback>{avaliacao.usuario_nome?.[0]?.toUpperCase() ?? "?"}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{avaliacao.usuario_nome ?? "Usuário"}</p>
          <span className="text-xs text-muted-foreground">{data}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${i < avaliacao.nota ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
            />
          ))}
        </div>
        {avaliacao.comentario && <p className="mt-1 text-sm text-camara-text/80">{avaliacao.comentario}</p>}
      </div>
    </div>
  );
}
