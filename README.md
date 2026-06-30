# Câmara Food

Marketplace gastronômico hiperlocal que conecta servidores públicos, terceirizados, estagiários e visitantes da Esplanada dos Ministérios aos food trucks e trailers da região. Cardápio vivo geolocalizado, recomendações personalizadas e fidelidade gamificada (selos a cada compra, recompensas a cada 10 selos).

## Stack

Vite + React + TypeScript + Tailwind CSS + shadcn/ui (componentes próprios) + Supabase (Postgres + Auth).

## Rodando localmente

```bash
npm install
npm run dev
```

A aplicação abre em modo **mock** por padrão: todos os dados (usuários, trailers, cardápio, selos, recompensas, notificações) são persistidos no `localStorage` do navegador e pré-populados com dados de demonstração na primeira visita. Não é necessário configurar Supabase para testar o fluxo completo (cadastro, login, navegação, pedidos, fidelidade, dashboard do empreendedor).

## Conectando a um projeto Supabase real

1. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
2. Aplique as migrations em `supabase/migrations/` no seu projeto (`supabase db push` ou via SQL Editor).
3. Opcionalmente, rode `supabase/seed.sql` em um projeto local (`supabase start`) para dados de exemplo.

Com as variáveis configuradas, todos os serviços em `src/lib/services/` passam a usar o Supabase automaticamente em vez do mock.

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — typecheck + build de produção
- `npm run typecheck` — apenas verificação de tipos
- `npm run lint` — ESLint
- `npm run preview` — preview do build de produção

## Estrutura

- `src/pages/` — páginas roteadas (Home, CardapioVivo, Fidelidade, DashboardEmpreendedor, Perfil, Login, Cadastro)
- `src/components/` — componentes de domínio e layout
- `src/components/ui/` — primitivos de UI (estilo shadcn)
- `src/lib/services/` — camada de dados (Supabase ou mock, conforme configuração)
- `src/lib/mockStore.ts` — backend de demonstração via localStorage
- `supabase/migrations/` — schema relacional (7 tabelas, RLS habilitado)
