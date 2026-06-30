import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeloCard } from "@/components/SeloCard";
import { ProgressoBar } from "@/components/ProgressoBar";
import { RecompensaCard } from "@/components/RecompensaCard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { listarTrailers } from "@/lib/services/trailers";
import { listarSelos, listarRecompensas, resgatarRecompensa, META_SELOS } from "@/lib/services/fidelidade";
import type { Recompensa, SeloFidelidade, Trailer } from "@/lib/types";

export default function Fidelidade() {
  const { usuario } = useAuth();
  const { toast } = useToast();
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [selos, setSelos] = useState<SeloFidelidade[]>([]);
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [resgatandoId, setResgatandoId] = useState<string | null>(null);

  const carregar = useCallback(() => {
    if (!usuario) return;
    listarTrailers().then(setTrailers);
    listarSelos(usuario.id).then(setSelos);
    listarRecompensas().then(setRecompensas);
  }, [usuario]);

  useEffect(carregar, [carregar]);

  const trailersComProgresso = useMemo(() => {
    return trailers
      .map((trailer) => {
        const selo = selos.find((s) => s.trailer_id === trailer.id);
        const quantidade = selo?.quantidade ?? 0;
        const recompensasDoTrailer = recompensas.filter((r) => r.trailer_id === trailer.id);
        return { trailer, quantidade, recompensas: recompensasDoTrailer };
      })
      .filter((t) => t.quantidade > 0 || t.recompensas.length > 0);
  }, [trailers, selos, recompensas]);

  async function aoResgatar(recompensa: Recompensa) {
    if (!usuario) return;
    setResgatandoId(recompensa.id);
    try {
      await resgatarRecompensa(usuario.id, recompensa.trailer_id, recompensa.selos_necessarios);
      toast({ titulo: "Recompensa resgatada! 🎁", descricao: recompensa.nome, variante: "celebracao" });
      carregar();
    } catch (err) {
      toast({ titulo: "Não foi possível resgatar", descricao: String(err) });
    } finally {
      setResgatandoId(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Fidelidade 🏆</h1>
        <p className="text-muted-foreground">A cada 10 compras em um trailer, você desbloqueia uma recompensa.</p>
      </div>

      {trailersComProgresso.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Faça seu primeiro pedido em um trailer para começar a colecionar selos!
          </CardContent>
        </Card>
      )}

      {trailersComProgresso.map(({ trailer, quantidade, recompensas: recompensasDoTrailer }) => {
        const noCicloAtual = quantidade % META_SELOS || (quantidade > 0 ? META_SELOS : 0);
        return (
          <Card key={trailer.id}>
            <CardHeader>
              <CardTitle>{trailer.nome}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ProgressoBar progresso={quantidade} meta={META_SELOS} />
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                {Array.from({ length: META_SELOS }).map((_, i) => (
                  <SeloCard
                    key={i}
                    selo={{ id: `${trailer.id}-${i}`, nome: `${i + 1}`, coletado: i < noCicloAtual }}
                  />
                ))}
              </div>
              {recompensasDoTrailer.length > 0 && (
                <div className="flex flex-col gap-2">
                  {recompensasDoTrailer.map((r) => (
                    <RecompensaCard
                      key={r.id}
                      recompensa={r}
                      selosAtuais={quantidade}
                      onResgatar={() => aoResgatar(r)}
                      resgatando={resgatandoId === r.id}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
