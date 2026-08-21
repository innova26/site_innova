-- ============================================================
-- Dashboard de Redes — schema Supabase
-- Rode este script no SQL Editor do Supabase (uma vez), antes do
-- supabase/rede_dashboard_seed.sql.
-- ============================================================

-- mantém updated_at em dia (mesma função usada em schema.sql; recriar
-- aqui com CREATE OR REPLACE é seguro mesmo se ela já existir)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- 1) Tabela de prestadores (rede negociada, por cidade) --------
create table if not exists public.dashboard_redes_prestadores (
  id uuid primary key default gen_random_uuid(),
  cidade text not null,
  nome text not null,
  servico text,
  macro text not null,
  status text not null default 'Pendente',
  sheet text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dashboard_redes_prestadores_cidade
  on public.dashboard_redes_prestadores (cidade);

drop trigger if exists trg_dashboard_redes_prestadores_updated
  on public.dashboard_redes_prestadores;
create trigger trg_dashboard_redes_prestadores_updated
  before update on public.dashboard_redes_prestadores
  for each row execute function public.set_updated_at();

-- 2) Tabela de procedimentos (itens de preço por prestador) ----
create table if not exists public.dashboard_redes_procedimentos (
  id uuid primary key default gen_random_uuid(),
  prestador_id uuid not null
    references public.dashboard_redes_prestadores(id) on delete cascade,
  codigo text,
  descricao text not null,
  valor numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_dashboard_redes_procedimentos_prestador
  on public.dashboard_redes_procedimentos (prestador_id);

drop trigger if exists trg_dashboard_redes_procedimentos_updated
  on public.dashboard_redes_procedimentos;
create trigger trg_dashboard_redes_procedimentos_updated
  before update on public.dashboard_redes_procedimentos
  for each row execute function public.set_updated_at();

-- 3) Row Level Security ------------------------------------------
-- Diferente de `prestadores` (listagem pública do site), aqui é preço
-- negociado e status de contrato: SEM policy nenhuma para `anon`, nem
-- de leitura. Só a equipe logada (authenticated) acessa, para ler e
-- para escrever.
alter table public.dashboard_redes_prestadores enable row level security;
alter table public.dashboard_redes_procedimentos enable row level security;

drop policy if exists "redes prestadores acesso autenticado"
  on public.dashboard_redes_prestadores;
create policy "redes prestadores acesso autenticado"
  on public.dashboard_redes_prestadores for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "redes procedimentos acesso autenticado"
  on public.dashboard_redes_procedimentos;
create policy "redes procedimentos acesso autenticado"
  on public.dashboard_redes_procedimentos for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- Depois de rodar este script:
-- 1) rode supabase/rede_dashboard_seed.sql para popular com os dados
--    dos 4 JSONs (Ariquemes, Boa Vista, Manaus, Porto Velho).
-- 2) a partir daí, cadastre/edite pelo /admin/redes — o seed é só o
--    ponto de partida.
-- ============================================================
