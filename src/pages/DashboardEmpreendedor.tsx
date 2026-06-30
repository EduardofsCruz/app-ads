import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CardapioForm } from "@/components/CardapioForm";
import { PromocaoForm } from "@/components/PromocaoForm";
import { NotificacaoForm, type NotificacaoFormDados } from "@/components/NotificacaoForm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { ESPLANADA_CENTER } from "@/lib/geolocation";
import {
  buscarTrailerPorDono,
  listarCardapio,
  removerItemCardapio,
  salvarItemCardapio,
  salvarTrailer,
} from "@/lib/services/trailers";
import { criarRecompensa, listarRecompensas } from "@/lib/services/fidelidade";
import {
  comprarCreditos,
  criarNotificacao,
  listarNotificacoesDoTrailer,
  obterCreditos,
  PACOTES_CREDITO,
} from "@/lib/services/notificacoes";
import { CATEGORIAS, type CardapioItem, type CategoriaComida, type NotificacaoPush, type Recompensa, type Trailer } from "@/lib/types";
import { formatBRL } from "@/lib/utils";

export default function DashboardEmpreendedor() {
  const { usuario } = useAuth();
  const { toast } = useToast();
  const [trailer, setTrailer] = useState<Trailer | null | undefined>(undefined);
  const [itens, setItens] = useState<CardapioItem[]>([]);
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [notificacoes, setNotificacoes] = useState<NotificacaoPush[]>([]);
  const [creditos, setCreditos] = useState(0);
  const [editando, setEditando] = useState<CardapioItem | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);

  const carregarTudo = useCallback(async (t: Trailer) => {
    const [cardapio, rec, notifs, cred] = await Promise.all([
      listarCardapio(t.id),
      listarRecompensas(t.id),
      listarNotificacoesDoTrailer(t.id),
      obterCreditos(t.id),
    ]);
    setItens(cardapio);
    setRecompensas(rec);
    setNotificacoes(notifs);
    setCreditos(cred);
  }, []);

  useEffect(() => {
    if (!usuario) return;
    buscarTrailerPorDono(usuario.id).then((t) => {
      setTrailer(t);
      if (t) carregarTudo(t);
    });
  }, [usuario, carregarTudo]);

  async function aoCriarTrailer(dados: Omit<Trailer, "id" | "dono_id">) {
    if (!usuario) return;
    const novoTrailer: Trailer = {
      id: crypto.randomUUID(),
      dono_id: usuario.id,
      ...dados,
    };
    const salvo = await salvarTrailer(novoTrailer);
    setTrailer(salvo);
    toast({ titulo: "Trailer criado com sucesso!", variante: "sucesso" });
    carregarTudo(salvo);
  }

  async function aoSalvarItem(dados: Omit<CardapioItem, "id"> & { id?: string }) {
    await salvarItemCardapio({ ...dados, id: dados.id ?? crypto.randomUUID() } as CardapioItem);
    if (trailer) carregarTudo(trailer);
    setDialogAberto(false);
    setEditando(null);
    toast({ titulo: "Cardápio atualizado", variante: "sucesso" });
  }

  async function aoRemoverItem(id: string) {
    await removerItemCardapio(id);
    if (trailer) carregarTudo(trailer);
  }

  async function aoCriarPromocao(dados: Parameters<typeof criarRecompensa>[0]) {
    await criarRecompensa(dados);
    if (trailer) carregarTudo(trailer);
    toast({ titulo: "Promoção criada!", variante: "sucesso" });
  }

  async function aoCriarNotificacao(dados: NotificacaoFormDados) {
    if (!trailer) return;
    try {
      await criarNotificacao({ trailer_id: trailer.id, ...dados });
      await carregarTudo(trailer);
      toast({ titulo: "Notificação enviada aos consumidores!", variante: "celebracao" });
    } catch (err) {
      toast({ titulo: "Não foi possível enviar", descricao: String(err) });
    }
  }

  async function aoComprarPacote(quantidade: number) {
    if (!trailer) return;
    const novoTotal = await comprarCreditos(trailer.id, quantidade);
    setCreditos(novoTotal);
    toast({ titulo: `${quantidade} créditos adicionados!`, variante: "sucesso" });
  }

  if (trailer === undefined) {
    return <p className="text-muted-foreground">Carregando...</p>;
  }

  if (trailer === null) {
    return <CriarTrailerForm onSubmit={aoCriarTrailer} />;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{trailer.nome}</h1>
        <p className="text-muted-foreground">Gerencie seu cardápio, promoções e notificações patrocinadas.</p>
      </div>

      <Tabs defaultValue="cardapio">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cardapio">Cardápio</TabsTrigger>
          <TabsTrigger value="promocoes">Promoções</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="cardapio" className="flex flex-col gap-3">
          <div className="flex justify-end">
            <Dialog
              open={dialogAberto}
              onOpenChange={(open) => {
                setDialogAberto(open);
                if (!open) setEditando(null);
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" /> Novo item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editando ? "Editar item" : "Novo item do cardápio"}</DialogTitle>
                </DialogHeader>
                <CardapioForm trailerId={trailer.id} itemInicial={editando ?? undefined} onSubmit={aoSalvarItem} />
              </DialogContent>
            </Dialog>
          </div>
          {itens.map((item) => (
            <Card key={item.id} className="flex flex-row items-center gap-3 p-3">
              <img src={item.foto} alt={item.nome} className="h-14 w-14 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="font-medium">{item.nome}</p>
                <p className="text-sm text-muted-foreground">{formatBRL(item.preco)}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditando(item);
                  setDialogAberto(true);
                }}
              >
                Editar
              </Button>
              <Button size="icon" variant="ghost" onClick={() => aoRemoverItem(item.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </Card>
          ))}
          {itens.length === 0 && <p className="text-muted-foreground">Nenhum item cadastrado ainda.</p>}
        </TabsContent>

        <TabsContent value="promocoes" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Nova promoção / recompensa</CardTitle>
              <CardDescription>Disponível na página de Fidelidade dos seus clientes.</CardDescription>
            </CardHeader>
            <CardContent>
              <PromocaoForm trailerId={trailer.id} onSubmit={aoCriarPromocao} />
            </CardContent>
          </Card>
          <div className="flex flex-col gap-2">
            {recompensas.map((r) => (
              <Card key={r.id} className="p-3">
                <p className="font-medium">{r.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {r.descricao} · {r.selos_necessarios} selos
                </p>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notificacoes" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Comprar créditos</CardTitle>
              <CardDescription>Pacotes de notificações push patrocinadas.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {PACOTES_CREDITO.map((p) => (
                <Button key={p.quantidade} variant="outline" size="sm" onClick={() => aoComprarPacote(p.quantidade)}>
                  {p.quantidade} créditos — {formatBRL(p.preco)}
                </Button>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Nova notificação patrocinada</CardTitle>
              <CardDescription>Segmente por horário, localização e preferência alimentar.</CardDescription>
            </CardHeader>
            <CardContent>
              <NotificacaoForm onSubmit={aoCriarNotificacao} creditos={creditos} />
            </CardContent>
          </Card>
          <div className="flex flex-col gap-2">
            {notificacoes.map((n) => (
              <Card key={n.id} className="p-3">
                <p className="font-medium">{n.titulo}</p>
                <p className="text-sm text-muted-foreground">{n.mensagem}</p>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CriarTrailerForm({ onSubmit }: { onSubmit: (dados: Omit<Trailer, "id" | "dono_id">) => void }) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [foto, setFoto] = useState("");
  const [categoria, setCategoria] = useState<CategoriaComida>("executivo");
  const [horario, setHorario] = useState("");
  const [formasPagamento, setFormasPagamento] = useState("Pix, Cartão");

  function aoEnviar(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      nome,
      descricao,
      foto,
      categoria,
      latitude: ESPLANADA_CENTER.latitude,
      longitude: ESPLANADA_CENTER.longitude,
      horario_funcionamento: horario,
      formas_pagamento: formasPagamento.split(",").map((f) => f.trim()).filter(Boolean),
      nota: 5,
    });
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Cadastre seu trailer</CardTitle>
          <CardDescription>Antes de gerenciar cardápio e promoções, conte sobre o seu negócio.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={aoEnviar} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="trailer-nome">Nome do trailer</Label>
              <Input id="trailer-nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="trailer-foto">URL da foto</Label>
              <Input id="trailer-foto" value={foto} onChange={(e) => setFoto(e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="trailer-descricao">Descrição</Label>
              <Textarea id="trailer-descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="trailer-horario">Horário de funcionamento</Label>
              <Input
                id="trailer-horario"
                required
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                placeholder="11h às 15h, seg a sex"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="trailer-pagamento">Formas de pagamento (separadas por vírgula)</Label>
              <Input
                id="trailer-pagamento"
                value={formasPagamento}
                onChange={(e) => setFormasPagamento(e.target.value)}
              />
            </div>
            <Button type="submit" className="mt-2">
              Criar trailer
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
