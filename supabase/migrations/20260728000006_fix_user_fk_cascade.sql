-- =============================================================================
-- SDT BSB — Correção: exclusão de conta (RPC delete_user) quebrada
--
-- A RPC public.delete_user() executa `delete from auth.users where id =
-- auth.uid()`, mas as tabelas de dados do usuário referenciavam auth.users
-- SEM on delete cascade — a exclusão falhava com violação de FK para qualquer
-- usuário com profile/dados. Requisito de lojas (App Store/Play) para apps
-- com cadastro. Este script alinha todas as FKs para cascade.
-- =============================================================================

alter table public.profiles drop constraint profiles_id_fkey;
alter table public.profiles add constraint profiles_id_fkey
  foreign key (id) references auth.users (id) on delete cascade;

alter table public.course_completions drop constraint course_completions_user_id_fkey;
alter table public.course_completions add constraint course_completions_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.course_progress drop constraint course_progress_user_id_fkey;
alter table public.course_progress add constraint course_progress_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.prayer_requests drop constraint prayer_requests_user_id_fkey;
alter table public.prayer_requests add constraint prayer_requests_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.quiz_completions drop constraint quiz_completions_user_id_fkey;
alter table public.quiz_completions add constraint quiz_completions_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.testimonials drop constraint testimonials_user_id_fkey;
alter table public.testimonials add constraint testimonials_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;
