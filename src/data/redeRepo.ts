/**
 * Acesso aos prestadores. Fala com o Supabase quando ele está configurado;
 * caso contrário devolve os dados estáticos (`PRESTADORES`) como fallback,
 * para o site continuar funcionando antes do backend existir.
 */
import { supabase, supabaseConfigurado } from '../lib/supabase'
import { PRESTADORES, type Prestador } from './rede'

/** Linha da tabela `prestadores` no banco. */
type LinhaDB = {
  id: string
  nome: string
  instituicao: string | null
  profissional: string | null
  logo_url: string | null
  tipo: Prestador['tipo']
  especialidades: string[] | null
  redes: string[] | null
  uf: string
  municipio: string
  endereco: string | null
  telefones: string[] | null
  visivel: boolean | null
}

/** Dados do formulário de cadastro (sem id ao criar). */
export type PrestadorInput = Omit<Prestador, 'id'> & { id?: string }

const daLinha = (l: LinhaDB): Prestador => ({
  id: l.id,
  nome: l.nome,
  instituicao: l.instituicao ?? undefined,
  profissional: l.profissional ?? undefined,
  logo: l.logo_url ?? undefined,
  tipo: l.tipo,
  especialidades: l.especialidades ?? [],
  redes: l.redes ?? [],
  uf: l.uf,
  municipio: l.municipio,
  endereco: l.endereco ?? '',
  telefones: l.telefones ?? [],
  visivel: l.visivel ?? true,
})

const paraLinha = (p: PrestadorInput) => ({
  nome: p.nome,
  instituicao: p.instituicao || null,
  profissional: p.profissional || null,
  logo_url: p.logo || null,
  tipo: p.tipo,
  especialidades: p.especialidades,
  redes: p.redes,
  uf: p.uf,
  municipio: p.municipio,
  endereco: p.endereco || null,
  telefones: p.telefones,
  visivel: p.visivel ?? true,
})

/** Lista todos os prestadores (Supabase ou fallback estático) — uso no admin. */
export async function carregarPrestadores(): Promise<Prestador[]> {
  if (!supabaseConfigurado || !supabase) return PRESTADORES

  const { data, error } = await supabase
    .from('prestadores')
    .select('*')
    .order('nome')

  if (error) throw error
  return (data as LinhaDB[]).map(daLinha)
}

/** Lista apenas os prestadores visíveis — uso na página pública. */
export async function carregarVisiveis(): Promise<Prestador[]> {
  if (!supabaseConfigurado || !supabase)
    return PRESTADORES.filter((p) => p.visivel !== false)

  /* tenta filtrar por `visivel`; se a coluna ainda não existir, carrega todos */
  let res = await supabase
    .from('prestadores')
    .select('*')
    .eq('visivel', true)
    .order('nome')

  if (res.error) {
    res = await supabase.from('prestadores').select('*').order('nome')
  }
  if (res.error) throw res.error
  return (res.data as LinhaDB[]).map(daLinha)
}

/** Altera só a visibilidade de um prestador. */
export async function definirVisivel(
  id: string,
  visivel: boolean,
): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { error } = await supabase
    .from('prestadores')
    .update({ visivel })
    .eq('id', id)
  if (error) throw error
}

/** Cria (sem id) ou atualiza (com id) um prestador. */
export async function salvarPrestador(
  entrada: PrestadorInput,
): Promise<Prestador> {
  if (!supabase) throw new Error('Supabase não configurado.')

  const linha = paraLinha(entrada)
  const query = entrada.id
    ? supabase.from('prestadores').update(linha).eq('id', entrada.id).select()
    : supabase.from('prestadores').insert(linha).select()

  const { data, error } = await query
  if (error) throw error
  return daLinha((data as LinhaDB[])[0])
}

export async function excluirPrestador(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { error } = await supabase.from('prestadores').delete().eq('id', id)
  if (error) throw error
}

/** Sobe uma imagem de logo para o Storage e devolve a URL pública. */
export async function uploadLogo(arquivo: File): Promise<string> {
  if (!supabase) throw new Error('Supabase não configurado.')

  const ext = arquivo.name.split('.').pop() || 'png'
  const caminho = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('logos')
    .upload(caminho, arquivo, { upsert: false })
  if (error) throw error

  const { data } = supabase.storage.from('logos').getPublicUrl(caminho)
  return data.publicUrl
}
