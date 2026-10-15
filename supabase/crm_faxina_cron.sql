-- ============================================================
-- Agenda a faxina seletiva dos anexos (Edge Function crm-faxina).
-- Roda toda semana e apaga documentos de solicitações recusadas antigas.
--
-- PRÉ-REQUISITOS (faça antes de rodar este script):
--   1. Defina o secret, escolhendo um valor forte qualquer:
--        supabase secrets set CRM_FAXINA_SECRET="um-segredo-forte-aqui"
--      (opcional) mudar o prazo padrão de 90 dias:
--        supabase secrets set CRM_FAXINA_DIAS="90"
--   2. Faça o deploy da função SEM verificação de JWT (ela é chamada pelo cron):
--        supabase functions deploy crm-faxina --no-verify-jwt
--
-- DEPOIS, troque <CRM_FAXINA_SECRET> abaixo pelo MESMO valor do secret
-- e rode este script no SQL Editor.
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- remove um agendamento anterior com o mesmo nome (idempotente)
select cron.unschedule('crm-faxina-semanal')
where exists (select 1 from cron.job where jobname = 'crm-faxina-semanal');

-- agenda: todo domingo às 03:00
select cron.schedule(
  'crm-faxina-semanal',
  '0 3 * * 0',
  $$
  select net.http_post(
    url := 'https://ltyerpqbpeijxghtnemr.supabase.co/functions/v1/crm-faxina',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-faxina-secret', '<CRM_FAXINA_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Para conferir / remover depois:
--   select jobid, jobname, schedule from cron.job;
--   select cron.unschedule('crm-faxina-semanal');
