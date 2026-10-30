-- ============================================================
-- Controle de CRM — motivo da recusa (obrigatório na recusa).
-- Rode UMA vez no SQL Editor do Supabase.
--
-- Quando a enfermagem recusa uma solicitação, passa a registrar o
-- motivo. O campo ajuda o atendimento a entender por que foi negado.
-- ============================================================

alter table public.crm_solicitacoes
  add column if not exists motivo_recusa text;

-- Trigger: inclui `tipo` (atendimento) e `motivo_recusa` (enfermagem)
-- nas respectivas travas de edição por papel.
create or replace function public.crm_validar_edicao()
returns trigger language plpgsql as $$
declare
  p text := public.crm_papel();
  mudou_atendimento boolean;
  mudou_enfermagem boolean;
  mudou_financeiro boolean;
begin
  if p = 'admin' then
    return new; -- admin edita tudo
  end if;

  mudou_atendimento :=
       new.abertura         is distinct from old.abertura
    or new.termino          is distinct from old.termino
    or new.solicitante      is distinct from old.solicitante
    or new.data_consulta    is distinct from old.data_consulta
    or new.beneficiario     is distinct from old.beneficiario
    or new.procedimento     is distinct from old.procedimento
    or new.clinica_hospital is distinct from old.clinica_hospital
    or new.valor_solicitado is distinct from old.valor_solicitado
    or new.forma_pagamento  is distinct from old.forma_pagamento
    or new.dados_bancarios  is distinct from old.dados_bancarios
    or new.tipo             is distinct from old.tipo;

  mudou_enfermagem :=
       new.autorizacao      is distinct from old.autorizacao
    or new.data_autorizacao is distinct from old.data_autorizacao
    or new.motivo_recusa    is distinct from old.motivo_recusa;

  mudou_financeiro :=
       new.data_prevista_pagamento is distinct from old.data_prevista_pagamento
    or new.status_financeiro       is distinct from old.status_financeiro
    or new.data_pagamento          is distinct from old.data_pagamento;

  if mudou_atendimento and p <> 'atendimento' then
    raise exception 'Somente o atendimento pode alterar os dados de abertura.';
  end if;
  if mudou_enfermagem and p <> 'enfermagem' then
    raise exception 'Somente a enfermagem pode alterar a autorização.';
  end if;
  if mudou_financeiro and p <> 'financeiro' then
    raise exception 'Somente o financeiro pode alterar o pagamento.';
  end if;

  return new;
end $$;
