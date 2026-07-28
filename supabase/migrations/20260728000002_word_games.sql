-- =============================================================================
-- SDT BSB — Jogos gamificados: palavras cruzadas e caça-palavras (tema cristão)
-- Segue o modelo das tabelas de quiz: reutiliza os enums
-- quiz_questions_age_groups (children/adolescent/adult) e
-- quiz_questions_difficulties (easy/medium/hard), coluna is_active e
-- tabela de conclusões por usuário.
-- =============================================================================

create type public.word_game_types as enum ('crossword', 'word_search');

-- Um jogo (puzzle) publicado, filtrável por faixa etária e dificuldade,
-- exatamente como quiz_questions.
create table public.word_games (
  id uuid primary key default gen_random_uuid(),
  game_type public.word_game_types not null,
  title text not null,
  description text,
  age_group public.quiz_questions_age_groups not null,
  difficulty public.quiz_questions_difficulties not null,
  -- Lado da grade sugerido ao app (o layout é gerado no cliente a partir das
  -- palavras, como as opções do quiz são renderizadas a partir de options[]).
  grid_size integer not null default 12 check (grid_size between 6 and 20),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Palavras de cada jogo. Para cruzadas, "clue" é a dica da palavra;
-- para caça-palavras, "clue" é opcional (pode ser exibida como lista).
create table public.word_game_words (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.word_games (id) on delete cascade,
  word text not null check (char_length(word) between 2 and 20),
  clue text,
  word_order integer,
  created_at timestamptz not null default now()
);

create index word_game_words_game_id_idx on public.word_game_words (game_id);
create index word_games_filter_idx on public.word_games (game_type, age_group, difficulty) where is_active;

-- Conclusões por usuário (modelo de quiz_completions, com referência ao jogo).
create table public.word_game_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id uuid not null references public.word_games (id) on delete cascade,
  score integer,
  duration_seconds integer,
  completed_at timestamptz not null default now()
);

create index word_game_completions_user_idx on public.word_game_completions (user_id);

alter table public.word_games enable row level security;
alter table public.word_game_words enable row level security;
alter table public.word_game_completions enable row level security;

-- Conteúdo global (como quiz_questions): leitura pública, escrita por admins.
create policy "word_games_select" on public.word_games
  for select using (true);
create policy "word_games_write" on public.word_games
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "word_game_words_select" on public.word_game_words
  for select using (true);
create policy "word_game_words_write" on public.word_game_words
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "word_game_completions_select" on public.word_game_completions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "word_game_completions_write" on public.word_game_completions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
