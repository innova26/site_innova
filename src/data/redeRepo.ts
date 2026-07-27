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
  logo_url: string | null
  tipo: Prestador['tipo']
  especialidades: string[] | null
  redes: string[] | null
  uf: string
  municipio: string
  endereco: string | null
  telefones: string[] | null
}

/** Dados do formulário de cadastro (sem id ao criar). */
export type PrestadorInput = Omit<Prestador, 'id'> & { id?: string }

const daLinha = (l: LinhaDB): Prestador => ({
  id: l.id,
  nome: l.nome,
  instituicao: l.instituicao ?? undefined,
  logo: l.logo_url ?? undefined,
  tipo: l.tipo,
  especialidades: l.especialidades ?? [],
  redes: l.redes ?? [],
  uf: l.uf,
  municipio: l.municipio,
  endereco: l.endereco ?? '',
  telefones: l.telefones ?? [],
})

const paraLinha = (p: PrestadorInput) => ({
  nome: p.nome,
  instituicao: p.instituicao || null,
  logo_url: p.logo || null,
  tipo: p.tipo,
  especialidades: p.especialidades,
  redes: p.redes,
  uf: p.uf,
  municipio: p.municipio,
  endereco: p.endereco || null,
  telefones: p.telefones,
})

/** Lista todos os prestadores (Supabase ou fallback estático). */
export async function carregarPrestadores(): Promise<Prestador[]> {
  if (!supabaseConfigurado || !supabase) return PRESTADORES

  const { data, error } = await supabase
    .from('prestadores')
    .select('*')
    .order('nome')

  if (error) throw error
  return (data as LinhaDB[]).map(daLinha)
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
