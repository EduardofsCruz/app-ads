import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { mockStore, seedIfNeeded } from "@/lib/mockStore";
import type { CategoriaComida, NotificacaoPush } from "@/lib/types";

export const CUSTO_CREDITO_POR_NOTIFICACAO = 1;
export const PACOTES_CREDITO = [
  { quantidade: 5, preco: 19.9 },
  { quantidade: 15, preco: 49.9 },
  { quantidade: 40, preco: 119.9 },
];

export interface NovaNotificacaoInput {
  trailer_id: string;
  titulo: string;
  mensagem: string;
  segmentacao_horario?: string;
  segmentacao_localizacao?: string;
  segmentacao_preferencia?: CategoriaComida;
}

export async function obterCreditos(trailerId: string): Promise<number> {
  if (isSupabaseConfigured && supabase) {
    // créditos não fazem parte do schema relacional; mantidos no mock para a demo de patrocínio.
    return mockStore.getCreditos()[trailerId] ?? 0;
  }
  seedIfNeeded();
  return mockStore.getCreditos()[trailerId] ?? 0;
}

export async function comprarCreditos(trailerId: string, quantidade: number): Promise<number> {
  seedIfNeeded();
  const atual = mockStore.getCreditos()[trailerId] ?? 0;
  const novo = atual + quantidade;
  mockStore.setCreditos(trailerId, novo);
  return novo;
}

export async function listarNotificacoesDoTrailer(trailerId: string): Promise<NotificacaoPush[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("notificacoes_push")
      .select("*")
      .eq("trailer_id", trailerId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data as NotificacaoPush[];
  }
  seedIfNeeded();
  return mockStore
    .getNotificacoes()
    .filter((n) => n.trailer_id === trailerId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function listarTodasNotificacoes(): Promise<NotificacaoPush[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("notificacoes_push")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data as NotificacaoPush[];
  }
  seedIfNeeded();
  return mockStore.getNotificacoes();
}

export async function criarNotificacao(input: NovaNotificacaoInput): Promise<NotificacaoPush> {
  const creditos = await obterCreditos(input.trailer_id);
  if (creditos < CUSTO_CREDITO_POR_NOTIFICACAO) {
    throw new Error("Créditos insuficientes. Compre um pacote de notificações.");
  }

  const notificacao: NotificacaoPush = {
    id: mockStore.uid("notif"),
    creditos_gastos: CUSTO_CREDITO_POR_NOTIFICACAO,
    created_at: new Date().toISOString(),
    ...input,
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("notificacoes_push")
      .insert(notificacao)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await comprarCreditos(input.trailer_id, -CUSTO_CREDITO_POR_NOTIFICACAO);
    return data as NotificacaoPush;
  }

  mockStore.saveNotificacao(notificacao);
  mockStore.setCreditos(input.trailer_id, creditos - CUSTO_CREDITO_POR_NOTIFICACAO);
  return notificacao;
}
