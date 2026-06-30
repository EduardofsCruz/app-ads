import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { mockStore, seedIfNeeded } from "@/lib/mockStore";
import type { Avaliacao } from "@/lib/types";

export async function listarAvaliacoes(trailerId: string): Promise<Avaliacao[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("avaliacoes")
      .select("*")
      .eq("trailer_id", trailerId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data as Avaliacao[];
  }
  seedIfNeeded();
  return mockStore
    .getAvaliacoes()
    .filter((a) => a.trailer_id === trailerId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function criarAvaliacao(input: {
  usuario_id: string;
  usuario_nome: string;
  trailer_id: string;
  nota: number;
  comentario: string;
}): Promise<Avaliacao> {
  const avaliacao: Avaliacao = {
    id: mockStore.uid("aval"),
    created_at: new Date().toISOString(),
    ...input,
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("avaliacoes")
      .upsert(avaliacao)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Avaliacao;
  }

  mockStore.saveAvaliacao(avaliacao);
  return avaliacao;
}
