/**
 * Acesso aos dados do Dashboard de Redes (preços negociados e status de
 * contrato por prestador, por cidade). Diferente de `redeRepo.ts`
 * (prestadores da listagem pública), este dado é interno — sem fallback
 * estático: exige Supabase configurado e usuário logado (RLS cuida disso).
 *
 * Tabelas: `dashboard_redes_prestadores` e `dashboard_redes_procedimentos`
 * (ver supabase/rede_dashboard.sql).
 */
import { supabase } from '../lib/supabase'

/** Erros do Supabase são objetos simples (sem `.toString()` útil) — isso
 * garante que `String(erro)`/`erro.message` no /admin sempre mostrem o
 * texto de verdade, em vez de "[object Object]". */
const erroSupabase = (e: { message: string } | null): Error | null =>
  e ? new Error(e.message) : null

export type ProcedimentoRede = {
  id?: string
  codigo?: string
  descricao: string
  valor: number
}

/** Uma linha da ficha tal como veio da planilha. O valor pode ser um preço
 *  (número) ou um texto (ex.: especialidade do profissional, nome de tabela);
 *  `null` = célula vazia. */
export type LinhaFicha = {
  codigo?: string
  descricao?: string
  valor?: string | number | null
  /** Linha que na planilha era um cabeçalho de coluna/seção repetido (ex.:
   *  "SERVIÇO | DESCRIÇÃO | TABELA"), não um dado — renderizada como header. */
  cabecalho?: boolean
}

/** Bloco da ficha preservando a estrutura original do Excel: seções (título),
 *  notas de composição/metodologia e tabelas com suas próprias colunas. */
export type BlocoFicha =
  | { tipo: 'titulo'; texto: string }
  | { tipo: 'nota'; texto: string }
  | { tipo: 'tabela'; colunas: string[]; linhas: LinhaFicha[] }

/** Cabeçalho cadastral que aparece no topo da planilha de cada prestador. */
export type CadastroRede = {
  razao?: string
  cnpj?: string
  cep?: string
}

export type PrestadorRede = {
  id: string
  cidade: string
  nome: string
  servico?: string
  macro: string
  status: string
  sheet?: string
  procedimentos: ProcedimentoRede[]
  /** Ficha completa como na planilha (corpo clínico, notas de composição,
   *  títulos de seção). Presente na fonte estática; ausente no cadastro
   *  editável do Supabase, que só guarda os procedimentos numéricos. */
  ficha?: BlocoFicha[]
  cadastro?: CadastroRede
}

/** Dados do formulário (sem id ao criar; procedimentos substituem os atuais ao salvar). */
export type PrestadorRedeInput = Omit<PrestadorRede, 'id'> & { id?: string }

type LinhaPrestadorDB = {
  id: string
  cidade: string
  nome: string
  servico: string | null
  macro: string
  status: string
  sheet: string | null
}

type LinhaProcedimentoDB = {
  id: string
  prestador_id: string
  codigo: string | null
  descricao: string
  valor: number
}

/** Cidades cobertas hoje pelo dashboard; a lista real vem dos dados carregados. */
export const CIDADES_PADRAO = ['Ariquemes', 'Boa Vista', 'Manaus', 'Porto Velho']

/** Carrega todos os prestadores de rede com seus procedimentos (uso no /admin/redes). */
export async function carregarPrestadoresRede(): Promise<PrestadorRede[]> {
  if (!supabase) throw new Error('Supabase não configurado.')

  const [prestadoresRes, procedimentosRes] = await Promise.all([
    supabase
      .from('dashboard_redes_prestadores')
      .select('*')
      .order('cidade')
      .order('nome'),
    supabase
      .from('dashboard_redes_procedimentos')
      .select('*')
      .order('descricao'),
  ])

  if (prestadoresRes.error) throw erroSupabase(prestadoresRes.error)
  if (procedimentosRes.error) throw erroSupabase(procedimentosRes.error)

  const porPrestador = new Map<string, ProcedimentoRede[]>()
  for (const linha of procedimentosRes.data as LinhaProcedimentoDB[]) {
    const lista = porPrestador.get(linha.prestador_id) ?? []
    lista.push({
      id: linha.id,
      codigo: linha.codigo ?? undefined,
      descricao: linha.descricao,
      valor: Number(linha.valor),
    })
    porPrestador.set(linha.prestador_id, lista)
  }

  return (prestadoresRes.data as LinhaPrestadorDB[]).map((p) => ({
    id: p.id,
    cidade: p.cidade,
    nome: p.nome,
    servico: p.servico ?? undefined,
    macro: p.macro,
    status: p.status,
    sheet: p.sheet ?? undefined,
    procedimentos: porPrestador.get(p.id) ?? [],
  }))
}

/**
 * Cria (sem id) ou atualiza (com id) um prestador de rede. A lista de
 * procedimentos enviada SUBSTITUI a lista atual no banco (apaga e
 * reinsere) — mais simples que diff linha a linha, e casa com um
 * formulário que edita a lista inteira de uma vez.
 */
export async function salvarPrestadorRede(
  entrada: PrestadorRedeInput,
): Promise<PrestadorRede> {
  if (!supabase) throw new Error('Supabase não configurado.')

  const linhaPrestador = {
    cidade: entrada.cidade,
    nome: entrada.nome,
    servico: entrada.servico || null,
    macro: entrada.macro,
    status: entrada.status,
    sheet: entrada.sheet || null,
  }

  const query = entrada.id
    ? supabase
        .from('dashboard_redes_prestadores')
        .update(linhaPrestador)
        .eq('id', entrada.id)
        .select()
    : supabase.from('dashboard_redes_prestadores').insert(linhaPrestador).select()

  const { data, error } = await query
  if (error) throw erroSupabase(error)
  const prestadorSalvo = (data as LinhaPrestadorDB[])[0]

  // substitui os procedimentos atuais pelos do formulário
  const { error: erroExcluir } = await supabase
    .from('dashboard_redes_procedimentos')
    .delete()
    .eq('prestador_id', prestadorSalvo.id)
  if (erroExcluir) throw erroSupabase(erroExcluir)

  const procedimentosValidos = entrada.procedimentos.filter(
    (p) => p.descricao.trim() && Number.isFinite(p.valor),
  )

  let procedimentosSalvos: LinhaProcedimentoDB[] = []
  if (procedimentosValidos.length) {
    const { data: dataProc, error: erroProc } = await supabase
      .from('dashboard_redes_procedimentos')
      .insert(
        procedimentosValidos.map((p) => ({
          prestador_id: prestadorSalvo.id,
          codigo: p.codigo || null,
          descricao: p.descricao.trim(),
          valor: p.valor,
        })),
      )
      .select()
    if (erroProc) throw erroSupabase(erroProc)
    procedimentosSalvos = dataProc as LinhaProcedimentoDB[]
  }

  return {
    id: prestadorSalvo.id,
    cidade: prestadorSalvo.cidade,
    nome: prestadorSalvo.nome,
    servico: prestadorSalvo.servico ?? undefined,
    macro: prestadorSalvo.macro,
    status: prestadorSalvo.status,
    sheet: prestadorSalvo.sheet ?? undefined,
    procedimentos: procedimentosSalvos.map((p) => ({
      id: p.id,
      codigo: p.codigo ?? undefined,
      descricao: p.descricao,
      valor: Number(p.valor),
    })),
  }
}

/** Exclui um prestador de rede (os procedimentos vão junto, por FK em cascata). */
export async function excluirPrestadorRede(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado.')
  const { error } = await supabase
    .from('dashboard_redes_prestadores')
    .delete()
    .eq('id', id)
  if (error) throw erroSupabase(error)
}

/* ====================== Agregações para o dashboard ====================== */

export type DashboardCidade = {
  cidade: string
  meta: {
    total: number
    servicosDistintos: number
    totalProcedimentos: number
  }
  status: [string, number][]
  macro: Record<string, number>
  providers: (PrestadorRede & { n: number; min: number; max: number; media: number })[]
}

/** Deriva os números do dashboard (KPIs, distribuições, faixas de preço) a partir dos prestadores carregados — nunca fica desatualizado porque não é armazenado, é sempre recalculado. */
export function construirDashboardPorCidade(
  prestadores: PrestadorRede[],
  cidade: string,
): DashboardCidade {
  const daCidade = prestadores.filter((p) => p.cidade === cidade)

  const statusMap = new Map<string, number>()
  const macroMap = new Map<string, number>()
  const servicos = new Set<string>()
  let totalProcedimentos = 0

  const providers = daCidade.map((p) => {
    statusMap.set(p.status, (statusMap.get(p.status) ?? 0) + 1)
    macroMap.set(p.macro, (macroMap.get(p.macro) ?? 0) + 1)
    if (p.servico) servicos.add(p.servico)
    totalProcedimentos += p.procedimentos.length

    const valores = p.procedimentos.map((x) => x.valor)
    const min = valores.length ? Math.min(...valores) : 0
    const max = valores.length ? Math.max(...valores) : 0
    const media = valores.length
      ? valores.reduce((a, b) => a + b, 0) / valores.length
      : 0

    return { ...p, n: p.procedimentos.length, min, max, media }
  })

  return {
    cidade,
    meta: {
      total: daCidade.length,
      servicosDistintos: servicos.size,
      totalProcedimentos,
    },
    status: [...statusMap.entries()],
    macro: Object.fromEntries(macroMap),
    providers,
  }
}

/** Lista as cidades presentes nos dados (fallback para CIDADES_PADRAO se vazio). */
export function cidadesDe(prestadores: PrestadorRede[]): string[] {
  const cidades = [...new Set(prestadores.map((p) => p.cidade))]
  return cidades.length ? cidades.sort() : CIDADES_PADRAO
}
