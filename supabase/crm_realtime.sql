-- ============================================================
-- Controle de CRM — Tempo real
-- Liga o Supabase Realtime na tabela de solicitações, para que a lista
-- de todos os usuários atualize sozinha quando alguém cria/altera algo.
-- Rode no SQL Editor do Supabase (uma vez).
-- ============================================================

-- adiciona a tabela à publicação de realtime (idempotente)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'crm_solicitacoes'
  ) then
    alter publication supabase_realtime add table public.crm_solicitacoes;
  end if;
end $$;

-- Observação: todos os usuários do CRM podem ver todas as solicitações
-- (política de leitura liberada), então todos recebem todas as mudanças.
