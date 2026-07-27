-- ============================================================
-- Rede de Atendimento — schema Supabase
-- Rode este script no SQL Editor do Supabase (uma vez).
-- ============================================================

-- 1) Tabela de prestadores -----------------------------------
create table if not exists public.prestadores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  instituicao text,
  logo_url text,
  tipo text not null check (
    tipo in ('Hospital','Clínica','Laboratório','Consultório','Pronto atendimento')
  ),
  especialidades text[] not null default '{}',
  redes text[] not null default '{}',
  uf text not null,
  municipio text not null,
  endereco text,
  telefones text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- mantém updated_at em dia
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_prestadores_updated on public.prestadores;
create trigger trg_prestadores_updated
  before update on public.prestadores
  for each row execute function public.set_updated_at();

-- 2) Row Level Security --------------------------------------
alter table public.prestadores enable row level security;

-- leitura liberada para todos (site público)
drop policy if exists "leitura publica" on public.prestadores;
create policy "leitura publica"
  on public.prestadores for select
  using (true);

-- escrita apenas para usuários autenticados (equipe Innova)
drop policy if exists "escrita autenticada" on public.prestadores;
create policy "escrita autenticada"
  on public.prestadores for all
  to authenticated
  using (true)
  with check (true);

-- 3) Storage de logos ----------------------------------------
-- cria o bucket público "logos" (imagens das instituições)
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- qualquer um vê as imagens (bucket público)
drop policy if exists "logos leitura publica" on storage.objects;
create policy "logos leitura publica"
  on storage.objects for select
  using (bucket_id = 'logos');

-- só autenticado sobe/atualiza/remove imagem
drop policy if exists "logos escrita autenticada" on storage.objects;
create policy "logos escrita autenticada"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'logos')
  with check (bucket_id = 'logos');

-- ============================================================
-- Depois de rodar: Authentication > Users > Add user
-- para criar o login da equipe (e-mail + senha).
-- ============================================================
