import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await login({ email, senha });
      navigate("/");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-camara-bg px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-2xl">
            🌭
          </div>
          <CardTitle className="text-xl">Câmara Food</CardTitle>
          <CardDescription>Entre para descobrir os trailers da Esplanada</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={aoEnviar} className="flex flex-col gap-4">
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
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <Button type="submit" disabled={enviando} className="mt-1">
              {enviando ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Novo por aqui?{" "}
            <Link to="/cadastro" className="font-medium text-primary hover:underline">
              Criar conta
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
