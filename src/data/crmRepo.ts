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
  cpf: string | null
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
    cpf: l.cpf ?? '',
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

/**
 * Dispara o aviso por e-mail entre etapas (best-effort).
 * Não propaga erro: a notificação não deve travar a ação do usuário.
 */
export async function notificar(
  evento: 'nova' | 'autorizada',
  id: string,
): Promise<void> {
  if (!supabase) return
  try {
    await supabase.functions.invoke('crm-notificar', { body: { evento, id } })
  } catch (e) {
    console.warn('Falha ao notificar etapa do CRM:', e)
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

/**
 * Assina mudanças em tempo real na tabela de solicitações (Supabase Realtime).
 * Chama `aoMudar` a cada inserção/atualização/exclusão. Devolve uma função
 * para encerrar a assinatura. Requer o realtime ligado na tabela (ver SQL).
 */
export function assinarSolicitacoes(aoMudar: () => void): () => void {
  if (!supabase) return () => {}
  const canal = supabase
    .channel('crm_solicitacoes_rt')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'crm_solicitacoes' },
      () => aoMudar(),
    )
    .subscribe()
  return () => {
    void supabase!.removeChannel(canal)
  }
}

export type NovaSolicitacao = {
  protocolo: string
  solicitante: string
  beneficiario: string
  cpf: string
  procedimento: string
  clinicaHospital: string
  dataConsulta: string | null
  termino: string | null
  valorSolicitado: number | null
  dadosBancarios: string
  observacoes: string
}

/** Padroniza textos de identificação em MAIÚSCULAS (evita "Daiana" vs "DAIANA"
 *  contar como pessoas diferentes nos rankings). Pix e observações ficam de fora:
 *  uma chave Pix aleatória é sensível a maiúsculas e a observação é texto livre. */
const maiusc = (v: string) => v.trim().toLocaleUpperCase('pt-BR')

export async function criarSolicitacao(dados: NovaSolicitacao): Promise<SolicitacaoCRM> {
  if (!supabase) throw new Error('Supabase indisponível.')
  const { data, error } = await supabase
    .from('crm_solicitacoes')
    .insert({
      // vazio deixa o trigger gerar CRM-AAAA-00001; preenchido usa o informado
      protocolo: maiusc(dados.protocolo) || null,
      solicitante: maiusc(dados.solicitante),
      beneficiario: maiusc(dados.beneficiario),
      cpf: dados.cpf || null,
      procedimento: maiusc(dados.procedimento),
      clinica_hospital: dados.clinicaHospital ? maiusc(dados.clinicaHospital) : null,
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
  // atendimento (abertura)
  beneficiario: string
  cpf: string
  solicitante: string
  procedimento: string
  clinicaHospital: string
  valorSolicitado: number | null
  dataConsulta: string | null
  termino: string | null
  dadosBancarios: string
  // enfermagem
  autorizacao: SolicitacaoCRM['autorizacao']
  dataAutorizacao: string | null
  // financeiro
  dataPrevistaPagamento: string | null
  statusFinanceiro: SolicitacaoCRM['statusFinanceiro']
  dataPagamento: string | null
  // comum
  observacoes: string
}>

export async function atualizarSolicitacao(
  id: string,
  patch: PatchCRM,
): Promise<SolicitacaoCRM> {
  if (!supabase) throw new Error('Supabase indisponível.')
  const col: Record<string, unknown> = {}
  // atendimento — identificação em MAIÚSCULAS (igual ao cadastro)
  if ('beneficiario' in patch) col.beneficiario = maiusc(patch.beneficiario ?? '')
  if ('cpf' in patch) col.cpf = patch.cpf || null
  if ('solicitante' in patch) col.solicitante = maiusc(patch.solicitante ?? '')
  if ('procedimento' in patch) col.procedimento = maiusc(patch.procedimento ?? '')
  if ('clinicaHospital' in patch)
    col.clinica_hospital = patch.clinicaHospital ? maiusc(patch.clinicaHospital) : null
  if ('valorSolicitado' in patch) col.valor_solicitado = patch.valorSolicitado
  if ('dataConsulta' in patch) col.data_consulta = patch.dataConsulta
  if ('termino' in patch) col.termino = patch.termino
  if ('dadosBancarios' in patch) col.dados_bancarios = patch.dadosBancarios || null
  // enfermagem / financeiro
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

/** Exclui uma solicitação (RLS permite apenas admin), limpando os anexos. */
export async function excluirSolicitacao(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase indisponível.')
  // remove os arquivos do Storage antes (evita órfãos; as linhas caem por cascata)
  const { data: anexos } = await supabase
    .from('crm_anexos')
    .select('path')
    .eq('solicitacao_id', id)
  const paths = (anexos ?? []).map((a) => a.path as string)
  if (paths.length) await supabase.storage.from(BUCKET_ANEXOS).remove(paths)

  const { error } = await supabase.from('crm_solicitacoes').delete().eq('id', id)
  if (error) throw error
}

/* ============================================================
 * Anexos (documentos do atendimento + recibo do financeiro)
 * ========================================================== */
const BUCKET_ANEXOS = 'crm-anexos'

export type TipoAnexo = 'documento' | 'recibo'

export type AnexoCRM = {
  id: string
  solicitacaoId: string
  tipo: TipoAnexo
  nome: string
  path: string
  tamanho: number | null
  mime: string | null
  createdAt: string
}

type LinhaAnexo = {
  id: string
  solicitacao_id: string
  tipo: TipoAnexo
  nome: string
  path: string
  tamanho: number | null
  mime: string | null
  created_at: string
}

function daAnexo(l: LinhaAnexo): AnexoCRM {
  return {
    id: l.id,
    solicitacaoId: l.solicitacao_id,
    tipo: l.tipo,
    nome: l.nome,
    path: l.path,
    tamanho: l.tamanho,
    mime: l.mime,
    createdAt: l.created_at,
  }
}

/**
 * Sugestões vindas da Rede de Atendimento (tabela `prestadores`):
 * clínicas/hospitais (nome, instituição) e procedimentos (especialidades).
 */
export async function sugestoesRede(): Promise<{ clinicas: string[]; procedimentos: string[] }> {
  if (!supabase) return { clinicas: [], procedimentos: [] }
  const { data, error } = await supabase
    .from('prestadores')
    .select('nome, instituicao, especialidades')
    .eq('visivel', true)
  if (error) return { clinicas: [], procedimentos: [] }
  const clin = new Set<string>()
  const proc = new Set<string>()
  for (const p of (data ?? []) as {
    nome: string | null
    instituicao: string | null
    especialidades: string[] | null
  }[]) {
    if (p.nome?.trim()) clin.add(p.nome.trim())
    if (p.instituicao?.trim()) clin.add(p.instituicao.trim())
    for (const e of p.especialidades ?? []) if (e?.trim()) proc.add(e.trim())
  }
  const ordenar = (c: Set<string>) => [...c].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  return { clinicas: ordenar(clin), procedimentos: ordenar(proc) }
}

/** Conjunto de solicitações que têm ao menos um documento anexado. */
export async function idsComDocumento(): Promise<Set<string>> {
  if (!supabase) return new Set()
  const { data, error } = await supabase
    .from('crm_anexos')
    .select('solicitacao_id')
    .eq('tipo', 'documento')
  if (error) return new Set()
  return new Set((data ?? []).map((r) => (r as { solicitacao_id: string }).solicitacao_id))
}

export async function listarAnexos(solicitacaoId: string): Promise<AnexoCRM[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('crm_anexos')
    .select('*')
    .eq('solicitacao_id', solicitacaoId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as LinhaAnexo[]).map(daAnexo)
}

export async function enviarAnexo(
  solicitacaoId: string,
  tipo: TipoAnexo,
  arquivo: File,
): Promise<AnexoCRM> {
  if (!supabase) throw new Error('Supabase indisponível.')
  const ext = (arquivo.name.split('.').pop() || 'bin').toLowerCase()
  const path = `${solicitacaoId}/${tipo}/${crypto.randomUUID()}.${ext}`

  const { error: upErr } = await supabase.storage
    .from(BUCKET_ANEXOS)
    .upload(path, arquivo, { contentType: arquivo.type, upsert: false })
  if (upErr) throw upErr

  const { data: auth } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('crm_anexos')
    .insert({
      solicitacao_id: solicitacaoId,
      tipo,
      nome: arquivo.name,
      path,
      tamanho: arquivo.size,
      mime: arquivo.type || null,
      uploaded_by: auth.user?.id ?? null,
    })
    .select('*')
    .single()

  if (error) {
    // desfaz o upload se não conseguiu gravar o metadado
    await supabase.storage.from(BUCKET_ANEXOS).remove([path])
    throw error
  }
  return daAnexo(data as LinhaAnexo)
}

/** Link temporário (1h) para baixar/visualizar o anexo. */
export async function urlAnexo(path: string): Promise<string> {
  if (!supabase) throw new Error('Supabase indisponível.')
  const { data, error } = await supabase.storage
    .from(BUCKET_ANEXOS)
    .createSignedUrl(path, 3600)
  if (error || !data) throw error ?? new Error('Link indisponível.')
  return data.signedUrl
}

export async function excluirAnexo(anexo: AnexoCRM): Promise<void> {
  if (!supabase) throw new Error('Supabase indisponível.')
  await supabase.storage.from(BUCKET_ANEXOS).remove([anexo.path])
  const { error } = await supabase.from('crm_anexos').delete().eq('id', anexo.id)
  if (error) throw error
}

/* ============================================================
 * Histórico (trilha de auditoria) — ver supabase/crm_historico.sql
 * ========================================================== */
export type HistoricoCRM = {
  id: string
  evento: string
  detalhe: string | null
  userNome: string | null
  createdAt: string
}

export async function listarHistorico(solicitacaoId: string): Promise<HistoricoCRM[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('crm_historico')
    .select('id, evento, detalhe, user_nome, created_at')
    .eq('solicitacao_id', solicitacaoId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (
    data as {
      id: string
      evento: string
      detalhe: string | null
      user_nome: string | null
      created_at: string
    }[]
  ).map((r) => ({
    id: r.id,
    evento: r.evento,
    detalhe: r.detalhe,
    userNome: r.user_nome,
    createdAt: r.created_at,
  }))
}

/* ============================================================
 * Gestão de usuários (admin) — via Edge Function crm-usuarios
 * ========================================================== */
export type UsuarioCRM = {
  user_id: string
  nome: string
  email: string
  papel: PapelCRM
  ativo: boolean
}

async function invocarUsuarios(
  acao: string,
  extra: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  if (!supabase) throw new Error('Supabase indisponível.')
  const { data, error } = await supabase.functions.invoke('crm-usuarios', {
    body: { acao, ...extra },
  })
  if (error) {
    let msg = error.message
    try {
      const ctx = (error as { context?: Response }).context
      const corpo = ctx ? await ctx.json() : null
      if (corpo?.error) msg = corpo.error
    } catch {
      /* mantém msg padrão */
    }
    throw new Error(msg)
  }
  return data as Record<string, unknown>
}

export async function listarUsuarios(): Promise<UsuarioCRM[]> {
  const data = await invocarUsuarios('listar')
  return (data.usuarios as UsuarioCRM[]) ?? []
}

export async function convidarUsuario(
  nome: string,
  email: string,
  papel: PapelCRM,
): Promise<UsuarioCRM> {
  const data = await invocarUsuarios('convidar', { nome, email, papel })
  return data.usuario as UsuarioCRM
}

export async function atualizarUsuario(
  user_id: string,
  patch: { papel?: PapelCRM; ativo?: boolean },
): Promise<UsuarioCRM> {
  const data = await invocarUsuarios('atualizar', { user_id, ...patch })
  return data.usuario as UsuarioCRM
}

export async function redefinirSenha(user_id: string): Promise<boolean> {
  const data = await invocarUsuarios('redefinir_senha', { user_id })
  return Boolean(data.enviado)
}

export async function removerUsuario(user_id: string): Promise<void> {
  await invocarUsuarios('remover', { user_id })
}

/** Id do usuário logado (para esconder ações sobre a própria conta). */
export async function meuUserId(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

/** Nome do usuário logado (do perfil do CRM) — para pré-preencher o solicitante. */
export async function meuNome(): Promise<string> {
  if (!supabase) return ''
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) return ''
  const { data } = await supabase
    .from('crm_perfis')
    .select('nome')
    .eq('user_id', uid)
    .maybeSingle()
  return (data?.nome as string | null) ?? ''
}
