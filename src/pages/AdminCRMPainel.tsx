import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'
import {
  calcularAlertas,
  etapaAtual,
  formatarValor,
  ROTULO_ALERTA,
  type SolicitacaoCRM,
  type PapelCRM,
} from '../data/crm'
import {
  assinarSolicitacoes,
  idsComDocumento,
  listarSolicitacoes,
  meuPapel,
} from '../data/crmRepo'

type Periodo = '30' | '90' | 'ano'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const PERIODOS: { chave: Periodo; label: string }[] = [
  { chave: '30', label: '30 dias' },
  { chave: '90', label: '90 dias' },
  { chave: 'ano', label: 'Ano' },
]

/** Valor curto para rótulo de barra (R$ 1,2k). */
function compacto(v: number): string {
  if (v >= 1000) return `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
  return `R$ ${Math.round(v)}`
}

function noPeriodo(s: SolicitacaoCRM, periodo: Periodo): boolean {
  if (!s.abertura) return false
  const dt = new Date(s.abertura + 'T00:00:00')
  const hoje = new Date()
  if (periodo === 'ano') return dt.getFullYear() === hoje.getFullYear()
  const dias = periodo === '30' ? 30 : 90
  return dt.getTime() >= hoje.getTime() - dias * 86400000
}

function calcular(lista: SolicitacaoCRM[]) {
  const etapas = { pago: 0, agendado: 0, financeiro: 0, enfermagem: 0, recusado: 0 }
  for (const s of lista) {
    const c = etapaAtual(s).chave as keyof typeof etapas
    if (c in etapas) etapas[c]++
  }

  const totalAPagar = lista
    .filter((s) => s.autorizacao === 'sim' && s.statusFinanceiro !== 'Pago')
    .reduce((a, s) => a + (s.valorSolicitado ?? 0), 0)

  const mesAtual = new Date().toISOString().slice(0, 7)
  const pagoNoMes = lista
    .filter((s) => s.statusFinanceiro === 'Pago' && (s.dataPagamento ?? '').startsWith(mesAtual))
    .reduce((a, s) => a + (s.valorSolicitado ?? 0), 0)

  // valor pago nos últimos 6 meses
  const hoje = new Date()
  const buckets: { rotulo: string; chave: string; valor: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    buckets.push({
      rotulo: MESES[d.getMonth()],
      chave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      valor: 0,
    })
  }
  for (const s of lista) {
    if (s.statusFinanceiro === 'Pago' && s.dataPagamento) {
      const b = buckets.find((x) => x.chave === s.dataPagamento!.slice(0, 7))
      if (b) b.valor += s.valorSolicitado ?? 0
    }
  }

  // ranking: top 5 por campo (+ demais)
  const ranking = (campo: (s: SolicitacaoCRM) => string) => {
    const mapa = new Map<string, number>()
    for (const s of lista) {
      const n = (campo(s) || '—').trim() || '—'
      mapa.set(n, (mapa.get(n) ?? 0) + 1)
    }
    const ord = [...mapa.entries()].sort((a, b) => b[1] - a[1])
    const top5 = ord.slice(0, 5).map(([nome, n]) => ({ nome, n }))
    const resto = ord.slice(5).reduce((a, [, n]) => a + n, 0)
    if (resto > 0) top5.push({ nome: 'Demais', n: resto })
    return top5
  }
  const top = ranking((s) => s.solicitante)
  const topBenef = ranking((s) => s.beneficiario)

  // solicitações por dia (últimos 14 dias, pela data de abertura)
  const pad = (n: number) => String(n).padStart(2, '0')
  const dias: { rotulo: string; chave: string; qtd: number }[] = []
  const base = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() - i)
    dias.push({
      rotulo: String(d.getDate()),
      chave: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      qtd: 0,
    })
  }
  for (const s of lista) {
    const b = dias.find((x) => x.chave === (s.abertura || '').slice(0, 10))
    if (b) b.qtd++
  }

  // indicadores
  const decididas = lista.filter((s) => s.autorizacao !== 'pendente').length
  const autorizadas = lista.filter((s) => s.autorizacao === 'sim').length
  const taxaAut = decididas ? Math.round((autorizadas / decididas) * 100) : 0

  const comValor = lista.filter((s) => s.valorSolicitado != null)
  const ticket = comValor.length
    ? comValor.reduce((a, s) => a + (s.valorSolicitado ?? 0), 0) / comValor.length
    : 0

  const pagos = lista.filter((s) => s.statusFinanceiro === 'Pago' && s.dataPagamento && s.abertura)
  const sla = pagos.length
    ? Math.round(
        pagos.reduce((a, s) => {
          const ini = new Date(s.abertura + 'T00:00:00').getTime()
          const fim = new Date(s.dataPagamento! + 'T00:00:00').getTime()
          return a + Math.max(0, (fim - ini) / 86400000)
        }, 0) / pagos.length,
      )
    : 0

  const porProc = new Map<string, number>()
  for (const s of lista) {
    const p = (s.procedimento || '').trim()
    if (p) porProc.set(p, (porProc.get(p) ?? 0) + 1)
  }
  const procTop = [...porProc.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  return {
    total: lista.length,
    etapas,
    totalAPagar,
    pagoNoMes,
    buckets,
    top,
    topBenef,
    dias,
    taxaAut,
    ticket,
    sla,
    procTop,
    ultimas: lista.slice(0, 6),
  }
}

export default function AdminCRMPainel() {
  const [papel, setPapel] = useState<PapelCRM | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [lista, setLista] = useState<SolicitacaoCRM[]>([])
  const [idsDoc, setIdsDoc] = useState<Set<string>>(new Set())
  const [periodo, setPeriodo] = useState<Periodo>('90')

  const recarregar = useCallback(async () => {
    const [dados, docs] = await Promise.all([listarSolicitacoes(), idsComDocumento()])
    setLista(dados)
    setIdsDoc(docs)
  }, [])

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const p = await meuPapel()
        if (!vivo) return
        setPapel(p)
        if (p) await recarregar()
      } catch (e) {
        if (vivo) setErro('Não foi possível carregar o painel: ' + String(e))
      } finally {
        if (vivo) setCarregando(false)
      }
    })()
    return () => {
      vivo = false
    }
  }, [recarregar])

  /* ---- tempo real: atualiza os números quando algo muda ---- */
  useEffect(() => {
    if (!papel) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const agendar = () => {
      clearTimeout(timer)
      timer = setTimeout(() => void recarregar(), 400)
    }
    const desassinar = assinarSolicitacoes(agendar)
    const aoFocar = () => void recarregar()
    window.addEventListener('focus', aoFocar)
    return () => {
      clearTimeout(timer)
      desassinar()
      window.removeEventListener('focus', aoFocar)
    }
  }, [papel, recarregar])

  const m = useMemo(() => calcular(lista.filter((s) => noPeriodo(s, periodo))), [lista, periodo])
  const alertas = useMemo(() => calcularAlertas(lista, idsDoc), [lista, idsDoc])

  if (carregando) return <p className="admin-info">Carregando painel…</p>

  if (!papel) {
    return (
      <div className="crm">
        <h2 className="admin-secao-titulo">Dashboard do CRM</h2>
        <p className="admin-info">Seu usuário ainda não tem um perfil no CRM.</p>
      </div>
    )
  }

  const maxEtapa = Math.max(1, ...Object.values(m.etapas))
  const maxMes = Math.max(1, ...m.buckets.map((b) => b.valor))
  const maxSolic = Math.max(1, ...m.top.map((t) => t.n))
  const maxBenef = Math.max(1, ...m.topBenef.map((t) => t.n))
  const maxDia = Math.max(1, ...m.dias.map((d) => d.qtd))

  const barra = (valor: number, max: number, cor: string) => (
    <span className="pnl-track">
      <span className="pnl-fill" style={{ width: `${(valor / max) * 100}%`, background: cor }} />
    </span>
  )

  return (
    <div className="crm pnl">
      <div className="crm-topo">
        <h2 className="admin-secao-titulo">Dashboard do CRM</h2>
        <div className="crm-topo-acoes">
          <div className="pnl-periodo" role="group" aria-label="Período">
            {PERIODOS.map((p) => (
              <button
                key={p.chave}
                type="button"
                className={periodo === p.chave ? 'on' : ''}
                onClick={() => setPeriodo(p.chave)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Link className="btn btn-ghost" to={ROUTES.adminCrm}>
            ← Voltar ao CRM
          </Link>
        </div>
      </div>

      {erro && (
        <p className="erro admin-erro" role="alert">
          {erro}
        </p>
      )}

      {/* KPIs */}
      <div className="pnl-kpis">
        <div className="pnl-kpi">
          <span className="pnl-kpi-lab">Solicitações no período</span>
          <span className="pnl-kpi-num">{m.total}</span>
        </div>
        <div className="pnl-kpi">
          <span className="pnl-kpi-lab">
            <span className="crm-badge tom-aguardando pnl-ponto" /> Aguardando enfermagem
          </span>
          <span className="pnl-kpi-num">{m.etapas.enfermagem}</span>
        </div>
        <div className="pnl-kpi">
          <span className="pnl-kpi-lab">
            <span className="crm-badge tom-aguardando pnl-ponto" /> Aguardando financeiro
          </span>
          <span className="pnl-kpi-num">{m.etapas.financeiro}</span>
        </div>
        <div className="pnl-kpi">
          <span className="pnl-kpi-lab">Total a pagar</span>
          <span className="pnl-kpi-num">{formatarValor(m.totalAPagar)}</span>
        </div>
        <div className="pnl-kpi">
          <span className="pnl-kpi-lab">
            <span className="crm-badge tom-ok pnl-ponto" /> Pago no mês
          </span>
          <span className="pnl-kpi-num">{formatarValor(m.pagoNoMes)}</span>
        </div>
      </div>

      <section className="pnl-card pnl-alertas">
        <h3>
          Alertas para revisão
          {alertas.length > 0 && <span className="pnl-alertas-n">{alertas.length}</span>}
        </h3>
        <p className="pnl-cap">Avisos automáticos — confira antes de pagar. Não bloqueia nada.</p>
        {alertas.length === 0 ? (
          <p className="crm-aviso">Nenhum alerta no momento.</p>
        ) : (
          <ul className="pnl-alertas-lista">
            {alertas.map((a, i) => (
              <li key={`${a.id}-${a.tipo}-${i}`}>
                <span className={`crm-badge pnl-alerta-tag t-${a.tipo}`}>
                  {ROTULO_ALERTA[a.tipo]}
                </span>
                <span className="pnl-alerta-txt">
                  <strong>{a.protocolo}</strong> · {a.beneficiario} — {a.motivo}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="pnl-grid">
        {/* por etapa */}
        <section className="pnl-card">
          <h3>Solicitações por etapa</h3>
          <p className="pnl-cap">Situação atual das {m.total} solicitações</p>
          <div className="pnl-hbars">
            <div className="pnl-hbar">
              <span className="pnl-n">Pago</span>
              {barra(m.etapas.pago, maxEtapa, 'var(--tom-ok)')}
              <span className="pnl-v">{m.etapas.pago}</span>
            </div>
            <div className="pnl-hbar">
              <span className="pnl-n">Pagamento agendado</span>
              {barra(m.etapas.agendado, maxEtapa, 'var(--tom-analise)')}
              <span className="pnl-v">{m.etapas.agendado}</span>
            </div>
            <div className="pnl-hbar">
              <span className="pnl-n">Aguardando financeiro</span>
              {barra(m.etapas.financeiro, maxEtapa, 'var(--tom-aguardando)')}
              <span className="pnl-v">{m.etapas.financeiro}</span>
            </div>
            <div className="pnl-hbar">
              <span className="pnl-n">Aguardando enfermagem</span>
              {barra(m.etapas.enfermagem, maxEtapa, 'var(--tom-aguardando)')}
              <span className="pnl-v">{m.etapas.enfermagem}</span>
            </div>
            <div className="pnl-hbar">
              <span className="pnl-n">Não autorizado</span>
              {barra(m.etapas.recusado, maxEtapa, 'var(--tom-recusado)')}
              <span className="pnl-v">{m.etapas.recusado}</span>
            </div>
          </div>
        </section>

        {/* valor pago por mês */}
        <section className="pnl-card">
          <h3>Valor pago por mês</h3>
          <p className="pnl-cap">Pagamentos quitados — últimos 6 meses</p>
          <div className="pnl-vbars">
            {m.buckets.map((b, i) => (
              <div key={b.chave} className={`pnl-vcol${i === m.buckets.length - 1 ? ' cur' : ''}`}>
                <span className="pnl-vv">{b.valor ? compacto(b.valor) : '—'}</span>
                <span
                  className="pnl-vbar"
                  style={{ height: `${Math.max(2, (b.valor / maxMes) * 100)}%` }}
                />
                <span className="pnl-m">{b.rotulo}</span>
              </div>
            ))}
          </div>
        </section>

        {/* por solicitante */}
        <section className="pnl-card">
          <h3>Solicitações por solicitante</h3>
          <p className="pnl-cap">Quem mais abriu solicitações</p>
          <div className="pnl-hbars">
            {m.top.length === 0 && <p className="crm-aviso">Sem dados no período.</p>}
            {m.top.map((t) => (
              <div className="pnl-hbar" key={t.nome}>
                <span className="pnl-n">{t.nome}</span>
                {barra(t.n, maxSolic, 'var(--blue-500)')}
                <span className="pnl-v">{t.n}</span>
              </div>
            ))}
          </div>
        </section>

        {/* beneficiários que mais solicitaram */}
        <section className="pnl-card">
          <h3>Beneficiários que mais solicitaram</h3>
          <p className="pnl-cap">Pacientes com mais solicitações</p>
          <div className="pnl-hbars">
            {m.topBenef.length === 0 && <p className="crm-aviso">Sem dados no período.</p>}
            {m.topBenef.map((t) => (
              <div className="pnl-hbar" key={t.nome}>
                <span className="pnl-n">{t.nome}</span>
                {barra(t.n, maxBenef, 'var(--blue-400)')}
                <span className="pnl-v">{t.n}</span>
              </div>
            ))}
          </div>
        </section>

        {/* solicitações por dia */}
        <section className="pnl-card">
          <h3>Solicitações por dia</h3>
          <p className="pnl-cap">Abertas por dia — últimos 14 dias</p>
          <div className="pnl-vbars dia">
            {m.dias.map((d, i) => (
              <div key={d.chave} className={`pnl-vcol${i === m.dias.length - 1 ? ' cur' : ''}`}>
                <span className="pnl-vv">{d.qtd || ''}</span>
                <span
                  className="pnl-vbar"
                  style={{ height: `${d.qtd ? Math.max(3, (d.qtd / maxDia) * 100) : 0}%` }}
                />
                <span className="pnl-m">{d.rotulo}</span>
              </div>
            ))}
          </div>
        </section>

        {/* indicadores */}
        <section className="pnl-card">
          <h3>Indicadores</h3>
          <p className="pnl-cap">Desempenho do período</p>
          <div className="pnl-inds">
            <div className="pnl-ind">
              <span>Tempo médio abertura → pagamento</span>
              <strong>{m.sla} dias</strong>
            </div>
            <div className="pnl-ind">
              <span>Taxa de autorização</span>
              <strong>{m.taxaAut}%</strong>
            </div>
            <div className="pnl-ind">
              <span>Ticket médio</span>
              <strong>{formatarValor(m.ticket)}</strong>
            </div>
            <div className="pnl-ind">
              <span>Procedimento mais solicitado</span>
              <strong className="pnl-ind-proc">{m.procTop}</strong>
            </div>
          </div>
        </section>
      </div>

      {/* últimas solicitações */}
      <section className="pnl-card pnl-tabela">
        <h3>Últimas solicitações</h3>
        <p className="pnl-cap">Movimentações recentes</p>
        <div className="admin-tabela-wrap">
          <table className="admin-tabela crm-tabela">
            <thead>
              <tr>
                <th>Protocolo</th>
                <th>Paciente</th>
                <th>Procedimento</th>
                <th>Valor</th>
                <th>Etapa</th>
              </tr>
            </thead>
            <tbody>
              {m.ultimas.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-td-vazio">
                    Sem solicitações no período.
                  </td>
                </tr>
              )}
              {m.ultimas.map((s) => {
                const et = etapaAtual(s)
                return (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.protocolo}</strong>
                    </td>
                    <td>
                      <strong>{s.beneficiario}</strong>
                      <small>{s.solicitante}</small>
                    </td>
                    <td>{s.procedimento}</td>
                    <td>{formatarValor(s.valorSolicitado)}</td>
                    <td>
                      <span className={`crm-badge tom-${et.tom}`}>{et.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
