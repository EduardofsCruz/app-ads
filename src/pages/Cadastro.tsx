import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import type { TipoUsuario } from "@/lib/types";

export default function Cadastro() {
  const { cadastrar } = useAuth();
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<TipoUsuario>("consumidor");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await cadastrar({ nome, email, senha, tipo });
      navigate(tipo === "empreendedor" ? "/trailer/dashboard" : "/");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível criar a conta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-camara-bg px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-2xl">
            🌭
          </div>
          <CardTitle className="text-xl">Criar conta</CardTitle>
          <CardDescription>Servidores, visitantes e donos de trailers são bem-vindos</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tipo} onValueChange={(v) => setTipo(v as TipoUsuario)} className="mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="consumidor">Sou consumidor</TabsTrigger>
              <TabsTrigger value="empreendedor">Tenho um trailer</TabsTrigger>
            </TabsList>
          </Tabs>
          <form onSubmit={aoEnviar} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.gov.br"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <Button type="submit" disabled={enviando} className="mt-1">
              {enviando ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
