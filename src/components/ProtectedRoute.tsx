import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { TipoUsuario } from "@/lib/types";

export function ProtectedRoute({ tipoPermitido }: { tipoPermitido?: TipoUsuario }) {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!usuario) return <Navigate to="/login" replace />;
  if (tipoPermitido && usuario.tipo !== tipoPermitido) return <Navigate to="/" replace />;

  return <Outlet />;
}
