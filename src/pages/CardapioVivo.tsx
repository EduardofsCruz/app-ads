import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { InfoTrailer } from "@/components/InfoTrailer";
import { CardapioItem, type CardapioItemData } from "@/components/CardapioItem";
import { AvaliacaoCard } from "@/components/AvaliacaoCard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { haversineKm } from "@/lib/geolocation";
import { buscarTrailer, listarCardapio } from "@/lib/services/trailers";
import { listarAvaliacoes, criarAvaliacao } from "@/lib/services/avaliacoes";
import { registrarCompra, META_SELOS } from "@/lib/services/fidelidade";
import type { Avaliacao, CardapioItem as CardapioItemType, Trailer } from "@/lib/types";

export default function CardapioVivo() {
  const { id } = useParams<{ id: string }>();
  const { usuario } = useAuth();
  const { toast } = useToast();
  const geo = useGeolocation();

  const [trailer, setTrailer] = useState<Trailer | null>(null);
  const [itens, setItens] = useState<CardapioItemType[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [pedindoId, setPedindoId] = useState<string | null>(null);
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState("");
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);

  useEffect(() => {
    if (!id) return;
    buscarTrailer(id).then(setTrailer);
    listarCardapio(id).then(setItens);
    listarAvaliacoes(id).then(setAvaliacoes);
  }, [id]);

  async function aoPedir(item: CardapioItemData) {
    if (!usuario || !id) return;
    setPedindoId(item.id);
    try {
      const { selo, completouMeta } = await registrarCompra(usuario.id, id);
      toast({
        titulo: "Pedido registrado! 🎉",
        descricao: `Você ganhou um selo de fidelidade neste trailer (${selo.quantidade % META_SELOS || META_SELOS}/${META_SELOS}).`,
        variante: "sucesso",
      });
      if (completouMeta) {
        toast({
          titulo: "Selo completo! Recompensa liberada 🏆",
          descricao: `Você completou ${META_SELOS} compras em ${trailer?.nome}. Resgate sua recompensa na página Fidelidade.`,
          variante: "celebracao",
        });
      }
    } catch (err) {
      toast({ titulo: "Não foi possível registrar o pedido", descricao: String(err) });
    } finally {
      setPedindoId(null);
    }
  }

  async function aoAvaliar(e: React.FormEvent) {
    e.preventDefault();
    if (!usuario || !id) return;
    setEnviandoAvaliacao(true);
    try {
      const nova = await criarAvaliacao({
        usuario_id: usuario.id,
        usuario_nome: usuario.nome,
        trailer_id: id,
        nota,
        comentario,
      });
      setAvaliacoes((prev) => [nova, ...prev.filter((a) => a.usuario_id !== usuario.id)]);
      setComentario("");
      toast({ titulo: "Avaliação enviada, obrigado!", variante: "sucesso" });
    } finally {
      setEnviandoAvaliacao(false);
    }
  }

  if (!trailer) {
    return <p className="text-muted-foreground">Carregando cardápio...</p>;
  }

  const distancia = haversineKm(geo.latitude, geo.longitude, trailer.latitude, trailer.longitude);
  const notaMedia =
    avaliacoes.length > 0 ? avaliacoes.reduce((acc, a) => acc + a.nota, 0) / avaliacoes.length : trailer.nota;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <InfoTrailer trailer={trailer} distancia={distancia} nota={notaMedia} />

      <section>
        <h2 className="mb-3 text-lg font-semibold">Cardápio</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {itens.map((item) => (
            <CardapioItem
              key={item.id}
              item={item}
              onPedir={aoPedir}
              pedindo={pedindoId === item.id}
            />
          ))}
          {itens.length === 0 && <p className="text-muted-foreground">Nenhum item cadastrado ainda.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Avaliações</h2>
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={aoAvaliar} className="mb-4 flex flex-col gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} type="button" onClick={() => setNota(i + 1)}>
                    <Star
                      className={`h-6 w-6 ${i < nota ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Deixe um comentário sobre sua experiência..."
              />
              <Button type="submit" disabled={enviandoAvaliacao} className="self-end">
                Enviar avaliação
              </Button>
            </form>
            {avaliacoes.length === 0 ? (
              <p className="text-muted-foreground">Seja o primeiro a avaliar este trailer.</p>
            ) : (
              avaliacoes.map((a) => <AvaliacaoCard key={a.id} avaliacao={a} />)
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
