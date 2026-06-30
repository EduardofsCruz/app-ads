// Armazenamento local (localStorage) usado como backend de demonstração
// quando nenhuma credencial Supabase está configurada (VITE_SUPABASE_URL/ANON_KEY).
import type {
  Avaliacao,
  CardapioItem,
  NotificacaoPush,
  Recompensa,
  SeloFidelidade,
  Trailer,
  Usuario,
} from "./types";
import {
  MOCK_AVALIACOES,
  MOCK_CARDAPIO,
  MOCK_DONOS,
  MOCK_NOTIFICACOES,
  MOCK_RECOMPENSAS,
  MOCK_SELOS,
  MOCK_TRAILERS,
} from "./mockData";

const KEYS = {
  usuarios: "cf_usuarios",
  senhas: "cf_senhas",
  trailers: "cf_trailers",
  cardapio: "cf_cardapio",
  selos: "cf_selos",
  recompensas: "cf_recompensas",
  notificacoes: "cf_notificacoes",
  avaliacoes: "cf_avaliacoes",
  sessao: "cf_sessao",
  creditos: "cf_creditos",
  seeded: "cf_seeded_v1",
} as const;

function read<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function seedIfNeeded() {
  if (localStorage.getItem(KEYS.seeded)) return;
  write(KEYS.usuarios, MOCK_DONOS);
  write(KEYS.senhas, Object.fromEntries(MOCK_DONOS.map((u) => [u.email, "senha123"])));
  write(KEYS.trailers, MOCK_TRAILERS);
  write(KEYS.cardapio, MOCK_CARDAPIO);
  write(KEYS.selos, MOCK_SELOS);
  write(KEYS.recompensas, MOCK_RECOMPENSAS);
  write(KEYS.notificacoes, MOCK_NOTIFICACOES);
  write(KEYS.avaliacoes, MOCK_AVALIACOES);
  write(
    KEYS.creditos,
    Object.fromEntries(MOCK_TRAILERS.map((t) => [t.id, 10])),
  );
  localStorage.setItem(KEYS.seeded, "1");
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const mockStore = {
  // usuarios / sessão
  getUsuarios: () => read<Usuario[]>(KEYS.usuarios, []),
  getSenhas: () => read<Record<string, string>>(KEYS.senhas, {}),
  saveUsuario(usuario: Usuario, senha?: string) {
    const usuarios = this.getUsuarios();
    const idx = usuarios.findIndex((u) => u.id === usuario.id);
    if (idx >= 0) usuarios[idx] = usuario;
    else usuarios.push(usuario);
    write(KEYS.usuarios, usuarios);
    if (senha) {
      const senhas = this.getSenhas();
      senhas[usuario.email] = senha;
      write(KEYS.senhas, senhas);
    }
  },
  findUsuarioByEmail(email: string) {
    return this.getUsuarios().find((u) => u.email === email) ?? null;
  },
  findUsuarioById(id: string) {
    return this.getUsuarios().find((u) => u.id === id) ?? null;
  },
  setSessao(usuarioId: string | null) {
    if (usuarioId) localStorage.setItem(KEYS.sessao, usuarioId);
    else localStorage.removeItem(KEYS.sessao);
  },
  getSessao() {
    return localStorage.getItem(KEYS.sessao);
  },

  // trailers
  getTrailers: () => read<Trailer[]>(KEYS.trailers, []),
  saveTrailer(trailer: Trailer) {
    const trailers = this.getTrailers();
    const idx = trailers.findIndex((t) => t.id === trailer.id);
    if (idx >= 0) trailers[idx] = trailer;
    else trailers.push(trailer);
    write(KEYS.trailers, trailers);
  },

  // cardápio
  getCardapio: () => read<CardapioItem[]>(KEYS.cardapio, []),
  saveCardapioItem(item: CardapioItem) {
    const itens = this.getCardapio();
    const idx = itens.findIndex((i) => i.id === item.id);
    if (idx >= 0) itens[idx] = item;
    else itens.push(item);
    write(KEYS.cardapio, itens);
  },
  removeCardapioItem(id: string) {
    write(KEYS.cardapio, this.getCardapio().filter((i) => i.id !== id));
  },

  // selos de fidelidade
  getSelos: () => read<SeloFidelidade[]>(KEYS.selos, []),
  saveSelo(selo: SeloFidelidade) {
    const selos = this.getSelos();
    const idx = selos.findIndex((s) => s.id === selo.id);
    if (idx >= 0) selos[idx] = selo;
    else selos.push(selo);
    write(KEYS.selos, selos);
  },

  // recompensas
  getRecompensas: () => read<Recompensa[]>(KEYS.recompensas, []),
  saveRecompensa(recompensa: Recompensa) {
    const recompensas = this.getRecompensas();
    const idx = recompensas.findIndex((r) => r.id === recompensa.id);
    if (idx >= 0) recompensas[idx] = recompensa;
    else recompensas.push(recompensa);
    write(KEYS.recompensas, recompensas);
  },

  // notificações
  getNotificacoes: () => read<NotificacaoPush[]>(KEYS.notificacoes, []),
  saveNotificacao(notificacao: NotificacaoPush) {
    const notificacoes = this.getNotificacoes();
    notificacoes.unshift(notificacao);
    write(KEYS.notificacoes, notificacoes);
  },
  getCreditos: () => read<Record<string, number>>(KEYS.creditos, {}),
  setCreditos(trailerId: string, valor: number) {
    const creditos = this.getCreditos();
    creditos[trailerId] = valor;
    write(KEYS.creditos, creditos);
  },

  // avaliações
  getAvaliacoes: () => read<Avaliacao[]>(KEYS.avaliacoes, []),
  saveAvaliacao(avaliacao: Avaliacao) {
    const avaliacoes = this.getAvaliacoes();
    const idx = avaliacoes.findIndex((a) => a.id === avaliacao.id);
    if (idx >= 0) avaliacoes[idx] = avaliacao;
    else avaliacoes.push(avaliacao);
    write(KEYS.avaliacoes, avaliacoes);
  },

  uid,
};
