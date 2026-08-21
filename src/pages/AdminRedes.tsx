import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChevronRight, Search } from 'lucide-react'
import {
  carregarPrestadoresRede,
  cidadesDe,
  construirDashboardPorCidade,
  excluirPrestadorRede,
  salvarPrestadorRede,
  type DashboardCidade,
  type PrestadorRede,
  type PrestadorRedeInput,
} from '../data/redeDashboardRepo'
import './adminRedes.css'

/* ====================== helpers ====================== */

const CORES = ['#0f5257', '#2ea96a', '#7c6fd6', '#2f6fac', '#b5651d', '#d98a2b']

/** Cores conhecidas para os status mais comuns; qualquer status novo cai num
 * ciclo de cores (nunca fica sem preencher, diferente da versão anterior). */
const CORES_STATUS: Record<string, string> = {
  Ativo: '#2ea96a',
  Pendente: '#d98a2b',
  Descredenciado: '#d0563f',
  'Em reforma': '#7c6fd6',
  'Não listado': '#61736d',
  'Prestador em mudança': '#2f6fac',
  'Contrato não assinado': '#b5651d',
}

const corDoStatus = (status: string, indexFallback: number) =>
  CORES_STATUS[status] ?? CORES[indexFallback % CORES.length]

/** Vira classe CSS ASCII (sem acento), ex.: "Não listado" -> "nao-listado". */
const classeDoStatus = (status: string) =>
  status
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const integer = (value: number) => value.toLocaleString('pt-BR')

/** Aceita "70", "70,50" ou "1.234,56" (padrão BR). Só trata "." como milhar
 * quando há vírgula decimal também — senão "70.5" digitado com ponto vira 70.5,
 * não 705. */
const parseValor = (texto: string): number => {
  const limpo = texto.trim()
  if (!limpo) return NaN
  const normalizado = limpo.includes(',')
    ? limpo.replace(/\./g, '').replace(',', '.')
    : limpo
  return Number(normalizado)
}

/* ====================== subcomponentes de exibição ====================== */

function Kpis({ dash }: { dash: DashboardCidade }) {
  const ativos = dash.status.find(([s]) => s === 'Ativo')?.[1] || 0
  const itens: [number, string, string?][] = [
    [dash.meta.total, 'Prestadores na rede'],
    [dash.meta.servicosDistintos, 'Serviços distintos'],
    [dash.meta.totalProcedimentos, 'Procedimentos cadastrados'],
    [ativos, 'Contratos ativos', `${Math.max(dash.meta.total - ativos, 0)} com pendência`],
  ]
  return (
    <div className="rd-kpis">
      {itens.map(([valor, label, sub]) => (
        <article className="rd-kpi" key={label}>
          <strong>{integer(valor)}</strong>
          <span>{label}</span>
          {sub && <small>{sub}</small>}
        </article>
      ))}
    </div>
  )
}

function ExecutiveReadout({ dash }: { dash: DashboardCidade }) {
  const ativos = dash.status.find(([s]) => s === 'Ativo')?.[1] || 0
  const maiorConcentracao = [...dash.providers].sort((a, b) => b.n - a.n)[0]
  const densidadeMedia = dash.meta.total
    ? Math.round(dash.meta.totalProcedimentos / dash.meta.total)
    : 0
  const taxaAtiva = dash.meta.total ? Math.round((ativos / dash.meta.total) * 100) : 0
  const maiorPreco = dash.providers.reduce<DashboardCidade['providers'][number] | null>(
    (top, p) => (p.max > (top?.max ?? -Infinity) ? p : top),
    null,
  )

  return (
    <section className="rd-readout">
      <div className="rd-readout-lead">
        <span className="rd-eyebrow">Leitura executiva</span>
        <strong>{taxaAtiva}% da rede ativa</strong>
        <p>Visão rápida para priorização da operação e negociação.</p>
      </div>
      <div className="rd-readout-stat">
        <span>Concentração</span>
        <strong>{integer(maiorConcentracao?.n ?? 0)}</strong>
        <small>{maiorConcentracao?.nome || 'Sem dados'} lidera em itens</small>
      </div>
      <div className="rd-readout-stat">
        <span>Densidade média</span>
        <strong>{integer(densidadeMedia)}</strong>
        <small>itens mapeados por prestador</small>
      </div>
      <div className="rd-readout-stat">
        <span>Maior valor da rede</span>
        <strong>{maiorPreco ? money(maiorPreco.max) : '-'}</strong>
        <small>{maiorPreco?.nome || 'Sem dados'}</small>
      </div>
    </section>
  )
}

function Distribution({
  dash,
  categoria,
  setCategoria,
}: {
  dash: DashboardCidade
  categoria: string
  setCategoria: (v: string) => void
}) {
  const data = Object.entries(dash.macro)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }))
  const altura = Math.max(200, data.length * 46)

  return (
    <section className="rd-card">
      <div className="rd-section-heading">
        <div>
          <h3>Distribuição por tipo de serviço</h3>
          <p>Clique numa categoria para filtrar a lista</p>
        </div>
        <span className="rd-section-number">{integer(dash.meta.total)}</span>
      </div>
      <div className="rd-chart-wrap" style={{ minHeight: altura }}>
        <ResponsiveContainer width="100%" height={altura}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 12, left: 12, bottom: 4 }}
            barCategoryGap={12}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={145}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#61736d', fontSize: 12 }}
            />
            <Tooltip cursor={{ fill: '#edf4f9' }} formatter={(v: number) => [integer(v), 'Prestadores']} />
            <Bar
              dataKey="value"
              radius={[0, 6, 6, 0]}
              onClick={(entry: { name: string }) =>
                setCategoria(categoria === entry.name ? '' : entry.name)
              }
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={categoria === entry.name ? '#0a3a3e' : CORES[index % CORES.length]}
                  cursor="pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function StatusCard({
  dash,
  status,
  setStatus,
}: {
  dash: DashboardCidade
  status: string
  setStatus: (v: string) => void
}) {
  const total = dash.status.reduce((s, [, v]) => s + v, 0)
  const data = dash.status.map(([name, value]) => ({ name, value }))

  return (
    <section className="rd-card">
      <div className="rd-section-heading">
        <div>
          <h3>Situação da rede</h3>
          <p>Clique num status para filtrar</p>
        </div>
      </div>
      <div className="rd-status-layout">
        <div className="rd-donut">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={70}
                paddingAngle={2}
                onClick={(entry: { name: string }) =>
                  setStatus(status === entry.name ? '' : entry.name)
                }
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={corDoStatus(entry.name, index)} cursor="pointer" />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [integer(v), 'Prestadores']} />
            </PieChart>
          </ResponsiveContainer>
          <div>
            <strong>{integer(status ? dash.status.find(([l]) => l === status)?.[1] || 0 : total)}</strong>
            <small>{status || 'prestadores'}</small>
          </div>
        </div>
        <div className="rd-legend">
          {dash.status.map(([label, value], index) => (
            <button
              key={label}
              className={status === label ? 'active' : ''}
              onClick={() => setStatus(status === label ? '' : label)}
            >
              <i style={{ background: corDoStatus(label, index) }} />
              <span>{label}</span>
              <strong>{integer(value)}</strong>
              <small>{total ? Math.round((value / total) * 100) : 0}%</small>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProviderCard({
  item,
  aberto,
  onToggle,
  onEditar,
  onExcluir,
}: {
  item: DashboardCidade['providers'][number]
  aberto: boolean
  onToggle: () => void
  onEditar: () => void
  onExcluir: () => void
}) {
  return (
    <article className={`rd-provider${aberto ? ' open' : ''}`}>
      <button className="rd-provider-head" onClick={onToggle}>
        <ChevronRight />
        <span className="rd-provider-name">
          <strong>{item.nome}</strong>
          <small>{item.servico || item.nome}</small>
        </span>
        <span className="rd-tag">{item.macro}</span>
        <span className={`rd-state ${classeDoStatus(item.status)}`}>
          <i />
          {item.status}
        </span>
        <span className="rd-provider-count">
          {integer(item.n)}
          <small>itens</small>
        </span>
        <span className="rd-provider-range">
          {item.n ? `${money(item.min)} - ${money(item.max)}` : '-'}
        </span>
      </button>
      {aberto && (
        <div className="rd-provider-body">
          <div className="rd-provider-actions">
            <button type="button" className="admin-link" onClick={onEditar}>
              Editar
            </button>
            <button type="button" className="admin-link admin-link-danger" onClick={onExcluir}>
              Excluir
            </button>
          </div>
          {item.procedimentos.length ? (
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {item.procedimentos.map((row, index) => (
                  <tr key={row.id ?? index}>
                    <td className="rd-code">{row.codigo || '-'}</td>
                    <td>{row.descricao}</td>
                    <td className="rd-value">{money(row.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="rd-hint">Nenhum procedimento cadastrado ainda.</p>
          )}
        </div>
      )}
    </article>
  )
}

/* ====================== formulário (cria/edita prestador de rede) ====================== */

type ProcedimentoFormRow = { id?: string; codigo: string; descricao: string; valor: string }
type FormState = {
  id?: string
  cidade: string
  nome: string
  servico: string
  macro: string
  status: string
  sheet: string
  procedimentos: ProcedimentoFormRow[]
}

const formVazio = (cidade: string): FormState => ({
  cidade,
  nome: '',
  servico: '',
  macro: '',
  status: 'Pendente',
  sheet: '',
  procedimentos: [],
})

const formDoPrestador = (p: PrestadorRede): FormState => ({
  id: p.id,
  cidade: p.cidade,
  nome: p.nome,
  servico: p.servico ?? '',
  macro: p.macro,
  status: p.status,
  sheet: p.sheet ?? '',
  procedimentos: p.procedimentos.map((x) => ({
    id: x.id,
    codigo: x.codigo ?? '',
    descricao: x.descricao,
    valor: String(x.valor).replace('.', ','),
  })),
})

const prestadorDoForm = (f: FormState): PrestadorRedeInput => ({
  id: f.id,
  cidade: f.cidade.trim(),
  nome: f.nome.trim(),
  servico: f.servico.trim() || undefined,
  macro: f.macro.trim(),
  status: f.status.trim(),
  sheet: f.sheet.trim() || undefined,
  procedimentos: f.procedimentos
    .filter((p) => p.descricao.trim())
    .map((p) => ({
      id: p.id,
      codigo: p.codigo.trim() || undefined,
      descricao: p.descricao.trim(),
      valor: parseValor(p.valor),
    })),
})

/* ====================== página ====================== */

export default function AdminRedes() {
  const [prestadores, setPrestadores] = useState<PrestadorRede[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [cidade, setCidade] = useState('')
  const [categoria, setCategoria] = useState('')
  const [status, setStatus] = useState('')
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState<string | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [salvando, setSalvando] = useState(false)

  const cidades = useMemo(() => cidadesDe(prestadores), [prestadores])

  const recarregar = () => {
    setCarregando(true)
    setErro('')
    carregarPrestadoresRede()
      .then((lista) => {
        setPrestadores(lista)
        setCidade((atual) => atual || cidadesDe(lista)[0] || '')
      })
      .catch((e) => setErro(String(e)))
      .finally(() => setCarregando(false))
  }

  useEffect(recarregar, [])

  const dash = useMemo(
    () => (cidade ? construirDashboardPorCidade(prestadores, cidade) : null),
    [prestadores, cidade],
  )

  const trocarCidade = (novaCidade: string) => {
    setCidade(novaCidade)
    setCategoria('')
    setStatus('')
    setBusca('')
    setAberto(null)
  }

  const filtrados = useMemo(() => {
    if (!dash) return []
    const termo = busca.trim().toLowerCase()
    return dash.providers.filter(
      (p) =>
        (!categoria || p.macro === categoria) &&
        (!status || p.status === status) &&
        (!termo ||
          `${p.nome} ${p.servico ?? ''} ${p.macro}`.toLowerCase().includes(termo)),
    )
  }, [dash, categoria, status, busca])

  const salvar = async (e: FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSalvando(true)
    setErro('')
    try {
      await salvarPrestadorRede(prestadorDoForm(form))
      setForm(null)
      recarregar()
    } catch (err) {
      setErro('Não foi possível salvar: ' + String(err))
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (p: PrestadorRede) => {
    if (!confirm(`Excluir "${p.nome}" e todos os seus procedimentos?`)) return
    try {
      await excluirPrestadorRede(p.id)
      recarregar()
    } catch (err) {
      setErro('Não foi possível excluir: ' + String(err))
    }
  }

  const alterarLinha = (index: number, campo: keyof ProcedimentoFormRow, valor: string) =>
    setForm((f) => {
      if (!f) return f
      const procedimentos = [...f.procedimentos]
      procedimentos[index] = { ...procedimentos[index], [campo]: valor }
      return { ...f, procedimentos }
    })

  const adicionarLinha = () =>
    setForm((f) =>
      f ? { ...f, procedimentos: [...f.procedimentos, { codigo: '', descricao: '', valor: '' }] } : f,
    )

  const removerLinha = (index: number) =>
    setForm((f) =>
      f ? { ...f, procedimentos: f.procedimentos.filter((_, i) => i !== index) } : f,
    )

  return (
    <div className="rd-dashboard">
      <div className="rd-toolbar">
        <div>
          <h2>Dashboard de Redes</h2>
          <p>Panorama da rede negociada, especialidades e ficha completa de cada prestador</p>
        </div>
        {cidades.length > 0 && (
          <label className="rd-city-picker">
            Cidade
            <select value={cidade} onChange={(e) => trocarCidade(e.target.value)}>
              {cidades.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {erro && (
        <p className="erro admin-erro" role="alert">
          {erro}
        </p>
      )}

      {carregando ? (
        <p className="admin-info">Carregando…</p>
      ) : !dash || !dash.meta.total ? (
        <div className="rd-card">
          <p className="rd-empty">
            Nenhum prestador cadastrado ainda{cidade ? ` em ${cidade}` : ''}.
          </p>
          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setForm(formVazio(cidade || 'Ariquemes'))}
            >
              + Novo prestador
            </button>
          </div>
        </div>
      ) : (
        <>
          <Kpis dash={dash} />
          <ExecutiveReadout dash={dash} />
          <div className="rd-overview">
            <Distribution dash={dash} categoria={categoria} setCategoria={setCategoria} />
            <StatusCard dash={dash} status={status} setStatus={setStatus} />
          </div>

          <section className="rd-card rd-providers">
            <div className="rd-controls">
              <label className="rd-search">
                <Search />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar prestador ou serviço…"
                />
              </label>
              <span className="rd-result-count">{filtrados.length} encontrados</span>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setForm(formVazio(cidade))}
              >
                + Novo prestador
              </button>
            </div>
            <p className="rd-hint">
              <ChevronRight /> Clique num prestador para ver ou editar a ficha completa.
            </p>
            <div className="rd-table-head">
              <span />
              <span>Prestador</span>
              <span>Serviço</span>
              <span>Status</span>
              <span>Itens</span>
              <span>Faixa (R$)</span>
            </div>
            {filtrados.map((item) => (
              <ProviderCard
                key={item.id}
                item={item}
                aberto={aberto === item.id}
                onToggle={() => setAberto(aberto === item.id ? null : item.id)}
                onEditar={() => setForm(formDoPrestador(item))}
                onExcluir={() => excluir(item)}
              />
            ))}
            {!filtrados.length && <p className="rd-empty">Nenhum prestador encontrado com esses filtros.</p>}
          </section>
        </>
      )}

      {/* ---------- Modal do formulário (reaproveita o CSS do admin-modal) ---------- */}
      {form && (
        <div
          className="admin-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setForm(null)}
        >
          <form className="admin-form" onSubmit={salvar}>
            <h2>{form.id ? 'Editar prestador de rede' : 'Novo prestador de rede'}</h2>

            <div className="admin-form-linha">
              <div className="campo">
                <label htmlFor="rcidade">Cidade *</label>
                <input
                  id="rcidade"
                  list="rd-cidades"
                  value={form.cidade}
                  onChange={(e) => setForm((f) => (f ? { ...f, cidade: e.target.value } : f))}
                  required
                />
                <datalist id="rd-cidades">
                  {cidades.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="campo">
                <label htmlFor="rstatus">Status *</label>
                <input
                  id="rstatus"
                  list="rd-status"
                  value={form.status}
                  onChange={(e) => setForm((f) => (f ? { ...f, status: e.target.value } : f))}
                  required
                />
                <datalist id="rd-status">
                  {Object.keys(CORES_STATUS).map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="campo">
              <label htmlFor="rnome">Nome *</label>
              <input
                id="rnome"
                value={form.nome}
                onChange={(e) => setForm((f) => (f ? { ...f, nome: e.target.value } : f))}
                required
              />
            </div>

            <div className="admin-form-linha">
              <div className="campo">
                <label htmlFor="rservico">Serviço</label>
                <input
                  id="rservico"
                  value={form.servico}
                  onChange={(e) => setForm((f) => (f ? { ...f, servico: e.target.value } : f))}
                />
              </div>
              <div className="campo">
                <label htmlFor="rmacro">
                  Categoria (macro) <small>(usada no gráfico de distribuição)</small>
                </label>
                <input
                  id="rmacro"
                  list="rd-macros"
                  value={form.macro}
                  onChange={(e) => setForm((f) => (f ? { ...f, macro: e.target.value } : f))}
                  required
                />
                <datalist id="rd-macros">
                  {[...new Set(prestadores.map((p) => p.macro))].map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="campo">
              <label>
                Procedimentos <small>(código, descrição e valor de cada item negociado)</small>
              </label>
              <div className="rd-proc-list">
                {form.procedimentos.map((row, index) => (
                  <div className="rd-proc-row" key={index}>
                    <input
                      placeholder="Código"
                      value={row.codigo}
                      onChange={(e) => alterarLinha(index, 'codigo', e.target.value)}
                    />
                    <input
                      placeholder="Descrição"
                      value={row.descricao}
                      onChange={(e) => alterarLinha(index, 'descricao', e.target.value)}
                    />
                    <input
                      placeholder="Valor (R$)"
                      inputMode="decimal"
                      value={row.valor}
                      onChange={(e) => alterarLinha(index, 'valor', e.target.value)}
                    />
                    <button
                      type="button"
                      className="rd-proc-remover"
                      aria-label="Remover procedimento"
                      onClick={() => removerLinha(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-ghost" onClick={adicionarLinha}>
                + Adicionar procedimento
              </button>
            </div>

            <div className="admin-form-acoes">
              <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={salvando}>
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
