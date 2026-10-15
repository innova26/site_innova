-- ============================================================
-- Controle de CRM — Anexos
-- Documentos (atendimento) e recibo de pagamento (financeiro).
-- Rode no SQL Editor do Supabase (uma vez), depois de crm.sql.
-- ============================================================

-- 1) Bucket privado --------------------------------------------
insert into storage.buckets (id, name, public)
values ('crm-anexos', 'crm-anexos', false)
on conflict (id) do nothing;

-- 2) Tabela de metadados ---------------------------------------
create table if not exists public.crm_anexos (
  id uuid primary key default gen_random_uuid(),
  solicitacao_id uuid not null
    references public.crm_solicitacoes(id) on delete cascade,
  tipo text not null check (tipo in ('documento','recibo')),
  nome text not null,
  path text not null,
  tamanho bigint,
  mime text,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_anexos_solicitacao
  on public.crm_anexos(solicitacao_id);

alter table public.crm_anexos enable row level security;

-- leitura: qualquer usuário do CRM
drop policy if exists "anexos leitura" on public.crm_anexos;
create policy "anexos leitura" on public.crm_anexos for select to authenticated
  using (public.crm_papel() is not null);

-- inserir: documento (atendimento/admin), recibo (financeiro/admin)
drop policy if exists "anexos inserir" on public.crm_anexos;
create policy "anexos inserir" on public.crm_anexos for insert to authenticated
  with check (
    (tipo = 'documento' and public.crm_papel() in ('atendimento','admin'))
    or (tipo = 'recibo' and public.crm_papel() in ('financeiro','admin'))
  );

-- excluir: admin ou quem enviou
drop policy if exists "anexos excluir" on public.crm_anexos;
create policy "anexos excluir" on public.crm_anexos for delete to authenticated
  using (public.crm_papel() = 'admin' or uploaded_by = auth.uid());

-- 3) Policies de Storage (bucket crm-anexos) -------------------
drop policy if exists "crm-anexos leitura" on storage.objects;
create policy "crm-anexos leitura" on storage.objects for select to authenticated
  using (bucket_id = 'crm-anexos' and public.crm_papel() is not null);

drop policy if exists "crm-anexos upload" on storage.objects;
create policy "crm-anexos upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'crm-anexos'
    and public.crm_papel() in ('atendimento','financeiro','admin')
  );

drop policy if exists "crm-anexos excluir" on storage.objects;
create policy "crm-anexos excluir" on storage.objects for delete to authenticated
  using (
    bucket_id = 'crm-anexos'
    and (public.crm_papel() = 'admin' or owner = auth.uid())
  );
