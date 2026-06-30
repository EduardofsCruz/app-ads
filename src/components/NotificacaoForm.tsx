import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CATEGORIAS, type CategoriaComida } from "@/lib/types";
import { CUSTO_CREDITO_POR_NOTIFICACAO } from "@/lib/services/notificacoes";

export interface NotificacaoFormDados {
  titulo: string;
  mensagem: string;
  segmentacao_horario?: string;
  segmentacao_localizacao?: string;
  segmentacao_preferencia?: CategoriaComida;
}

interface NotificacaoFormProps {
  onSubmit: (dados: NotificacaoFormDados) => Promise<void> | void;
  creditos: number;
}

const HORARIOS = ["07h-10h", "10h-12h", "11h-14h", "14h-17h", "17h-20h"];

export function NotificacaoForm({ onSubmit, creditos }: NotificacaoFormProps) {
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [horario, setHorario] = useState<string>("");
  const [preferencia, setPreferencia] = useState<string>("");
  const [enviando, setEnviando] = useState(false);

  const semCreditos = creditos < CUSTO_CREDITO_POR_NOTIFICACAO;

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (semCreditos) return;
    setEnviando(true);
    try {
      await onSubmit({
        titulo,
        mensagem,
        segmentacao_horario: horario || undefined,
        segmentacao_localizacao: "Esplanada dos Ministérios",
        segmentacao_preferencia: (preferencia as CategoriaComida) || undefined,
      });
      setTitulo("");
      setMensagem("");
      setHorario("");
      setPreferencia("");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
        <span>Créditos disponíveis</span>
        <Badge variant={semCreditos ? "muted" : "success"}>{creditos}</Badge>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notif-titulo">Título</Label>
        <Input id="notif-titulo" required value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={60} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notif-mensagem">Mensagem</Label>
        <Textarea
          id="notif-mensagem"
          required
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          maxLength={140}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Horário de envio</Label>
          <Select value={horario} onValueChange={setHorario}>
            <SelectTrigger>
              <SelectValue placeholder="Qualquer horário" />
            </SelectTrigger>
            <SelectContent>
              {HORARIOS.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Preferência alimentar</Label>
          <Select value={preferencia} onValueChange={setPreferencia}>
            <SelectTrigger>
              <SelectValue placeholder="Qualquer preferência" />
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
      </div>
      <p className="text-xs text-muted-foreground">
        Segmentação por localização: Esplanada dos Ministérios (fixo). Custo: {CUSTO_CREDITO_POR_NOTIFICACAO} crédito.
      </p>
      <Button type="submit" disabled={enviando || semCreditos} className="self-end">
        {semCreditos ? "Sem créditos" : enviando ? "Enviando..." : "Enviar notificação"}
      </Button>
    </form>
  );
}
