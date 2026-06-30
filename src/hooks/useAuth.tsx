import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authService from "@/lib/services/auth";
import type { CadastroInput, LoginInput } from "@/lib/services/auth";
import type { Usuario } from "@/lib/types";

interface AuthContextValue {
  usuario: Usuario | null;
  carregando: boolean;
  login: (input: LoginInput) => Promise<Usuario>;
  cadastrar: (input: CadastroInput) => Promise<Usuario>;
  logout: () => Promise<void>;
  atualizarUsuario: (patch: Partial<Usuario>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    authService
      .getCurrentUser()
      .then(setUsuario)
      .finally(() => setCarregando(false));
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const u = await authService.login(input);
    setUsuario(u);
    return u;
  }, []);

  const cadastrar = useCallback(async (input: CadastroInput) => {
    const u = await authService.cadastrar(input);
    setUsuario(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUsuario(null);
  }, []);

  const atualizarUsuario = useCallback(
    async (patch: Partial<Usuario>) => {
      if (!usuario) return;
      const atualizado = await authService.atualizarUsuario(usuario.id, patch);
      setUsuario(atualizado);
    },
    [usuario],
  );

  const value = useMemo(
    () => ({ usuario, carregando, login, cadastrar, logout, atualizarUsuario }),
    [usuario, carregando, login, cadastrar, logout, atualizarUsuario],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
