-- ============================================================
-- Controle de CRM — Histórico (trilha de auditoria)
-- Registra automaticamente os marcos de cada solicitação, com
-- data/hora do servidor e quem fez. Rode no SQL Editor (uma vez).
-- ============================================================

-- 1) Tabela de histórico ---------------------------------------
create table if not exists public.crm_historico (
  id uuid primary key default gen_random_uuid(),
  solicitacao_id uuid not null
    references public.crm_solicitacoes(id) on delete cascade,
  evento text not null,            -- criada, autorizada, recusada, agendada, paga, anexo
  detalhe text,
  user_id uuid,
  user_nome text,
  created_at timestamptz not null default now()
);
create index if not exists idx_crm_historico_solicitacao
  on public.crm_historico(solicitacao_id, created_at);

-- 2) Gatilho nas solicitações (marcos) -------------------------
create or replace function public.crm_log_solicitacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_nome text := (select nome from public.crm_perfis where user_id = auth.uid());
begin
  if tg_op = 'INSERT' then
    insert into public.crm_historico (solicitacao_id, evento, user_id, user_nome)
    values (new.id, 'criada', v_uid, v_nome);
    return new;
  end if;

  -- autorização
  if new.autorizacao is distinct from old.autorizacao then
    if new.autorizacao = 'sim' then
      insert into public.crm_historico (solicitacao_id, evento, user_id, user_nome)
      values (new.id, 'autorizada', v_uid, v_nome);
    elsif new.autorizacao = 'nao' then
      insert into public.crm_historico (solicitacao_id, evento, user_id, user_nome)
      values (new.id, 'recusada', v_uid, v_nome);
    end if;
  end if;

  -- financeiro
  if new.status_financeiro is distinct from old.status_financeiro then
    if new.status_financeiro = 'Agendado' then
      insert into public.crm_historico (solicitacao_id, evento, detalhe, user_id, user_nome)
      values (new.id, 'agendada',
              'Prev.: ' || coalesce(to_char(new.data_prevista_pagamento, 'DD/MM/YYYY'), '—'),
              v_uid, v_nome);
    elsif new.status_financeiro = 'Pago' then
      insert into public.crm_historico (solicitacao_id, evento, detalhe, user_id, user_nome)
      values (new.id, 'paga',
              'Pago em ' || coalesce(to_char(new.data_pagamento, 'DD/MM/YYYY'), to_char(current_date, 'DD/MM/YYYY')),
              v_uid, v_nome);
    end if;
  end if;

  return new;
end $$;

drop trigger if exists trg_crm_log on public.crm_solicitacoes;
create trigger trg_crm_log
  after insert or update on public.crm_solicitacoes
  for each row execute function public.crm_log_solicitacao();

-- 3) Gatilho nos anexos ---------------------------------------
create or replace function public.crm_log_anexo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.crm_historico (solicitacao_id, evento, detalhe, user_id, user_nome)
  values (
    new.solicitacao_id,
    'anexo',
    initcap(new.tipo) || ': ' || new.nome,
    auth.uid(),
    (select nome from public.crm_perfis where user_id = auth.uid())
  );
  return new;
end $$;

drop trigger if exists trg_crm_log_anexo on public.crm_anexos;
create trigger trg_crm_log_anexo
  after insert on public.crm_anexos
  for each row execute function public.crm_log_anexo();

-- 4) RLS: usuários do CRM leem; ninguém escreve direto ---------
alter table public.crm_historico enable row level security;

drop policy if exists "historico leitura" on public.crm_historico;
create policy "historico leitura" on public.crm_historico for select to authenticated
  using (public.crm_papel() is not null);
-- (sem políticas de insert/update/delete: só os gatilhos escrevem)
