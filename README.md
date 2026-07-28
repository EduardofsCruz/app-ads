# SDT BSB — App da Igreja (multi-igrejas)

Este repositório reúne o **painel administrativo web**, as **migrações do banco
Supabase** e os **scaffolds de Edge Functions** do app SDT BSB.

- **Supabase produção**: `sdt-bsb-production` (`rnjcvbgnvuwagudkftyq`) — usado pelo app publicado.
- **Supabase staging**: `sdt-bsb-staging` (`fzopepqwrqoeoenffrll`) — apenas testes.
- `app-ads.txt` — arquivo do AdMob (já publicado).

Todas as migrações em `supabase/migrations/` **já foram aplicadas** em staging e
produção (staging primeiro, com testes de RLS por papel antes de promover).

---

## 1. Painel administrativo (`admin/`)

SPA em React + Vite + TypeScript usando o mesmo Supabase do app (a segurança é
garantida pelas políticas RLS, não pelo front).

```bash
cd admin
npm install
npm run dev      # desenvolvimento (aponta para produção por padrão)
npm run build    # build de produção em admin/dist
```

Para apontar para o staging, copie `.env.example` para `.env` e troque URL/chave.

Funcionalidades:

- Login por e-mail/senha (Supabase Auth) com bloqueio para quem não é
  `admin_local`/`admin_global`.
- **Multi-igrejas**: `admin_global` escolhe a igreja no seletor do topo (ou vê
  todas); `admin_local` fica travado na própria igreja — o banco também impõe
  isso via RLS.
- CRUD de: igrejas, horários de culto, devocionais, eventos, avisos,
  transmissões, dicas cristãs, cursos + aulas, quiz, jogos de palavras +
  palavras, parceiros do clube de benefícios e provedores de telemedicina.
- Moderação de testemunhos e pedidos de oração (ocultar/exibir no app).
- Gestão de usuários: papel (`user`/`admin_local`/`admin_global`), igreja e
  ativação.

Deploy sugerido: qualquer host estático (Vercel/Netlify/Cloudflare Pages) com
`npm run build` e diretório `admin/dist`.

**Primeiro acesso**: a conta `eduardofscruz@gmail.com` foi promovida a
`admin_global` em produção (era necessário ao menos um admin para usar o
painel). Use a senha do app; os demais admins podem ser promovidos pela tela
Usuários.

## 2. Segurança / RLS (o que mudou em produção)

Antes, **as 16 tabelas** tinham uma única política `liberal_access` com
`USING (true) WITH CHECK (true)` — qualquer pessoa com a anon key (pública por
natureza) podia ler e **escrever tudo**, inclusive se promover a admin.

Como o app escreve (verificado antes da mudança — o código mobile fica em
`easyway-tecnologia/sdt-bsb-mobile`, fora do escopo desta sessão, então a
verificação foi feita pela evidência do banco):

- O app autentica via Supabase Auth (69 usuários; o trigger `handle_new_user`
  cria o profile no cadastro; a RPC `delete_user` usa `auth.uid()`).
- As tabelas escritas pelo usuário (`prayer_requests`, `testimonials`,
  `course_progress`, `course_completions`, `quiz_completions`, o próprio
  `profiles`) têm `user_id`/`id` = `auth.uid()`.
- Tabelas de conteúdo são somente leitura para o app.

Novas regras (migração `20260728000001`):

| Tabela | Leitura | Escrita |
| --- | --- | --- |
| churches, service_times, devotionals, events, notifications, live_streams, christian_tips, courses, course_lessons | pública (anon+auth) | admin da igreja (`admin_local` da própria / `admin_global`) |
| quiz_questions, word_games, word_game_words | pública | qualquer admin |
| testimonials | pública | autor + admin da igreja (moderação) |
| prayer_requests | autenticado: próprios + não-privados; privados só autor/admin | autor + admin da igreja |
| profiles | próprio, mesma igreja, admin | próprio (sem trocar o **próprio papel**), admins por escopo (admin_local não promove a admin_global) |
| *_completions / course_progress | próprio + admin (relatórios) | apenas o próprio usuário |

Testes executados no staging antes de promover (todos passaram): leitura anônima
de conteúdo; bloqueio de escrita anônima; escritas próprias do app; bloqueio de
auto-promoção de papel; bloqueio de spoofing de `user_id`; escopo de igreja do
`admin_local`.

Correções extras:

- **Exclusão de conta estava quebrada** (`20260728000006`): a RPC
  `delete_user()` falhava com violação de FK porque `profiles` e as tabelas de
  dados do usuário não tinham `ON DELETE CASCADE`. Corrigido — requisito de
  App Store/Play para apps com cadastro.
- **Hardening de funções** (`20260728000007`): trigger `handle_new_user` não é
  mais exposto via `/rest/v1/rpc`; helpers de RLS revogados do `anon`;
  `delete_user` com `search_path` fixo.

Pendências apontadas pelo security advisor (exigem ação no dashboard do
Supabase, sem impacto no app):

- Ativar *Leaked Password Protection* (Auth → Passwords).
- Agendar upgrade de patch do Postgres (Settings → Infrastructure).

## 3. Jogos gamificados (Prioridade 2)

Novas tabelas (migração `20260728000002`), seguindo o modelo do quiz (mesmos
enums de faixa etária `children/adolescent/adult` e dificuldade
`easy/medium/hard`):

- `word_games` — jogo de **palavras cruzadas** (`crossword`) ou
  **caça-palavras** (`word_search`), com `grid_size` sugerido para o app.
- `word_game_words` — palavras do jogo (maiúsculas, sem acento, prontas para a
  grade) e dica (`clue`, usada nas cruzadas).
- `word_game_completions` — conclusões por usuário (com `score` e
  `duration_seconds`), como `quiz_completions`.

Seed aplicado (`20260728000004`): **18 jogos** (9 cruzadas + 9 caça-palavras,
todas as combinações de faixa × dificuldade) com 168 palavras de tema cristão
em pt-BR. O layout da grade é gerado no cliente (app) a partir das palavras,
como as opções do quiz são renderizadas a partir de `options[]`.

## 4. Clube de benefícios e telemedicina (Prioridade 3)

Migrações `20260728000003` e `20260728000005`:

- `benefit_partners` — parceiros/convênios exibidos no app (por igreja ou
  globais), gerenciados pelo painel.
- `benefit_redemptions` — registro de uso de benefício pelo membro.
- `benefit_memberships` — adesão ao **Clube Certo** por CPF
  (status `pending → active/failed/removed`).
- `telemedicine_providers` / `telemedicine_appointments` — provedores e
  consultas (o membro cria com status `requested`; a integração atualiza).

Edge Functions (scaffolds em `supabase/functions/`, **ainda não deployadas**):

- `clube-certo` — ações `join`/`remove`/`status` contra a API do parceiro
  (https://integrations.clubecerto.com.br/docs/). Os paths exatos dos
  endpoints estão marcados com `TODO`: o acesso à documentação foi bloqueado
  pela política de rede do ambiente desta sessão — confirme os paths e faça
  `supabase functions deploy clube-certo` com os secrets
  `CLUBE_CERTO_BASE_URL`, `CLUBE_CERTO_API_TOKEN` e
  `CLUBE_CERTO_COMPANY_CODE`.
- `telemedicine` — padrão adapter por `slug` de provedor; implemente o adapter
  quando o contrato com o parceiro (Conexa, Docway etc.) for fechado. Secrets
  por parceiro (ex.: `TELE_CONEXA_API_KEY`).

Credenciais de parceiros ficam **somente** em secrets de Edge Function, nunca
no banco.
