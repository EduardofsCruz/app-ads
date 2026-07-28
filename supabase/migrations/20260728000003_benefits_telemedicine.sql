-- =============================================================================
-- SDT BSB — Estrutura para Clube de Benefícios e Telemedicina (API de parceiro)
--
-- Nenhuma credencial de parceiro é armazenada no banco: chaves de API devem
-- ficar em secrets de Edge Function (supabase/functions/telemedicine).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Clube de benefícios
-- ---------------------------------------------------------------------------
create type public.benefit_categories as enum
  ('health', 'education', 'food', 'retail', 'services', 'entertainment', 'other');

-- Parceiro/convênio. church_id nulo = benefício global (todas as igrejas).
create table public.benefit_partners (
  id uuid primary key default gen_random_uuid(),
  church_id uuid references public.churches (id) on delete cascade,
  name text not null,
  category public.benefit_categories not null default 'other',
  description text,
  discount_description text, -- ex.: "15% de desconto em consultas"
  logo_url text,
  website_url text,
  phone text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Registro de uso/resgate de benefício pelo membro.
create table public.benefit_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  partner_id uuid not null references public.benefit_partners (id) on delete cascade,
  redeemed_at timestamptz not null default now()
);

create index benefit_partners_church_idx on public.benefit_partners (church_id) where is_active;
create index benefit_redemptions_user_idx on public.benefit_redemptions (user_id);

alter table public.benefit_partners enable row level security;
alter table public.benefit_redemptions enable row level security;

create policy "benefit_partners_select" on public.benefit_partners
  for select using (true);
-- Benefício global (church_id nulo) só por admin_global; benefício de igreja
-- pelo admin da igreja.
create policy "benefit_partners_write" on public.benefit_partners
  for all to authenticated
  using (case when church_id is null then public.is_admin_global() else public.is_church_admin(church_id) end)
  with check (case when church_id is null then public.is_admin_global() else public.is_church_admin(church_id) end);

create policy "benefit_redemptions_select" on public.benefit_redemptions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "benefit_redemptions_insert" on public.benefit_redemptions
  for insert to authenticated
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Telemedicina via API de parceiro
-- ---------------------------------------------------------------------------
create type public.telemedicine_appointment_status as enum
  ('requested', 'scheduled', 'in_progress', 'completed', 'canceled');

-- Provedor de telemedicina integrado (config pública; secrets ficam na Edge
-- Function). "slug" identifica o adaptador de integração no código.
create table public.telemedicine_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique, -- ex.: 'conexa', 'docway'
  api_base_url text,
  description text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- Solicitações/consultas dos membros. external_id vincula ao sistema do
-- parceiro; preenchido pela Edge Function ao criar a consulta na API externa.
create table public.telemedicine_appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider_id uuid not null references public.telemedicine_providers (id),
  status public.telemedicine_appointment_status not null default 'requested',
  specialty text,
  scheduled_at timestamptz,
  external_id text,      -- id da consulta no parceiro
  join_url text,         -- link da sala de vídeo retornado pelo parceiro
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index telemedicine_appointments_user_idx on public.telemedicine_appointments (user_id);

alter table public.telemedicine_providers enable row level security;
alter table public.telemedicine_appointments enable row level security;

create policy "telemedicine_providers_select" on public.telemedicine_providers
  for select using (true);
create policy "telemedicine_providers_write" on public.telemedicine_providers
  for all to authenticated
  using (public.is_admin_global())
  with check (public.is_admin_global());

-- O membro cria a solicitação e acompanha as próprias consultas; campos de
-- integração (status/external_id/join_url) são atualizados pela Edge Function
-- (service_role, ignora RLS) ou por admin_global.
create policy "telemedicine_appointments_select" on public.telemedicine_appointments
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin_global());
create policy "telemedicine_appointments_insert" on public.telemedicine_appointments
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'requested');
create policy "telemedicine_appointments_update_own" on public.telemedicine_appointments
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "telemedicine_appointments_update_admin" on public.telemedicine_appointments
  for update to authenticated
  using (public.is_admin_global())
  with check (public.is_admin_global());
