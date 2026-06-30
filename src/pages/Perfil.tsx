import { useCallback, useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { listarSelos } from "@/lib/services/fidelidade";
import { listarTrailers } from "@/lib/services/trailers";
import { CATEGORIAS, type CategoriaComida, type SeloFidelidade, type Trailer } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Perfil() {
  const { usuario, atualizarUsuario, logout } = useAuth();
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [selos, setSelos] = useState<SeloFidelidade[]>([]);

  useEffect(() => {
    if (!usuario) return;
    listarTrailers().then(setTrailers);
    listarSelos(usuario.id).then(setSelos);
  }, [usuario]);

  if (!usuario) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={usuario.foto} alt={usuario.nome} />
          <AvatarFallback className="text-lg">{usuario.nome.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{usuario.nome}</h1>
          <p className="text-muted-foreground">{usuario.email}</p>
          <Badge variant="secondary" className="mt-1">
            {usuario.tipo === "empreendedor" ? "Empreendedor" : "Consumidor"}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </div>

      <PreferenciasForm
        preferencias={usuario.preferencias_alimentares}
        onSalvar={(preferencias) => atualizarUsuario({ preferencias_alimentares: preferencias })}
      />

      <HistoricoCard trailers={trailers} selos={selos} />

      <ConfigNotificacao />
    </div>
  );
}

function PreferenciasForm({
  preferencias,
  onSalvar,
}: {
  preferencias: CategoriaComida[];
  onSalvar: (preferencias: CategoriaComida[]) => Promise<void> | void;
}) {
  const { toast } = useToast();
  const [selecionadas, setSelecionadas] = useState<CategoriaComida[]>(preferencias);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => setSelecionadas(preferencias), [preferencias]);

  function alternar(categoria: CategoriaComida) {
    setSelecionadas((prev) =>
      prev.includes(categoria) ? prev.filter((c) => c !== categoria) : [...prev, categoria],
    );
  }

  const aoSalvar = useCallback(async () => {
    setSalvando(true);
    try {
      await onSalvar(selecionadas);
      toast({ titulo: "Preferências atualizadas", variante: "sucesso" });
    } finally {
      setSalvando(false);
    }
  }, [onSalvar, selecionadas, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferências alimentares</CardTitle>
        <CardDescription>Usamos isso para recomendar trailers e segmentar notificações.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS.map((c) => {
            const ativa = selecionadas.includes(c.value);
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => alternar(c.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  ativa
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                <span>{c.emoji}</span>
                {c.label}
              </button>
            );
          })}
        </div>
        <Button size="sm" className="self-end" disabled={salvando} onClick={aoSalvar}>
          {salvando ? "Salvando..." : "Salvar preferências"}
        </Button>
      </CardContent>
    </Card>
  );
}

function HistoricoCard({ trailers, selos }: { trailers: Trailer[]; selos: SeloFidelidade[] }) {
  const historico = selos
    .filter((s) => s.quantidade > 0)
    .map((selo) => ({ selo, trailer: trailers.find((t) => t.id === selo.trailer_id) }))
    .filter((h) => h.trailer)
    .sort((a, b) => b.selo.ultima_compra.localeCompare(a.selo.ultima_compra));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de compras</CardTitle>
        <CardDescription>Seus selos de fidelidade por trailer.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {historico.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma compra registrada ainda.</p>
        )}
        {historico.map(({ selo, trailer }) => (
          <div key={selo.id} className="flex items-center gap-3">
            <img src={trailer!.foto} alt={trailer!.nome} className="h-10 w-10 rounded-lg object-cover" />
            <div className="flex-1">
              <p className="font-medium">{trailer!.nome}</p>
              <p className="text-xs text-muted-foreground">
                Última compra: {new Date(selo.ultima_compra).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <Badge variant="muted">{selo.quantidade} selos</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ConfigNotificacao() {
  const [push, setPush] = useState(true);
  const [promocoes, setPromocoes] = useState(true);
  const [proximidade, setProximidade] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações</CardTitle>
        <CardDescription>Escolha o que você quer receber.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="config-push">Notificações push</Label>
          <Switch id="config-push" checked={push} onCheckedChange={setPush} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <Label htmlFor="config-promocoes">Promoções patrocinadas</Label>
          <Switch id="config-promocoes" checked={promocoes} onCheckedChange={setPromocoes} />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <Label htmlFor="config-proximidade">Trailers próximos a mim</Label>
          <Switch id="config-proximidade" checked={proximidade} onCheckedChange={setProximidade} />
        </div>
      </CardContent>
    </Card>
  );
}
