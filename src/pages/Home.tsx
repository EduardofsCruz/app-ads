import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BuscaBar } from "@/components/BuscaBar";
import { CategoriaGrid } from "@/components/CategoriaGrid";
import { CardTrailerPreview } from "@/components/CardTrailerPreview";
import { useGeolocation } from "@/hooks/useGeolocation";
import { haversineKm } from "@/lib/geolocation";
import { listarTrailers } from "@/lib/services/trailers";
import type { CategoriaComida, Trailer } from "@/lib/types";

export default function Home() {
  const [searchParams] = useSearchParams();
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState(searchParams.get("busca") ?? "");
  const [categoria, setCategoria] = useState<CategoriaComida | null>(null);
  const geo = useGeolocation();

  useEffect(() => {
    listarTrailers()
      .then(setTrailers)
      .finally(() => setCarregando(false));
  }, []);

  const trailersComDistancia = useMemo(
    () =>
      trailers
        .map((t) => ({
          ...t,
          distancia: haversineKm(geo.latitude, geo.longitude, t.latitude, t.longitude),
        }))
        .sort((a, b) => a.distancia - b.distancia),
    [trailers, geo.latitude, geo.longitude],
  );

  const filtrados = trailersComDistancia.filter((t) => {
    const correspondeBusca = t.nome.toLowerCase().includes(busca.toLowerCase());
    const correspondeCategoria = !categoria || t.categoria === categoria;
    return correspondeBusca && correspondeCategoria;
  });

  const destaques = [...trailersComDistancia].sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0)).slice(0, 3);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Olá! O que vai pedir hoje? 🍴</h1>
        <p className="text-muted-foreground">
          {geo.permitido
            ? "Mostrando trailers perto de você na Esplanada dos Ministérios."
            : "Ative a localização para ver a distância exata até cada trailer."}
        </p>
      </div>

      <BuscaBar value={busca} onChange={setBusca} className="sm:hidden" />

      <CategoriaGrid selecionada={categoria} onSelect={setCategoria} />

      {!busca && !categoria && destaques.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Destaques do dia ⭐</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {destaques.map((t) => (
              <CardTrailerPreview
                key={t.id}
                trailer={{ ...t, nota: t.nota ?? 0 }}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          {busca || categoria ? "Resultados" : "Trailers próximos"}
        </h2>
        {carregando ? (
          <p className="text-muted-foreground">Carregando trailers...</p>
        ) : filtrados.length === 0 ? (
          <p className="text-muted-foreground">Nenhum trailer encontrado.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtrados.map((t) => (
              <CardTrailerPreview key={t.id} trailer={{ ...t, nota: t.nota ?? 0 }} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
