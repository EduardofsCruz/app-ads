export type TipoUsuario = "consumidor" | "empreendedor";

export type CategoriaComida =
  | "executivo"
  | "natural"
  | "regional"
  | "fast_food"
  | "sobremesas"
  | "bebidas";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  preferencias_alimentares: CategoriaComida[];
  foto?: string;
  created_at: string;
}

export interface Trailer {
  id: string;
  nome: string;
  foto: string;
  descricao: string;
  categoria: CategoriaComida;
  latitude: number;
  longitude: number;
  horario_funcionamento: string;
  formas_pagamento: string[];
  dono_id: string;
  nota?: number;
}

export interface CardapioItem {
  id: string;
  trailer_id: string;
  nome: string;
  foto: string;
  descricao: string;
  preco: number;
  categoria: CategoriaComida;
  disponivel: boolean;
}

export interface SeloFidelidade {
  id: string;
  usuario_id: string;
  trailer_id: string;
  quantidade: number;
  ultima_compra: string;
}

export type TipoRecompensa = "desconto" | "brinde";

export interface Recompensa {
  id: string;
  nome: string;
  descricao: string;
  selos_necessarios: number;
  tipo: TipoRecompensa;
  valor: string;
  trailer_id: string;
}

export interface NotificacaoPush {
  id: string;
  trailer_id: string;
  titulo: string;
  mensagem: string;
  segmentacao_horario?: string;
  segmentacao_localizacao?: string;
  segmentacao_preferencia?: CategoriaComida;
  creditos_gastos: number;
  created_at: string;
}

export interface Avaliacao {
  id: string;
  usuario_id: string;
  usuario_nome?: string;
  trailer_id: string;
  nota: number;
  comentario: string;
  created_at: string;
}

export const CATEGORIAS: { value: CategoriaComida; label: string; emoji: string }[] = [
  { value: "executivo", label: "Executivo", emoji: "🍱" },
  { value: "natural", label: "Natural", emoji: "🥗" },
  { value: "regional", label: "Regional", emoji: "🍖" },
  { value: "fast_food", label: "Fast Food", emoji: "🍔" },
  { value: "sobremesas", label: "Sobremesas", emoji: "🍰" },
  { value: "bebidas", label: "Bebidas", emoji: "🥤" },
];
