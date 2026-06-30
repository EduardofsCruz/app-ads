import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { NovaRecompensaInput } from "@/lib/services/fidelidade";
import type { TipoRecompensa } from "@/lib/types";

interface PromocaoFormProps {
  trailerId: string;
  onSubmit: (dados: NovaRecompensaInput) => Promise<void> | void;
}

export function PromocaoForm({ trailerId, onSubmit }: PromocaoFormProps) {
  const [tipo, setTipo] = useState<TipoRecompensa>("desconto");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [selosNecessarios, setSelosNecessarios] = useState("10");
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await onSubmit({
        trailer_id: trailerId,
        nome,
        descricao,
        valor,
        tipo,
        selos_necessarios: parseInt(selosNecessarios, 10),
      });
      setNome("");
      setDescricao("");
      setValor("");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-3">
      <Tabs value={tipo} onValueChange={(v) => setTipo(v as TipoRecompensa)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="desconto">Desconto</TabsTrigger>
          <TabsTrigger value="brinde">Brinde</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="promo-nome">Nome da promoção</Label>
        <Input id="promo-nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="promo-descricao">Descrição</Label>
        <Textarea id="promo-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="promo-valor">{tipo === "desconto" ? "Percentual (ex: 10%)" : "Item de brinde"}</Label>
          <Input id="promo-valor" required value={valor} onChange={(e) => setValor(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="promo-selos">Selos necessários</Label>
          <Input
            id="promo-selos"
            type="number"
            min="1"
            required
            value={selosNecessarios}
            onChange={(e) => setSelosNecessarios(e.target.value)}
          />
        </div>
      </div>
      <Button type="submit" disabled={enviando} className="self-end">
        {enviando ? "Criando..." : "Criar promoção"}
      </Button>
    </form>
  );
}
