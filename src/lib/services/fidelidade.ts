import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { mockStore, seedIfNeeded } from "@/lib/mockStore";
import type { Recompensa, SeloFidelidade } from "@/lib/types";

export const META_SELOS = 10;

export async function listarSelos(usuarioId: string): Promise<SeloFidelidade[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("selos_fidelidade")
      .select("*")
      .eq("usuario_id", usuarioId);
    if (error) throw new Error(error.message);
    return data as SeloFidelidade[];
  }
  seedIfNeeded();
  return mockStore.getSelos().filter((s) => s.usuario_id === usuarioId);
}

export async function listarRecompensas(trailerId?: string): Promise<Recompensa[]> {
  if (isSupabaseConfigured && supabase) {
    const query = supabase.from("recompensas").select("*");
    const { data, error } = trailerId ? await query.eq("trailer_id", trailerId) : await query;
    if (error) throw new Error(error.message);
    return data as Recompensa[];
  }
  seedIfNeeded();
  const recompensas = mockStore.getRecompensas();
  return trailerId ? recompensas.filter((r) => r.trailer_id === trailerId) : recompensas;
}

export interface NovaRecompensaInput {
  nome: string;
  descricao: string;
  selos_necessarios: number;
  tipo: Recompensa["tipo"];
  valor: string;
  trailer_id: string;
}

export async function criarRecompensa(input: NovaRecompensaInput): Promise<Recompensa> {
  const recompensa: Recompensa = { id: mockStore.uid("recompensa"), ...input };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("recompensas").insert(recompensa).select().single();
    if (error) throw new Error(error.message);
    return data as Recompensa;
  }

  mockStore.saveRecompensa(recompensa);
  return recompensa;
}

export interface RegistrarCompraResultado {
  selo: SeloFidelidade;
  completouMeta: boolean;
}

export async function registrarCompra(
  usuarioId: string,
  trailerId: string,
): Promise<RegistrarCompraResultado> {
  if (isSupabaseConfigured && supabase) {
    const { data: existente } = await supabase
      .from("selos_fidelidade")
      .select("*")
      .eq("usuario_id", usuarioId)
      .eq("trailer_id", trailerId)
      .maybeSingle();

    const novaQuantidade = ((existente as SeloFidelidade | null)?.quantidade ?? 0) + 1;
    const { data, error } = await supabase
      .from("selos_fidelidade")
      .upsert({
        id: (existente as SeloFidelidade | null)?.id,
        usuario_id: usuarioId,
        trailer_id: trailerId,
        quantidade: novaQuantidade,
        ultima_compra: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    const selo = data as SeloFidelidade;
    return { selo, completouMeta: selo.quantidade % META_SELOS === 0 };
  }

  seedIfNeeded();
  const selos = mockStore.getSelos();
  let selo = selos.find((s) => s.usuario_id === usuarioId && s.trailer_id === trailerId);
  if (!selo) {
    selo = {
      id: mockStore.uid("selo"),
      usuario_id: usuarioId,
      trailer_id: trailerId,
      quantidade: 0,
      ultima_compra: new Date().toISOString(),
    };
  }
  selo = { ...selo, quantidade: selo.quantidade + 1, ultima_compra: new Date().toISOString() };
  mockStore.saveSelo(selo);
  return { selo, completouMeta: selo.quantidade % META_SELOS === 0 };
}

export async function resgatarRecompensa(
  usuarioId: string,
  trailerId: string,
  selosNecessarios: number,
): Promise<SeloFidelidade> {
  const selos = await listarSelos(usuarioId);
  const selo = selos.find((s) => s.trailer_id === trailerId);
  if (!selo || selo.quantidade < selosNecessarios) {
    throw new Error("Selos insuficientes para resgatar esta recompensa.");
  }
  const atualizado: SeloFidelidade = { ...selo, quantidade: selo.quantidade - selosNecessarios };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("selos_fidelidade")
      .update({ quantidade: atualizado.quantidade })
      .eq("id", selo.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as SeloFidelidade;
  }

  mockStore.saveSelo(atualizado);
  return atualizado;
}
