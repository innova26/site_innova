-- ============================================================
-- Controle de CRM — corrige o "Database error deleting user".
-- Rode UMA vez no SQL Editor do Supabase.
--
-- Causa: crm_solicitacoes.created_by e crm_anexos.uploaded_by
-- referenciam auth.users SEM regra de exclusão. Se o usuário abriu
-- alguma solicitação ou anexou algum arquivo, o Postgres bloqueia a
-- remoção e o Supabase devolve "Database error deleting user".
--
-- Solução: ON DELETE SET NULL — ao remover o usuário, a solicitação
-- e o anexo permanecem (viram sem autor), e o delete passa a funcionar.
-- O crm_perfis.user_id já é ON DELETE CASCADE (o perfil cai sozinho).
-- ============================================================

alter table public.crm_solicitacoes
  drop constraint if exists crm_solicitacoes_created_by_fkey;
alter table public.crm_solicitacoes
  add constraint crm_solicitacoes_created_by_fkey
    foreign key (created_by) references auth.users(id) on delete set null;

alter table public.crm_anexos
  drop constraint if exists crm_anexos_uploaded_by_fkey;
alter table public.crm_anexos
  add constraint crm_anexos_uploaded_by_fkey
    foreign key (uploaded_by) references auth.users(id) on delete set null;
