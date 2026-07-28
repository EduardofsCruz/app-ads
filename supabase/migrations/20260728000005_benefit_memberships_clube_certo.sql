-- =============================================================================
-- SDT BSB — Adesão ao clube de benefícios via parceiro Clube Certo
-- (https://integrations.clubecerto.com.br/docs/)
--
-- O Clube Certo trabalha com sincronização de beneficiários por CPF: a igreja
-- cadastra o membro na base do parceiro e ele passa a acessar os descontos.
-- Esta tabela guarda o vínculo e o estado da sincronização; a chamada à API
-- do parceiro é feita pela Edge Function supabase/functions/clube-certo
-- (token e código da empresa ficam em secrets, nunca no banco).
-- =============================================================================

create type public.benefit_membership_status as enum
  ('pending', 'active', 'failed', 'removed');

create table public.benefit_memberships (
  user_id uuid primary key references auth.users (id) on delete cascade,
  cpf text not null check (cpf ~ '^[0-9]{11}$'),
  status public.benefit_membership_status not null default 'pending',
  external_id text,          -- identificador do beneficiário no Clube Certo
  error_message text,        -- último erro de sincronização, se houver
  requested_at timestamptz not null default now(),
  synced_at timestamptz
);

create unique index benefit_memberships_cpf_idx on public.benefit_memberships (cpf);

alter table public.benefit_memberships enable row level security;

-- O membro solicita a própria adesão (status inicial 'pending'); a Edge
-- Function (service_role) confirma/atualiza; admins consultam e gerenciam.
create policy "benefit_memberships_select" on public.benefit_memberships
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "benefit_memberships_insert_own" on public.benefit_memberships
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');
create policy "benefit_memberships_admin_write" on public.benefit_memberships
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
create policy "benefit_memberships_delete" on public.benefit_memberships
  for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());
