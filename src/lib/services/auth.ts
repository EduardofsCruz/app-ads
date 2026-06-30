import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { mockStore, seedIfNeeded } from "@/lib/mockStore";
import type { TipoUsuario, Usuario } from "@/lib/types";

export interface CadastroInput {
  nome: string;
  email: string;
  senha: string;
  tipo: TipoUsuario;
}

export interface LoginInput {
  email: string;
  senha: string;
}

export async function cadastrar(input: CadastroInput): Promise<Usuario> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.senha,
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Não foi possível criar o usuário.");

    const usuario: Usuario = {
      id: data.user.id,
      nome: input.nome,
      email: input.email,
      tipo: input.tipo,
      preferencias_alimentares: [],
      created_at: new Date().toISOString(),
    };
    const { error: profileError } = await supabase.from("usuarios").insert({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
      preferencias_alimentares: [],
    });
    if (profileError) throw new Error(profileError.message);
    return usuario;
  }

  seedIfNeeded();
  if (mockStore.findUsuarioByEmail(input.email)) {
    throw new Error("Já existe uma conta com este e-mail.");
  }
  const usuario: Usuario = {
    id: mockStore.uid("usuario"),
    nome: input.nome,
    email: input.email,
    tipo: input.tipo,
    preferencias_alimentares: [],
    created_at: new Date().toISOString(),
  };
  mockStore.saveUsuario(usuario, input.senha);
  mockStore.setSessao(usuario.id);
  return usuario;
}

export async function login(input: LoginInput): Promise<Usuario> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.senha,
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Credenciais inválidas.");
    const { data: perfil, error: profileError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", data.user.id)
      .single();
    if (profileError) throw new Error(profileError.message);
    return perfil as Usuario;
  }

  seedIfNeeded();
  const senhas = mockStore.getSenhas();
  const usuario = mockStore.findUsuarioByEmail(input.email);
  if (!usuario || senhas[input.email] !== input.senha) {
    throw new Error("E-mail ou senha incorretos.");
  }
  mockStore.setSessao(usuario.id);
  return usuario;
}

export async function logout(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
    return;
  }
  mockStore.setSessao(null);
}

export async function getCurrentUser(): Promise<Usuario | null> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return null;
    const { data: perfil } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", userId)
      .single();
    return (perfil as Usuario) ?? null;
  }

  seedIfNeeded();
  const id = mockStore.getSessao();
  if (!id) return null;
  return mockStore.findUsuarioById(id);
}

export async function atualizarUsuario(
  id: string,
  patch: Partial<Usuario>,
): Promise<Usuario> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("usuarios")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Usuario;
  }

  const usuario = mockStore.findUsuarioById(id);
  if (!usuario) throw new Error("Usuário não encontrado.");
  const atualizado = { ...usuario, ...patch };
  mockStore.saveUsuario(atualizado);
  return atualizado;
}
