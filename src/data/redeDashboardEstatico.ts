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
import type { PrestadorRede, ProcedimentoRede } from './redeDashboardRepo'

type LinhaTabelaJson = {
  cod?: string
  desc?: string
  val?: string
  num?: number
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
    })),
  )
}
