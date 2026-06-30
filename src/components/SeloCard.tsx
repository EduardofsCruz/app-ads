import { Award, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SeloData {
  id: string;
  nome: string;
  icone?: string;
  coletado: boolean;
}

export function SeloCard({ selo, onCollect }: { selo: SeloData; onCollect?: () => void }) {
  return (
    <button
      onClick={onCollect}
      disabled={!onCollect}
      className={cn(
        "flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 text-center transition-all",
        selo.coletado
          ? "animate-pop-in border-primary bg-primary/10 text-primary"
          : "border-dashed border-border bg-muted/40 text-muted-foreground",
      )}
    >
      {selo.coletado ? (
        <span className="text-2xl leading-none">{selo.icone ?? "🏆"}</span>
      ) : (
        <Lock className="h-5 w-5" />
      )}
      <span className="text-[11px] font-medium leading-none">{selo.nome}</span>
    </button>
  );
}

export function SeloIcon({ coletado }: { coletado: boolean }) {
  return coletado ? (
    <Award className="h-5 w-5 text-primary" />
  ) : (
    <Lock className="h-5 w-5 text-muted-foreground" />
  );
}
