-- ============================================================
-- Corretoras — leads do formulário /corretoras
-- Rode este script no SQL Editor do Supabase (uma vez).
-- ============================================================

create table if not exists public.corretoras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  documento text not null,
  susep text not null,
  cnh text,
  inscricao text,
  endereco text not null,
  telefone text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_corretoras_created_at
  on public.corretoras (created_at desc);

-- Row Level Security -----------------------------------------
alter table public.corretoras enable row level security;

-- Insert é feito pela Edge Function `enviar-corretora` (service role,
-- ignora RLS). Sem policy de insert para anon → anti-spam.

drop policy if exists "corretoras leitura autenticada" on public.corretoras;
create policy "corretoras leitura autenticada"
  on public.corretoras for select
  to authenticated
  using (true);
