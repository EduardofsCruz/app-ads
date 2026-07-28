-- =============================================================================
-- SDT BSB — Substitui a política "liberal_access" (USING true / WITH CHECK true)
-- por políticas granulares baseadas nos papéis user / admin_local / admin_global.
--
-- Compatibilidade com o app mobile (verificada antes de escrever estas políticas):
--   * O app autentica via Supabase Auth (trigger handle_new_user cria o profile;
--     RPC delete_user usa auth.uid()). Todas as escritas do app acontecem como
--     papel "authenticated".
--   * Tabelas escritas pelo usuário do app: prayer_requests, testimonials,
--     course_progress, course_completions, quiz_completions e o próprio profile
--     (full_name / church_id). Todas têm user_id/id = auth.uid() — as políticas
--     abaixo preservam essas escritas.
--   * Tabelas de conteúdo (churches, devotionals, events, etc.) são somente
--     leitura para o app; a leitura permanece aberta (anon + authenticated)
--     para não quebrar telas acessíveis antes do login.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Funções auxiliares (SECURITY DEFINER para evitar recursão de RLS em profiles)
-- -----------------------------------------------------------------------------
create or replace function public.get_user_role()
returns text
language sql stable security definer
set search_path = ''
as $$
  select role::text from public.profiles where id = auth.uid();
$$;

create or replace function public.get_user_church_id()
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select church_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and is_active
      and role in ('admin_local', 'admin_global')
  );
$$;

create or replace function public.is_admin_global()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and is_active
      and role = 'admin_global'
  );
$$;

-- admin_global administra qualquer igreja; admin_local apenas a própria.
create or replace function public.is_church_admin(target_church uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.is_active
      and (
        p.role = 'admin_global'
        or (p.role = 'admin_local' and p.church_id is not distinct from target_church)
      )
  );
$$;

grant execute on function public.get_user_role() to anon, authenticated;
grant execute on function public.get_user_church_id() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_admin_global() to anon, authenticated;
grant execute on function public.is_church_admin(uuid) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Remove a política liberal de todas as tabelas
-- -----------------------------------------------------------------------------
drop policy if exists "liberal_access" on public.christian_tips;
drop policy if exists "liberal_access" on public.church_service_times;
drop policy if exists "liberal_access" on public.churches;
drop policy if exists "liberal_access" on public.course_completions;
drop policy if exists "liberal_access" on public.course_lessons;
drop policy if exists "liberal_access" on public.course_progress;
drop policy if exists "liberal_access" on public.courses;
drop policy if exists "liberal_access" on public.devotionals;
drop policy if exists "liberal_access" on public.events;
drop policy if exists "liberal_access" on public.live_streams;
drop policy if exists "liberal_access" on public.notifications;
drop policy if exists "liberal_access" on public.prayer_requests;
drop policy if exists "liberal_access" on public.profiles;
drop policy if exists "liberal_access" on public.quiz_completions;
drop policy if exists "liberal_access" on public.quiz_questions;
drop policy if exists "liberal_access" on public.testimonials;

-- -----------------------------------------------------------------------------
-- churches — leitura pública (necessária na seleção de igreja no cadastro);
-- escrita: admin_global cria/remove; admin_local pode editar a própria igreja.
-- -----------------------------------------------------------------------------
create policy "churches_select" on public.churches
  for select using (true);
create policy "churches_insert" on public.churches
  for insert to authenticated with check (public.is_admin_global());
create policy "churches_update" on public.churches
  for update to authenticated
  using (public.is_church_admin(id))
  with check (public.is_church_admin(id));
create policy "churches_delete" on public.churches
  for delete to authenticated using (public.is_admin_global());

-- -----------------------------------------------------------------------------
-- Tabelas de conteúdo com church_id — leitura pública, escrita por admin da igreja
-- -----------------------------------------------------------------------------
-- church_service_times
create policy "service_times_select" on public.church_service_times
  for select using (true);
create policy "service_times_write" on public.church_service_times
  for all to authenticated
  using (public.is_church_admin(church_id))
  with check (public.is_church_admin(church_id));

-- devotionals
create policy "devotionals_select" on public.devotionals
  for select using (true);
create policy "devotionals_write" on public.devotionals
  for all to authenticated
  using (public.is_church_admin(church_id))
  with check (public.is_church_admin(church_id));

-- events
create policy "events_select" on public.events
  for select using (true);
create policy "events_write" on public.events
  for all to authenticated
  using (public.is_church_admin(church_id))
  with check (public.is_church_admin(church_id));

-- notifications
create policy "notifications_select" on public.notifications
  for select using (true);
create policy "notifications_write" on public.notifications
  for all to authenticated
  using (public.is_church_admin(church_id))
  with check (public.is_church_admin(church_id));

-- live_streams
create policy "live_streams_select" on public.live_streams
  for select using (true);
create policy "live_streams_write" on public.live_streams
  for all to authenticated
  using (public.is_church_admin(church_id))
  with check (public.is_church_admin(church_id));

-- christian_tips
create policy "christian_tips_select" on public.christian_tips
  for select using (true);
create policy "christian_tips_write" on public.christian_tips
  for all to authenticated
  using (public.is_church_admin(church_id))
  with check (public.is_church_admin(church_id));

-- courses
create policy "courses_select" on public.courses
  for select using (true);
create policy "courses_write" on public.courses
  for all to authenticated
  using (public.is_church_admin(church_id))
  with check (public.is_church_admin(church_id));

-- course_lessons (escopo de igreja herdado do curso pai)
create policy "course_lessons_select" on public.course_lessons
  for select using (true);
create policy "course_lessons_write" on public.course_lessons
  for all to authenticated
  using (public.is_church_admin((select c.church_id from public.courses c where c.id = course_id)))
  with check (public.is_church_admin((select c.church_id from public.courses c where c.id = course_id)));

-- quiz_questions (conteúdo global, sem church_id) — escrita por qualquer admin
create policy "quiz_questions_select" on public.quiz_questions
  for select using (true);
create policy "quiz_questions_write" on public.quiz_questions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- profiles — o usuário vê o próprio perfil e os da própria igreja (nomes em
-- murais); atualiza o próprio perfil sem poder trocar o próprio papel.
-- Admins gerenciam conforme o escopo.
-- -----------------------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_admin_global()
    or (church_id is not null and church_id = public.get_user_church_id())
  );
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role::text = public.get_user_role());
create policy "profiles_update_admin_global" on public.profiles
  for update to authenticated
  using (public.is_admin_global())
  with check (public.is_admin_global());
create policy "profiles_update_admin_local" on public.profiles
  for update to authenticated
  using (
    public.get_user_role() = 'admin_local'
    and church_id = public.get_user_church_id()
  )
  with check (
    public.get_user_role() = 'admin_local'
    and church_id = public.get_user_church_id()
    and role <> 'admin_global'
  );
create policy "profiles_delete_admin_global" on public.profiles
  for delete to authenticated using (public.is_admin_global());

-- -----------------------------------------------------------------------------
-- prayer_requests — o autor gerencia os próprios pedidos; pedidos privados são
-- visíveis apenas ao autor e aos admins da igreja; mural (não-privados) visível
-- a usuários autenticados.
-- -----------------------------------------------------------------------------
create policy "prayer_requests_select" on public.prayer_requests
  for select to authenticated
  using (
    user_id = auth.uid()
    or is_private = false
    or public.is_church_admin(church_id)
  );
create policy "prayer_requests_insert_own" on public.prayer_requests
  for insert to authenticated with check (user_id = auth.uid());
create policy "prayer_requests_update" on public.prayer_requests
  for update to authenticated
  using (user_id = auth.uid() or public.is_church_admin(church_id))
  with check (user_id = auth.uid() or public.is_church_admin(church_id));
create policy "prayer_requests_delete" on public.prayer_requests
  for delete to authenticated
  using (user_id = auth.uid() or public.is_church_admin(church_id));

-- -----------------------------------------------------------------------------
-- testimonials — leitura pública (mural de testemunhos); autor gerencia os
-- próprios; admins moderam no escopo da igreja.
-- -----------------------------------------------------------------------------
create policy "testimonials_select" on public.testimonials
  for select using (true);
create policy "testimonials_insert_own" on public.testimonials
  for insert to authenticated with check (user_id = auth.uid());
create policy "testimonials_update" on public.testimonials
  for update to authenticated
  using (user_id = auth.uid() or public.is_church_admin(church_id))
  with check (user_id = auth.uid() or public.is_church_admin(church_id));
create policy "testimonials_delete" on public.testimonials
  for delete to authenticated
  using (user_id = auth.uid() or public.is_church_admin(church_id));

-- -----------------------------------------------------------------------------
-- Progresso do usuário (cursos e quiz) — cada usuário gerencia o próprio;
-- admins têm leitura para relatórios.
-- -----------------------------------------------------------------------------
-- course_progress
create policy "course_progress_select" on public.course_progress
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "course_progress_write" on public.course_progress
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- course_completions
create policy "course_completions_select" on public.course_completions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "course_completions_write" on public.course_completions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- quiz_completions
create policy "quiz_completions_select" on public.quiz_completions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "quiz_completions_write" on public.quiz_completions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
