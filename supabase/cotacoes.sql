-- ============================================================
-- Cotações — leads do formulário da página /cotacao
-- Rode este script no SQL Editor do Supabase (uma vez).
-- ============================================================

create table if not exists public.cotacoes (
  id uuid primary key default gen_random_uuid(),
  plano text not null,
  pessoas integer not null check (pessoas >= 1),
  nome text not null,
  email text not null,
  telefone text not null,
  origem text,                       -- opcional: campanha/página de origem
  created_at timestamptz not null default now()
);

-- índice para listar os leads mais recentes primeiro
create index if not exists idx_cotacoes_created_at
  on public.cotacoes (created_at desc);

-- Row Level Security -----------------------------------------
alter table public.cotacoes enable row level security;

-- A inserção NÃO é feita pelo navegador: quem grava é a Edge Function
-- `enviar-cotacao`, que usa a service role key e ignora o RLS.
-- Por isso não há policy de INSERT para anon — evita spam direto na tabela.

-- Equipe autenticada (painel Innova) pode ler os leads.
drop policy if exists "cotacoes leitura autenticada" on public.cotacoes;
create policy "cotacoes leitura autenticada"
  on public.cotacoes for select
  to authenticated
  using (true);
