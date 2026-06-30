import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIAS, type CardapioItem, type CategoriaComida } from "@/lib/types";

interface CardapioFormProps {
  trailerId: string;
  itemInicial?: CardapioItem;
  onSubmit: (item: Omit<CardapioItem, "id"> & { id?: string }) => Promise<void> | void;
  onCancelar?: () => void;
}

export function CardapioForm({ trailerId, itemInicial, onSubmit, onCancelar }: CardapioFormProps) {
  const [nome, setNome] = useState(itemInicial?.nome ?? "");
  const [foto, setFoto] = useState(itemInicial?.foto ?? "");
  const [descricao, setDescricao] = useState(itemInicial?.descricao ?? "");
  const [preco, setPreco] = useState(itemInicial?.preco?.toString() ?? "");
  const [categoria, setCategoria] = useState<CategoriaComida>(itemInicial?.categoria ?? "executivo");
  const [disponivel, setDisponivel] = useState(itemInicial?.disponivel ?? true);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await onSubmit({
        id: itemInicial?.id,
        trailer_id: trailerId,
        nome,
        foto,
        descricao,
        preco: parseFloat(preco),
        categoria,
        disponivel,
      });
      if (!itemInicial) {
        setNome("");
        setFoto("");
        setDescricao("");
        setPreco("");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="item-nome">Nome do item</Label>
          <Input id="item-nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="item-preco">Preço (R$)</Label>
          <Input
            id="item-preco"
            type="number"
            step="0.01"
            min="0"
            required
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="item-foto">URL da foto</Label>
        <Input id="item-foto" value={foto} onChange={(e) => setFoto(e.target.value)} placeholder="https://..." />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="item-descricao">Descrição</Label>
        <Textarea id="item-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Categoria</Label>
          <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaComida)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.emoji} {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Switch checked={disponivel} onCheckedChange={setDisponivel} id="item-disponivel" />
          <Label htmlFor="item-disponivel">Disponível</Label>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {onCancelar && (
          <Button type="button" variant="outline" onClick={onCancelar}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : itemInicial ? "Salvar alterações" : "Adicionar item"}
        </Button>
      </div>
    </form>
  );
}
