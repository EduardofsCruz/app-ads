-- Câmara Food — schema inicial

create extension if not exists "pgcrypto";

create type tipo_usuario as enum ('consumidor', 'empreendedor');
create type categoria_comida as enum ('executivo', 'natural', 'regional', 'fast_food', 'sobremesas', 'bebidas');
create type tipo_recompensa as enum ('desconto', 'brinde');

create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  tipo tipo_usuario not null default 'consumidor',
  preferencias_alimentares categoria_comida[] not null default '{}',
  foto text,
  created_at timestamptz not null default now()
);

create table trailers (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  foto text,
  descricao text not null default '',
  categoria categoria_comida not null,
  latitude double precision not null,
  longitude double precision not null,
  horario_funcionamento text not null default '',
  formas_pagamento text[] not null default '{}',
  dono_id uuid not null references usuarios(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table cardapio_itens (
  id uuid primary key default gen_random_uuid(),
  trailer_id uuid not null references trailers(id) on delete cascade,
  nome text not null,
  foto text,
  descricao text not null default '',
  preco numeric(10, 2) not null check (preco >= 0),
  categoria categoria_comida not null,
  disponivel boolean not null default true,
  created_at timestamptz not null default now()
);

create table selos_fidelidade (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  trailer_id uuid not null references trailers(id) on delete cascade,
  quantidade integer not null default 0,
  ultima_compra timestamptz,
  unique (usuario_id, trailer_id)
);

create table recompensas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text not null default '',
  selos_necessarios integer not null check (selos_necessarios > 0),
  tipo tipo_recompensa not null,
  valor text not null,
  trailer_id uuid not null references trailers(id) on delete cascade
);

create table notificacoes_push (
  id uuid primary key default gen_random_uuid(),
  trailer_id uuid not null references trailers(id) on delete cascade,
  titulo text not null,
  mensagem text not null,
  segmentacao_horario text,
  segmentacao_localizacao text,
  segmentacao_preferencia categoria_comida,
  creditos_gastos integer not null default 1,
  created_at timestamptz not null default now()
);

create table avaliacoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  trailer_id uuid not null references trailers(id) on delete cascade,
  nota integer not null check (nota between 1 and 5),
  comentario text not null default '',
  created_at timestamptz not null default now(),
  unique (usuario_id, trailer_id)
);

create index trailers_categoria_idx on trailers (categoria);
create index cardapio_itens_trailer_idx on cardapio_itens (trailer_id);
create index selos_usuario_idx on selos_fidelidade (usuario_id);
create index avaliacoes_trailer_idx on avaliacoes (trailer_id);

-- Row Level Security

alter table usuarios enable row level security;
alter table trailers enable row level security;
alter table cardapio_itens enable row level security;
alter table selos_fidelidade enable row level security;
alter table recompensas enable row level security;
alter table notificacoes_push enable row level security;
alter table avaliacoes enable row level security;

create policy "usuarios_select_own" on usuarios for select using (auth.uid() = id);
create policy "usuarios_update_own" on usuarios for update using (auth.uid() = id);
create policy "usuarios_insert_own" on usuarios for insert with check (auth.uid() = id);

create policy "trailers_select_all" on trailers for select using (true);
create policy "trailers_manage_own" on trailers for all using (auth.uid() = dono_id) with check (auth.uid() = dono_id);

create policy "cardapio_select_all" on cardapio_itens for select using (true);
create policy "cardapio_manage_own" on cardapio_itens for all using (
  exists (select 1 from trailers t where t.id = trailer_id and t.dono_id = auth.uid())
) with check (
  exists (select 1 from trailers t where t.id = trailer_id and t.dono_id = auth.uid())
);

create policy "selos_select_own" on selos_fidelidade for select using (auth.uid() = usuario_id);
create policy "selos_manage_own" on selos_fidelidade for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

create policy "recompensas_select_all" on recompensas for select using (true);
create policy "recompensas_manage_own" on recompensas for all using (
  exists (select 1 from trailers t where t.id = trailer_id and t.dono_id = auth.uid())
) with check (
  exists (select 1 from trailers t where t.id = trailer_id and t.dono_id = auth.uid())
);

create policy "notificacoes_select_own" on notificacoes_push for select using (
  exists (select 1 from trailers t where t.id = trailer_id and t.dono_id = auth.uid())
);
create policy "notificacoes_insert_own" on notificacoes_push for insert with check (
  exists (select 1 from trailers t where t.id = trailer_id and t.dono_id = auth.uid())
);

create policy "avaliacoes_select_all" on avaliacoes for select using (true);
create policy "avaliacoes_insert_own" on avaliacoes for insert with check (auth.uid() = usuario_id);
create policy "avaliacoes_update_own" on avaliacoes for update using (auth.uid() = usuario_id);
