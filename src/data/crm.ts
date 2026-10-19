/**
 * Controle de CRM — CM.
 *
 * Tipos, helpers de fluxo e dados de exemplo (em memória) para montar o
 * frontend. A persistência real (Supabase) entra depois, trocando este módulo
 * por um `crmRepo.ts` com a mesma forma de dados.
 *
 * Fluxo em 3 etapas sequenciais:
 *   1. ATENDIMENTO  → registra a solicitação
 *   2. ENFERMAGEM   → autoriza (Sim/Não)
 *   3. FINANCEIRO   → agenda e paga
 */

export type PapelCRM = 'atendimento' | 'enfermagem' | 'financeiro' | 'admin'

export type Autorizacao = 'pendente' | 'sim' | 'nao'

export type StatusFinanceiro = 'Pendente' | 'Agendado' | 'Pago' | 'Recusado'

export const STATUS_FINANCEIRO: StatusFinanceiro[] = [
  'Pendente',
  'Agendado',
  'Pago',
  'Recusado',
]

export const FORMAS_PAGAMENTO = ['Pix'] as const

/**
 * STANDBY dos avisos automáticos entre etapas (e-mail via crm-notificar).
 * Enquanto `false`, nenhuma notificação é disparada ao criar/autorizar.
 * Para religar, basta trocar para `true` (a função já está deployada).
 */
export const AVISOS_ATIVOS = false

export type SolicitacaoCRM = {
  id: string
  protocolo: string

  /* ---- Atendimento ---- */
  abertura: string // ISO (yyyy-mm-dd)
  termino: string | null // prazo/conclusão do atendimento
  solicitante: string
  dataConsulta: string | null
  beneficiario: string
  cpf: string
  procedimento: string
  clinicaHospital: string
  valorSolicitado: number | null
  formaPagamento: string
  dadosBancarios: string

  /* ---- Enfermagem ---- */
  autorizacao: Autorizacao
  dataAutorizacao: string | null

  /* ---- Financeiro ---- */
  dataPrevistaPagamento: string | null
  statusFinanceiro: StatusFinanceiro | null
  dataPagamento: string | null

  /* ---- Comum ---- */
  observacoes: string
}

/* ============================================================
 * Etapa atual (derivada do estado) — rótulo + tom para o badge
 * ========================================================== */
export type Tom = 'aguardando' | 'analise' | 'agendado' | 'ok' | 'recusado'

export type EtapaInfo = { chave: string; label: string; tom: Tom }

export function etapaAtual(s: SolicitacaoCRM): EtapaInfo {
  if (s.autorizacao === 'nao' || s.statusFinanceiro === 'Recusado')
    return { chave: 'recusado', label: 'Não autorizado', tom: 'recusado' }

  if (s.autorizacao === 'pendente')
    return { chave: 'enfermagem', label: 'Aguardando enfermagem', tom: 'aguardando' }

  // autorizado
  if (s.statusFinanceiro === 'Pago')
    return { chave: 'pago', label: 'Pago', tom: 'ok' }

  if (s.statusFinanceiro === 'Agendado')
    return { chave: 'agendado', label: 'Pagamento agendado', tom: 'agendado' }

  return { chave: 'financeiro', label: 'Aguardando financeiro', tom: 'analise' }
}

/** Papéis que podem editar cada etapa. */
export function podeEditarAtendimento(p: PapelCRM) {
  return p === 'atendimento' || p === 'admin'
}
export function podeEditarEnfermagem(p: PapelCRM) {
  return p === 'enfermagem' || p === 'admin'
}
export function podeEditarFinanceiro(p: PapelCRM) {
  return p === 'financeiro' || p === 'admin'
}

export const PAPEL_LABEL: Record<PapelCRM, string> = {
  atendimento: 'Atendimento',
  enfermagem: 'Enfermagem',
  financeiro: 'Financeiro',
  admin: 'Admin (todos)',
}

/* ============================================================
 * Utilidades
 * ========================================================== */
export function hojeISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatarData(iso: string | null): string {
  if (!iso) return '—'
  const [a, m, d] = iso.slice(0, 10).split('-')
  if (!a || !m || !d) return '—'
  return `${d}/${m}/${a}`
}

export function formatarValor(v: number | null): string {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Protocolo sequencial: CRM-AAAA-00001 (gerado no banco depois). */
export function proximoProtocolo(existentes: SolicitacaoCRM[]): string {
  const ano = new Date().getFullYear()
  const doAno = existentes.filter((s) => s.protocolo.includes(`-${ano}-`))
  const n = doAno.length + 1
  return `CRM-${ano}-${String(n).padStart(5, '0')}`
}

/* ============================================================
 * Alertas para revisão (regras locais — nenhum dado sai do sistema)
 * ========================================================== */
export type TipoAlerta = 'duplicata' | 'pix' | 'valor' | 'sem-doc'

export type Alerta = {
  id: string
  protocolo: string
  beneficiario: string
  tipo: TipoAlerta
  motivo: string
}

export const ROTULO_ALERTA: Record<TipoAlerta, string> = {
  duplicata: 'Possível duplicata',
  pix: 'Pix repetido',
  valor: 'Valor atípico',
  'sem-doc': 'Sem documento',
}

function mediana(nums: number[]): number {
  if (!nums.length) return 0
  const s = [...nums].sort((a, b) => a - b)
  const meio = Math.floor(s.length / 2)
  return s.length % 2 ? s[meio] : (s[meio - 1] + s[meio]) / 2
}

function chavePix(dados: string): string {
  const t = (dados || '').trim()
  if (!t) return ''
  const i = t.lastIndexOf(':')
  return (i >= 0 ? t.slice(i + 1) : t).replace(/\s+/g, '').toLowerCase()
}

function diasEntre(a: string, b: string): number {
  return (
    Math.abs(
      new Date(a + 'T00:00:00').getTime() - new Date(b + 'T00:00:00').getTime(),
    ) / 86400000
  )
}

/**
 * Gera avisos para o financeiro revisar, a partir das solicitações.
 * Não bloqueia nada e não envia dados a lugar nenhum.
 */
export function calcularAlertas(lista: SolicitacaoCRM[], idsComDoc?: Set<string>): Alerta[] {
  const alertas: Alerta[] = []
  const add = (s: SolicitacaoCRM, tipo: TipoAlerta, motivo: string) =>
    alertas.push({ id: s.id, protocolo: s.protocolo, beneficiario: s.beneficiario, tipo, motivo })

  // 1) duplicatas: mesmo beneficiário + procedimento em até 15 dias
  const grupos = new Map<string, SolicitacaoCRM[]>()
  for (const s of lista) {
    const k = `${s.beneficiario.trim().toLowerCase()}|${s.procedimento.trim().toLowerCase()}`
    ;(grupos.get(k) ?? grupos.set(k, []).get(k)!).push(s)
  }
  for (const grupo of grupos.values()) {
    if (grupo.length < 2) continue
    const ord = [...grupo].sort((a, b) => a.abertura.localeCompare(b.abertura))
    for (let i = 1; i < ord.length; i++) {
      const d = diasEntre(ord[i].abertura, ord[i - 1].abertura)
      if (d <= 15) {
        add(ord[i], 'duplicata', `Mesmo paciente e procedimento de ${ord[i - 1].protocolo} em ${Math.round(d)} dia(s)`)
      }
    }
  }

  // 2) mesma chave Pix em 3+ beneficiários distintos
  const benefPorPix = new Map<string, Set<string>>()
  const solsPorPix = new Map<string, SolicitacaoCRM[]>()
  for (const s of lista) {
    const k = chavePix(s.dadosBancarios)
    if (!k) continue
    if (!benefPorPix.has(k)) {
      benefPorPix.set(k, new Set())
      solsPorPix.set(k, [])
    }
    benefPorPix.get(k)!.add(s.beneficiario.trim().toLowerCase())
    solsPorPix.get(k)!.push(s)
  }
  for (const [k, benefs] of benefPorPix) {
    if (benefs.size >= 3) {
      for (const s of solsPorPix.get(k)!)
        add(s, 'pix', `Mesma chave Pix usada por ${benefs.size} beneficiários diferentes`)
    }
  }

  // 3) valor fora do padrão: acima de 2,5× a mediana do procedimento (grupo com 3+)
  const porProc = new Map<string, SolicitacaoCRM[]>()
  for (const s of lista) {
    if (s.valorSolicitado == null) continue
    const k = s.procedimento.trim().toLowerCase()
    ;(porProc.get(k) ?? porProc.set(k, []).get(k)!).push(s)
  }
  for (const grupo of porProc.values()) {
    if (grupo.length < 3) continue
    const med = mediana(grupo.map((s) => s.valorSolicitado!))
    if (med <= 0) continue
    for (const s of grupo) {
      if (s.valorSolicitado! > med * 2.5) {
        add(
          s,
          'valor',
          `Valor ${formatarValor(s.valorSolicitado)} é ${(s.valorSolicitado! / med).toFixed(1)}× a mediana do procedimento (${formatarValor(med)})`,
        )
      }
    }
  }

  // 4) autorizado sem documento anexado
  if (idsComDoc) {
    for (const s of lista) {
      if (s.autorizacao === 'sim' && !idsComDoc.has(s.id)) {
        add(s, 'sem-doc', 'Autorizada sem documento anexado')
      }
    }
  }

  return alertas
}

/* ============================================================
 * Dados de exemplo (preview) — substituídos pelo Supabase depois
 * ========================================================== */
export const SOLICITACOES_EXEMPLO: SolicitacaoCRM[] = [
  {
    id: 's1',
    protocolo: 'CRM-2026-00001',
    abertura: '2026-10-06',
    termino: '2026-10-26',
    solicitante: 'VANESSA',
    dataConsulta: '2026-10-09',
    beneficiario: 'GAEL HENRIQUE SOUZA ATHAYDE',
    cpf: '123.456.789-09',
    procedimento: 'CONSULTA ENDÓCRINO PEDIÁTRICO',
    clinicaHospital: 'ENDOCARDIO',
    valorSolicitado: 621.25,
    formaPagamento: 'Pix',
    dadosBancarios: 'Pix (e-mail): endocardio.ro@gmail.com',
    autorizacao: 'sim',
    dataAutorizacao: '2026-10-08',
    dataPrevistaPagamento: '2026-10-09',
    statusFinanceiro: 'Agendado',
    dataPagamento: null,
    observacoes: '',
  },
  {
    id: 's2',
    protocolo: 'CRM-2026-00002',
    abertura: '2026-09-15',
    termino: null,
    solicitante: 'VANESSA',
    dataConsulta: null,
    beneficiario: 'ERIKA RODRIGUES DE SOUZA FAIANÇA',
    cpf: '987.654.321-00',
    procedimento: 'LIFTING CERVICOFACIAL',
    clinicaHospital: '',
    valorSolicitado: null,
    formaPagamento: 'Pix',
    dadosBancarios: '',
    autorizacao: 'nao',
    dataAutorizacao: '2026-09-16',
    dataPrevistaPagamento: null,
    statusFinanceiro: 'Recusado',
    dataPagamento: null,
    observacoes: 'Procedimento estético — fora de cobertura.',
  },
  {
    id: 's3',
    protocolo: 'CRM-2026-00003',
    abertura: '2026-10-10',
    termino: '2026-10-30',
    solicitante: 'MARCOS',
    dataConsulta: '2026-10-14',
    beneficiario: 'JOÃO PEDRO LIMA',
    cpf: '111.222.333-96',
    procedimento: 'RESSONÂNCIA MAGNÉTICA DE JOELHO',
    clinicaHospital: 'CLÍNICA IMAGEM RO',
    valorSolicitado: 480,
    formaPagamento: 'Pix',
    dadosBancarios: 'Pix (CNPJ): 12.345.678/0001-90',
    autorizacao: 'pendente',
    dataAutorizacao: null,
    dataPrevistaPagamento: null,
    statusFinanceiro: null,
    dataPagamento: null,
    observacoes: '',
  },
  {
    id: 's4',
    protocolo: 'CRM-2026-00004',
    abertura: '2026-10-11',
    termino: '2026-10-31',
    solicitante: 'VANESSA',
    dataConsulta: '2026-10-12',
    beneficiario: 'MARIA EDUARDA ALVES',
    cpf: '444.555.666-20',
    procedimento: 'SESSÕES DE FISIOTERAPIA (10x)',
    clinicaHospital: 'REABILITAR',
    valorSolicitado: 1200,
    formaPagamento: 'Pix',
    dadosBancarios: 'Pix (telefone): (69) 99999-0000',
    autorizacao: 'sim',
    dataAutorizacao: '2026-10-12',
    dataPrevistaPagamento: '2026-10-05',
    statusFinanceiro: 'Pago',
    dataPagamento: '2026-10-05',
    observacoes: '',
  },
  {
    id: 's5',
    protocolo: 'CRM-2026-00005',
    abertura: '2026-10-13',
    termino: null,
    solicitante: 'LUCAS',
    dataConsulta: '2026-10-20',
    beneficiario: 'ANTÔNIO CARLOS PEREIRA',
    cpf: '777.888.999-00',
    procedimento: 'CONSULTA CARDIOLOGIA',
    clinicaHospital: 'CARDIO CENTER',
    valorSolicitado: 350,
    formaPagamento: 'Pix',
    dadosBancarios: '',
    autorizacao: 'sim',
    dataAutorizacao: '2026-10-13',
    dataPrevistaPagamento: null,
    statusFinanceiro: 'Pendente',
    dataPagamento: null,
    observacoes: '',
  },
]
