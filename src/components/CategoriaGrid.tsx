import { CATEGORIAS, type CategoriaComida } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CategoriaGridProps {
  categorias?: CategoriaComida[];
  selecionada?: CategoriaComida | null;
  onSelect: (categoria: CategoriaComida | null) => void;
}

export function CategoriaGrid({ categorias, selecionada, onSelect }: CategoriaGridProps) {
  const itens = CATEGORIAS.filter((c) => !categorias || categorias.includes(c.value));

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "flex shrink-0 flex-col items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
          !selecionada ? "bg-primary text-primary-foreground" : "bg-white text-camara-text hover:bg-muted",
        )}
      >
        <span className="text-xl leading-none">🍽️</span>
        Todos
      </button>
      {itens.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onSelect(cat.value)}
          className={cn(
            "flex shrink-0 flex-col items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
            selecionada === cat.value
              ? "bg-primary text-primary-foreground"
              : "bg-white text-camara-text hover:bg-muted",
          )}
        >
          <span className="text-xl leading-none">{cat.emoji}</span>
          {cat.label}
        </button>
      ))}
    </div>
  );
}
