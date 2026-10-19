-- ============================================================
-- Controle de CRM — padroniza em MAIÚSCULAS os textos de
-- identificação já gravados. Roda UMA vez no SQL Editor do Supabase.
--
-- Une grafias diferentes da mesma pessoa/termo nos rankings
-- (ex.: "Daiana Bastos" + "DAIANA BASTOS" -> "DAIANA BASTOS").
-- Pix (dados_bancarios) e observações ficam de fora de propósito:
-- uma chave Pix aleatória é sensível a maiúsculas e a observação é
-- texto livre.
-- ============================================================
update public.crm_solicitacoes set
  solicitante     = upper(solicitante),
  beneficiario    = upper(beneficiario),
  procedimento    = upper(procedimento),
  clinica_hospital = upper(clinica_hospital),
  protocolo       = upper(protocolo)
where
  solicitante      is distinct from upper(solicitante)
  or beneficiario    is distinct from upper(beneficiario)
  or procedimento    is distinct from upper(procedimento)
  or clinica_hospital is distinct from upper(clinica_hospital)
  or protocolo       is distinct from upper(protocolo);
