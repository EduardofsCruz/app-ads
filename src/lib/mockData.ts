import type {
  Avaliacao,
  CardapioItem,
  NotificacaoPush,
  Recompensa,
  SeloFidelidade,
  Trailer,
  Usuario,
} from "./types";

export const MOCK_DONOS: Usuario[] = [
  {
    id: "dono-1",
    nome: "Trailer Prato Certo",
    email: "trailer.executivo@camarafood.dev",
    tipo: "empreendedor",
    preferencias_alimentares: [],
    created_at: new Date().toISOString(),
  },
  {
    id: "dono-2",
    nome: "Trailer Verde Vida",
    email: "trailer.natural@camarafood.dev",
    tipo: "empreendedor",
    preferencias_alimentares: [],
    created_at: new Date().toISOString(),
  },
  {
    id: "dono-3",
    nome: "Trailer Sabor do Cerrado",
    email: "trailer.regional@camarafood.dev",
    tipo: "empreendedor",
    preferencias_alimentares: [],
    created_at: new Date().toISOString(),
  },
];

export const MOCK_TRAILERS: Trailer[] = [
  {
    id: "trailer-1",
    nome: "Prato Certo Executivo",
    foto: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80",
    descricao: "Marmitas executivas variadas, feitas no dia.",
    categoria: "executivo",
    latitude: -15.7989,
    longitude: -47.8645,
    horario_funcionamento: "11h às 15h, seg a sex",
    formas_pagamento: ["Pix", "Cartão", "Dinheiro"],
    dono_id: "dono-1",
    nota: 4.7,
  },
  {
    id: "trailer-2",
    nome: "Verde Vida Natural",
    foto: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80",
    descricao: "Saladas, sucos detox e bowls fitness.",
    categoria: "natural",
    latitude: -15.7975,
    longitude: -47.8625,
    horario_funcionamento: "10h30 às 14h30, seg a sex",
    formas_pagamento: ["Pix", "Cartão"],
    dono_id: "dono-2",
    nota: 4.5,
  },
  {
    id: "trailer-3",
    nome: "Sabor do Cerrado",
    foto: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800&q=80",
    descricao: "Comida regional brasiliense, pequi e guariroba.",
    categoria: "regional",
    latitude: -15.8005,
    longitude: -47.866,
    horario_funcionamento: "11h às 16h, seg a sáb",
    formas_pagamento: ["Pix", "Cartão", "Dinheiro"],
    dono_id: "dono-3",
    nota: 4.8,
  },
  {
    id: "trailer-4",
    nome: "Brasa Express",
    foto: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80",
    descricao: "Lanches rápidos e burgers artesanais.",
    categoria: "fast_food",
    latitude: -15.7968,
    longitude: -47.861,
    horario_funcionamento: "11h às 21h, todos os dias",
    formas_pagamento: ["Pix", "Cartão"],
    dono_id: "dono-1",
    nota: 4.3,
  },
  {
    id: "trailer-5",
    nome: "Doce Capital",
    foto: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80",
    descricao: "Sobremesas, açaí e doces caseiros.",
    categoria: "sobremesas",
    latitude: -15.801,
    longitude: -47.8595,
    horario_funcionamento: "12h às 18h, seg a sex",
    formas_pagamento: ["Pix", "Dinheiro"],
    dono_id: "dono-2",
    nota: 4.6,
  },
];

export const MOCK_CARDAPIO: CardapioItem[] = [
  { id: "item-1", trailer_id: "trailer-1", nome: "Marmita Frango Grelhado", foto: "https://images.unsplash.com/photo-1432139509613-5c4255815697?w=600&q=80", descricao: "Frango grelhado, arroz, feijão, legumes.", preco: 22.9, categoria: "executivo", disponivel: true },
  { id: "item-2", trailer_id: "trailer-1", nome: "Marmita Carne de Panela", foto: "https://images.unsplash.com/photo-1606850780554-b55ea4dd0b70?w=600&q=80", descricao: "Carne de panela com mandioca e couve.", preco: 24.9, categoria: "executivo", disponivel: true },
  { id: "item-3", trailer_id: "trailer-1", nome: "Suco de Laranja", foto: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&q=80", descricao: "Suco natural de laranja 500ml.", preco: 8.0, categoria: "bebidas", disponivel: true },
  { id: "item-4", trailer_id: "trailer-2", nome: "Bowl Fitness Quinoa", foto: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80", descricao: "Quinoa, grão de bico, legumes assados.", preco: 26.5, categoria: "natural", disponivel: true },
  { id: "item-5", trailer_id: "trailer-2", nome: "Suco Detox Verde", foto: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=600&q=80", descricao: "Couve, limão, gengibre e maçã.", preco: 11.0, categoria: "bebidas", disponivel: true },
  { id: "item-6", trailer_id: "trailer-2", nome: "Salada Caesar Vegana", foto: "https://images.unsplash.com/photo-1551248429-40975aa4de74?w=600&q=80", descricao: "Alface, croutons, tofu grelhado.", preco: 21.0, categoria: "natural", disponivel: false },
  { id: "item-7", trailer_id: "trailer-3", nome: "Galinhada com Pequi", foto: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80", descricao: "Galinhada caseira com pequi do cerrado.", preco: 28.0, categoria: "regional", disponivel: true },
  { id: "item-8", trailer_id: "trailer-3", nome: "Pamonha Doce", foto: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=600&q=80", descricao: "Pamonha tradicional feita na hora.", preco: 9.5, categoria: "sobremesas", disponivel: true },
  { id: "item-9", trailer_id: "trailer-4", nome: "Burger Artesanal", foto: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80", descricao: "Pão brioche, blend 150g, queijo e bacon.", preco: 24.0, categoria: "fast_food", disponivel: true },
  { id: "item-10", trailer_id: "trailer-4", nome: "Batata Rústica", foto: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80", descricao: "Porção de batata rústica com alecrim.", preco: 14.0, categoria: "fast_food", disponivel: true },
  { id: "item-11", trailer_id: "trailer-5", nome: "Açaí 500ml", foto: "https://images.unsplash.com/photo-1611077544871-1ee1d8e75e69?w=600&q=80", descricao: "Açaí com granola, banana e leite em pó.", preco: 16.0, categoria: "sobremesas", disponivel: true },
  { id: "item-12", trailer_id: "trailer-5", nome: "Brownie com Sorvete", foto: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80", descricao: "Brownie quente com sorvete de creme.", preco: 13.5, categoria: "sobremesas", disponivel: true },
];

export const MOCK_RECOMPENSAS: Recompensa[] = [
  { id: "recompensa-1", nome: "10% de desconto", descricao: "Desconto na próxima marmita.", selos_necessarios: 10, tipo: "desconto", valor: "10%", trailer_id: "trailer-1" },
  { id: "recompensa-2", nome: "Suco grátis", descricao: "Um suco detox por sua conta.", selos_necessarios: 10, tipo: "brinde", valor: "Suco Detox Verde", trailer_id: "trailer-2" },
  { id: "recompensa-3", nome: "Pamonha grátis", descricao: "Uma pamonha doce de cortesia.", selos_necessarios: 10, tipo: "brinde", valor: "Pamonha Doce", trailer_id: "trailer-3" },
  { id: "recompensa-4", nome: "Batata grátis", descricao: "Uma porção de batata rústica de cortesia.", selos_necessarios: 10, tipo: "brinde", valor: "Batata Rústica", trailer_id: "trailer-4" },
  { id: "recompensa-5", nome: "15% de desconto", descricao: "Desconto em qualquer sobremesa.", selos_necessarios: 10, tipo: "desconto", valor: "15%", trailer_id: "trailer-5" },
];

export const MOCK_SELOS: SeloFidelidade[] = [];
export const MOCK_NOTIFICACOES: NotificacaoPush[] = [
  {
    id: "notif-1",
    trailer_id: "trailer-1",
    titulo: "Marmita do dia com 15% OFF",
    mensagem: "Hoje até as 14h, marmitas executivas com desconto especial.",
    segmentacao_horario: "11h-14h",
    segmentacao_localizacao: "Esplanada dos Ministérios",
    segmentacao_preferencia: "executivo",
    creditos_gastos: 2,
    created_at: new Date().toISOString(),
  },
];
export const MOCK_AVALIACOES: Avaliacao[] = [
  { id: "aval-1", usuario_id: "dono-3", usuario_nome: "Visitante", trailer_id: "trailer-1", nota: 5, comentario: "Marmita excelente, chegou rápido!", created_at: new Date().toISOString() },
  { id: "aval-2", usuario_id: "dono-1", usuario_nome: "Servidor Federal", trailer_id: "trailer-2", nota: 4, comentario: "Bowl muito fresco, recomendo.", created_at: new Date().toISOString() },
];
