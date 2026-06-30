import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { mockStore, seedIfNeeded } from "@/lib/mockStore";
import type { CardapioItem, Trailer } from "@/lib/types";

export async function listarTrailers(): Promise<Trailer[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from("trailers").select("*");
    if (error) throw new Error(error.message);
    return data as Trailer[];
  }
  seedIfNeeded();
  return mockStore.getTrailers();
}

export async function buscarTrailer(id: string): Promise<Trailer | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("trailers")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data as Trailer;
  }
  seedIfNeeded();
  return mockStore.getTrailers().find((t) => t.id === id) ?? null;
}

export async function buscarTrailerPorDono(donoId: string): Promise<Trailer | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("trailers")
      .select("*")
      .eq("dono_id", donoId)
      .maybeSingle();
    if (error) return null;
    return data as Trailer | null;
  }
  seedIfNeeded();
  return mockStore.getTrailers().find((t) => t.dono_id === donoId) ?? null;
}

export async function salvarTrailer(trailer: Trailer): Promise<Trailer> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("trailers")
      .upsert(trailer)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Trailer;
  }
  mockStore.saveTrailer(trailer);
  return trailer;
}

export async function listarCardapio(trailerId: string): Promise<CardapioItem[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("cardapio_itens")
      .select("*")
      .eq("trailer_id", trailerId);
    if (error) throw new Error(error.message);
    return data as CardapioItem[];
  }
  seedIfNeeded();
  return mockStore.getCardapio().filter((i) => i.trailer_id === trailerId);
}

export async function salvarItemCardapio(item: CardapioItem): Promise<CardapioItem> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("cardapio_itens")
      .upsert(item)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as CardapioItem;
  }
  mockStore.saveCardapioItem(item);
  return item;
}

export async function removerItemCardapio(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from("cardapio_itens").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  mockStore.removeCardapioItem(id);
}
