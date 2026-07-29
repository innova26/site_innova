-- ============================================================
-- Credenciados — leads do formulário /seja-um-credenciado
-- Rode este script no SQL Editor do Supabase (uma vez).
-- ============================================================

create table if not exists public.credenciados (
  id uuid primary key default gen_random_uuid(),
  documento text not null,
  nome text not null,
  telefone text not null,
  whatsapp text,
  email text not null,
  endereco text not null,
  numero text not null,
  bairro text not null,
  cidade text not null,
  uf text not null,
  tipo text not null,
  especialidades text not null,
  comentario text,
  portfolio_path text,               -- caminho do PDF no bucket "portfolios"
  created_at timestamptz not null default now()
);

create index if not exists idx_credenciados_created_at
  on public.credenciados (created_at desc);

-- Row Level Security -----------------------------------------
alter table public.credenciados enable row level security;

-- Insert é feito pela Edge Function `enviar-credenciado` (service role,
-- ignora RLS). Sem policy de insert para anon → anti-spam.

drop policy if exists "credenciados leitura autenticada" on public.credenciados;
create policy "credenciados leitura autenticada"
  on public.credenciados for select
  to authenticated
  using (true);

-- ============================================================
-- Storage: bucket privado "portfolios" para os PDFs
-- ============================================================
insert into storage.buckets (id, name, public)
values ('portfolios', 'portfolios', false)
on conflict (id) do nothing;

-- O navegador pode APENAS enviar arquivos para este bucket.
-- Usa `to public` (e não `to anon`): as chaves publishable novas
-- (sb_publishable_...) não casam de forma confiável com policies `to anon`.
drop policy if exists "portfolios upload anon" on storage.objects;
drop policy if exists "portfolios upload publico" on storage.objects;
create policy "portfolios upload publico"
  on storage.objects for insert
  to public
  with check (bucket_id = 'portfolios');

-- Equipe autenticada pode ler/baixar os PDFs pelo painel.
drop policy if exists "portfolios leitura autenticada" on storage.objects;
create policy "portfolios leitura autenticada"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'portfolios');
