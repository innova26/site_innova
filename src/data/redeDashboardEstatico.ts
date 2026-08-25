/**
 * Dados do Dashboard de Redes a partir dos JSONs estáticos por cidade
 * (o mesmo dado que já existia no protótipo em src/dashboard/).
 *
 * Isso é o que alimenta /admin/redes por enquanto — o cadastro editável
 * (ligado ao Supabase, ver redeDashboardRepo.ts) fica pra uma etapa
 * separada, mais pra frente.
 */
import ariquemesData from './redeDashboardJson/ariquemes.json'
import boaVistaData from './redeDashboardJson/boa_vista.json'
import manausData from './redeDashboardJson/manaus.json'
import portoVelhoData from './redeDashboardJson/porto_velho.json'
import type {
  BlocoFicha,
  PrestadorRede,
  ProcedimentoRede,
} from './redeDashboardRepo'

type LinhaTabelaJson = {
  cod?: string
  desc?: string
  val?: string | number | null
  num?: number | null
  extra?: string
}

type BlocoJson =
  | { type: 'title'; text: string }
  | { type: 'note'; text: string }
  | { type: 'table'; cols: string[]; rows: LinhaTabelaJson[] }

type PrestadorJson = {
  nome: string
  servico?: string
  macro: string
  status: string
  sheet?: string
  blocks?: BlocoJson[]
  meta?: { razao?: string; cnpj?: string; cep?: string }
}

type CidadeJson = {
  providers: PrestadorJson[]
}

const FONTES: [string, CidadeJson][] = [
  ['Ariquemes', ariquemesData as CidadeJson],
  ['Boa Vista', boaVistaData as CidadeJson],
  ['Manaus', manausData as CidadeJson],
  ['Porto Velho', portoVelhoData as CidadeJson],
]

/** Só linhas com valor numérico viram procedimento — o resto (cabeçalho de
 * tabela, nota de metodologia) é ruído que veio junto da extração da
 * planilha original. */
const procedimentosDoPrestador = (p: PrestadorJson): ProcedimentoRede[] => {
  const linhas: ProcedimentoRede[] = []
  for (const bloco of p.blocks ?? []) {
    if (bloco.type !== 'table') continue
    for (const row of bloco.rows) {
      if (typeof row.num !== 'number' || !row.desc?.trim()) continue
      linhas.push({
        codigo: row.cod?.trim() || undefined,
        descricao: row.desc.trim(),
        valor: row.num,
      })
    }
  }
  return linhas
}

/** Valor exibido na coluna de valor, fiel à planilha: um preço quando é
 *  numérico, senão o texto original (ex.: "CBHPM 2016", a especialidade do
 *  profissional no corpo clínico) — ou vazio. */
const valorDaLinha = (row: LinhaTabelaJson): string | number | null => {
  if (typeof row.num === 'number') return row.num
  if (typeof row.val === 'string') return row.val.trim() || null
  return row.val ?? null
}

const normalizar = (s: unknown): string =>
  (s ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()

/** Rótulos de coluna/seção que na planilha repetem como linha de cabeçalho. */
const ROTULOS_CABECALHO = new Set([
  'CODIGO', 'CODIFICACAO', 'CODIGO PACOTE', 'TUSS', 'SADT', 'UCO', 'FILME',
  'SERVICO', 'SERVICOS', 'SERVICOS REALIZADOS', 'SERRVICO', 'SERICO', 'SERVCO',
  'PACOTE', 'PACOTES', 'CONSULTAS', 'ESPECIALIDADE', 'ESPECIALIDADES',
  'DESCRICAO', 'PROFISSIONAL', 'TABELA', 'VALOR',
  'HONORARIOS', 'MATERIAL', 'MEDICAMENTO',
  'PROCEDIMENTO', 'PROCEDIMENTOS', 'PROCEDIMENTO SADT',
])
/** Formas compostas dos mesmos rótulos (ex.: "DESCRIÇÃO DO PACOTE"). */
const RE_CABECALHO_COMPOSTO =
  /^(CODIGO( DO)? PACOTE|DESCRICAO( DO)?( PACOTE| PROCEDIMENTO| SERVICO)|PACOTES HM)$/

const ehCelulaCabecalho = (c: string) =>
  ROTULOS_CABECALHO.has(c) || RE_CABECALHO_COMPOSTO.test(c)

/** A linha é um cabeçalho embutido (não um dado) quando não tem valor
 *  numérico e todas as suas células preenchidas são rótulos de cabeçalho —
 *  ex.: "SERVIÇO | DESCRIÇÃO | TABELA". Linhas como "TUSS | HONORARIO MEDICO
 *  | CBHPM 2016" têm conteúdo real na descrição e continuam como dado. */
const ehLinhaCabecalho = (row: LinhaTabelaJson): boolean => {
  if (typeof row.num === 'number') return false
  const celulas = [row.cod, row.desc, row.val].map(normalizar).filter((c) => c !== '')
  return celulas.length >= 2 && celulas.every(ehCelulaCabecalho)
}

/** Converte os blocos da planilha na ficha exibível, preservando títulos de
 *  seção, notas de composição e todas as linhas das tabelas (inclusive as não
 *  numéricas, como corpo clínico) — o que a lista de procedimentos descarta. */
const fichaDoPrestador = (p: PrestadorJson): BlocoFicha[] =>
  (p.blocks ?? []).map((bloco): BlocoFicha => {
    if (bloco.type === 'table') {
      return {
        tipo: 'tabela',
        colunas: bloco.cols,
        linhas: bloco.rows.map((row) => ({
          codigo: row.cod?.trim() || undefined,
          descricao: row.desc?.trim() || undefined,
          valor: valorDaLinha(row),
          cabecalho: ehLinhaCabecalho(row) || undefined,
        })),
      }
    }
    return { tipo: bloco.type === 'title' ? 'titulo' : 'nota', texto: bloco.text }
  })

export function carregarPrestadoresRedeEstatico(): PrestadorRede[] {
  return FONTES.flatMap(([cidade, dados]) =>
    dados.providers.map((p, index) => ({
      id: `${cidade}-${index}`,
      cidade,
      nome: p.nome,
      servico: p.servico || undefined,
      macro: p.macro,
      status: p.status,
      sheet: p.sheet || undefined,
      procedimentos: procedimentosDoPrestador(p),
      ficha: fichaDoPrestador(p),
      cadastro: p.meta
        ? { razao: p.meta.razao, cnpj: p.meta.cnpj, cep: p.meta.cep }
        : undefined,
    })),
  )
}
