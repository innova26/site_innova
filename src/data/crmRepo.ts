/**
 * Persistência do Controle de CRM no Supabase.
 * Tabelas: `crm_solicitacoes` e `crm_perfis` (ver supabase/crm.sql).
 * Mapeia snake_case (banco) ↔ camelCase (app).
 */
import { supabase } from '../lib/supabase'
import type { PapelCRM, SolicitacaoCRM } from './crm'

type LinhaCRM = {
  id: string
  protocolo: string
  abertura: string
  termino: string | null
  solicitante: string
  data_consulta: string | null
  beneficiario: string
  procedimento: string
  clinica_hospital: string | null
  valor_solicitado: number | string | null
  forma_pagamento: string
  dados_bancarios: string | null
  autorizacao: SolicitacaoCRM['autorizacao']
  data_autorizacao: string | null
  data_prevista_pagamento: string | null
  status_financeiro: SolicitacaoCRM['statusFinanceiro']
  data_pagamento: string | null
  observacoes: string | null
}

function daLinha(l: LinhaCRM): SolicitacaoCRM {
  return {
    id: l.id,
    protocolo: l.protocolo,
    abertura: l.abertura,
    termino: l.termino,
    solicitante: l.solicitante,
    dataConsulta: l.data_consulta,
    beneficiario: l.beneficiario,
    procedimento: l.procedimento,
    clinicaHospital: l.clinica_hospital ?? '',
    valorSolicitado: l.valor_solicitado == null ? null : Number(l.valor_solicitado),
    formaPagamento: l.forma_pagamento,
    dadosBancarios: l.dados_bancarios ?? '',
    autorizacao: l.autorizacao,
    dataAutorizacao: l.data_autorizacao,
    dataPrevistaPagamento: l.data_prevista_pagamento,
    statusFinanceiro: l.status_financeiro,
    dataPagamento: l.data_pagamento,
    observacoes: l.observacoes ?? '',
  }
}

/** Papel do usuário logado no CRM (null = sem acesso). */
export async function meuPapel(): Promise<PapelCRM | null> {
  if (!supabase) return null
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) return null
  const { data, error } = await supabase
    .from('crm_perfis')
    .select('papel')
    .eq('user_id', uid)
    .eq('ativo', true)
    .maybeSingle()
  if (error || !data) return null
  return data.papel as PapelCRM
}

export async function listarSolicitacoes(): Promise<SolicitacaoCRM[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('crm_solicitacoes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as LinhaCRM[]).map(daLinha)
}

export type NovaSolicitacao = {
  solicitante: string
  beneficiario: string
  procedimento: string
  clinicaHospital: string
  dataConsulta: string | null
  termino: string | null
  valorSolicitado: number | null
  dadosBancarios: string
  observacoes: string
}

export async function criarSolicitacao(dados: NovaSolicitacao): Promise<SolicitacaoCRM> {
  if (!supabase) throw new Error('Supabase indisponível.')
  const { data, error } = await supabase
    .from('crm_solicitacoes')
    .insert({
      solicitante: dados.solicitante,
      beneficiario: dados.beneficiario,
      procedimento: dados.procedimento,
      clinica_hospital: dados.clinicaHospital || null,
      data_consulta: dados.dataConsulta,
      termino: dados.termino,
      valor_solicitado: dados.valorSolicitado,
      forma_pagamento: 'Pix',
      dados_bancarios: dados.dadosBancarios || null,
      observacoes: dados.observacoes || null,
    })
    .select('*')
    .single()
  if (error) throw error
  return daLinha(data as LinhaCRM)
}

/** Campos editáveis convertidos para as colunas do banco. */
type PatchCRM = Partial<{
  autorizacao: SolicitacaoCRM['autorizacao']
  dataAutorizacao: string | null
  dataPrevistaPagamento: string | null
  statusFinanceiro: SolicitacaoCRM['statusFinanceiro']
  dataPagamento: string | null
  observacoes: string
}>

export async function atualizarSolicitacao(
  id: string,
  patch: PatchCRM,
): Promise<SolicitacaoCRM> {
  if (!supabase) throw new Error('Supabase indisponível.')
  const col: Record<string, unknown> = {}
  if ('autorizacao' in patch) col.autorizacao = patch.autorizacao
  if ('dataAutorizacao' in patch) col.data_autorizacao = patch.dataAutorizacao
  if ('dataPrevistaPagamento' in patch) col.data_prevista_pagamento = patch.dataPrevistaPagamento
  if ('statusFinanceiro' in patch) col.status_financeiro = patch.statusFinanceiro
  if ('dataPagamento' in patch) col.data_pagamento = patch.dataPagamento
  if ('observacoes' in patch) col.observacoes = patch.observacoes

  const { data, error } = await supabase
    .from('crm_solicitacoes')
    .update(col)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return daLinha(data as LinhaCRM)
}
