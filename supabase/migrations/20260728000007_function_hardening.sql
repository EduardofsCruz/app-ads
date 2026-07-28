-- =============================================================================
-- SDT BSB — Endurecimento de funções (itens apontados pelo security advisor)
--  * handle_new_user é um trigger; não deve ser chamável via /rest/v1/rpc.
--  * As funções auxiliares de RLS só são usadas em políticas "to authenticated";
--    o papel anon não precisa executá-las.
--  * delete_user ganha search_path fixo (evita hijack de search_path).
-- =============================================================================

revoke execute on function public.handle_new_user() from public, anon, authenticated;

revoke execute on function public.get_user_role() from anon;
revoke execute on function public.get_user_church_id() from anon;
revoke execute on function public.is_admin() from anon;
revoke execute on function public.is_admin_global() from anon;
revoke execute on function public.is_church_admin(uuid) from anon;

alter function public.delete_user() set search_path = '';
revoke execute on function public.delete_user() from public, anon;
