-- ============================================================
-- Controle de CRM — adiciona o CPF do paciente à solicitação.
-- Rode no SQL Editor do Supabase (uma vez).
-- ============================================================
alter table public.crm_solicitacoes
  add column if not exists cpf text;
