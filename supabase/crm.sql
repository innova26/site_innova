-- ============================================================
-- Controle de CRM — CM e Reembolsos
-- Rode este script no SQL Editor do Supabase (uma vez).
--
-- Fluxo: Atendimento abre → Enfermagem autoriza → Financeiro paga.
-- Cada time só edita a própria etapa (reforçado por trigger + RLS).
-- ============================================================

-- updated_at genérico (idempotente; pode já existir de outro script)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- 1) Perfis -------------------------------------------------
-- Mapeia o usuário autenticado (auth.users) para um papel no CRM.
create table if not exists public.crm_perfis (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  papel text not null check (papel in ('atendimento','enfermagem','financeiro','admin')),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Papel do usuário atual. SECURITY DEFINER para poder ser usado dentro
-- das policies sem recursão de RLS.
create or replace function public.crm_papel()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select papel
  from public.crm_perfis
  where user_id = auth.uid() and ativo
  limit 1
$$;

-- 2) Solicitações -------------------------------------------
create table if not exists public.crm_solicitacoes (
  id uuid primary key default gen_random_uuid(),
  protocolo text unique,

  -- Atendimento
  abertura date not null default current_date,
  termino date,
  solicitante text not null,
  data_consulta date,
  beneficiario text not null,
  procedimento text not null,
  clinica_hospital text,
  valor_solicitado numeric(12,2),
  forma_pagamento text not null default 'Pix',
  dados_bancarios text,

  -- Enfermagem
  autorizacao text not null default 'pendente'
    check (autorizacao in ('pendente','sim','nao')),
  data_autorizacao date,

  -- Financeiro
  data_prevista_pagamento date,
  status_financeiro text
    check (status_financeiro in ('Pendente','Agendado','Pago','Recusado')),
  data_pagamento date,

  -- Comum
  observacoes text,

  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_crm_updated on public.crm_solicitacoes;
create trigger trg_crm_updated
  before update on public.crm_solicitacoes
  for each row execute function public.set_updated_at();

-- 3) Protocolo automático (CRM-AAAA-00001, sequencial por ano) ----
create table if not exists public.crm_protocolo_contador (
  ano int primary key,
  ultimo int not null default 0
);

create or replace function public.crm_gerar_protocolo()
returns trigger language plpgsql as $$
declare
  v_ano int := extract(year from coalesce(new.abertura, current_date));
  v_seq int;
begin
  if new.protocolo is not null then
    return new; -- respeita protocolo informado (ex.: importação)
  end if;

  insert into public.crm_protocolo_contador (ano, ultimo)
  values (v_ano, 1)
  on conflict (ano)
    do update set ultimo = public.crm_protocolo_contador.ultimo + 1
  returning ultimo into v_seq;

  new.protocolo := 'CRM-' || v_ano || '-' || lpad(v_seq::text, 5, '0');
  new.created_by := coalesce(new.created_by, auth.uid());
  return new;
end $$;

drop trigger if exists trg_crm_protocolo on public.crm_solicitacoes;
create trigger trg_crm_protocolo
  before insert on public.crm_solicitacoes
  for each row execute function public.crm_gerar_protocolo();

-- 4) Trava de edição por etapa (cada time só mexe na sua faixa) ---
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
    or new.dados_bancarios  is distinct from old.dados_bancarios;

  mudou_enfermagem :=
       new.autorizacao     is distinct from old.autorizacao
    or new.data_autorizacao is distinct from old.data_autorizacao;

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

drop trigger if exists trg_crm_valida_edicao on public.crm_solicitacoes;
create trigger trg_crm_valida_edicao
  before update on public.crm_solicitacoes
  for each row execute function public.crm_validar_edicao();

-- 5) Row Level Security -------------------------------------
alter table public.crm_perfis enable row level security;
alter table public.crm_solicitacoes enable row level security;

-- perfis: cada um lê o próprio; admin lê todos. Escrita só admin
-- (o primeiro admin é inserido via SQL Editor, abaixo).
drop policy if exists "perfil proprio ou admin" on public.crm_perfis;
create policy "perfil proprio ou admin"
  on public.crm_perfis for select to authenticated
  using (user_id = auth.uid() or public.crm_papel() = 'admin');

drop policy if exists "perfis admin escreve" on public.crm_perfis;
create policy "perfis admin escreve"
  on public.crm_perfis for all to authenticated
  using (public.crm_papel() = 'admin')
  with check (public.crm_papel() = 'admin');

-- solicitações: todo usuário do CRM vê tudo
drop policy if exists "crm leitura" on public.crm_solicitacoes;
create policy "crm leitura"
  on public.crm_solicitacoes for select to authenticated
  using (public.crm_papel() is not null);

-- criar: atendimento e admin
drop policy if exists "crm inserir" on public.crm_solicitacoes;
create policy "crm inserir"
  on public.crm_solicitacoes for insert to authenticated
  with check (public.crm_papel() in ('atendimento','admin'));

-- atualizar: qualquer papel do CRM (a faixa é validada pelo trigger)
drop policy if exists "crm atualizar" on public.crm_solicitacoes;
create policy "crm atualizar"
  on public.crm_solicitacoes for update to authenticated
  using (public.crm_papel() is not null)
  with check (public.crm_papel() is not null);

-- excluir: só admin
drop policy if exists "crm excluir" on public.crm_solicitacoes;
create policy "crm excluir"
  on public.crm_solicitacoes for delete to authenticated
  using (public.crm_papel() = 'admin');

-- ============================================================
-- 6) CADASTRO DE USUÁRIOS (faça para cada pessoa da equipe)
--    1. Crie o usuário em Authentication → Users (e-mail + senha).
--    2. Copie o UUID do usuário e rode um insert como abaixo.
-- ============================================================
-- insert into public.crm_perfis (user_id, nome, papel) values
--   ('00000000-0000-0000-0000-000000000000', 'Fulana',  'atendimento'),
--   ('11111111-1111-1111-1111-111111111111', 'Beltrana','enfermagem'),
--   ('22222222-2222-2222-2222-222222222222', 'Ciclano', 'financeiro'),
--   ('33333333-3333-3333-3333-333333333333', 'Gestor',  'admin');
