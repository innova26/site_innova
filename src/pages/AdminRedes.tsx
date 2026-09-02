import { useMemo, useState } from 'react'
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
import { ChevronRight, Search, X } from 'lucide-react'
import { carregarPrestadoresRedeEstatico } from '../data/redeDashboardEstatico'
import {
  cidadesDe,
  construirDashboardPorCidade,
  type BlocoFicha,
  type DashboardCidade,
  type LinhaFicha,
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

/* -------- parser das notas de composição de pacote --------
 * As notas vêm da planilha como um parágrafo corrido ("COMPREENDE: … NÃO
 * COMPREENDE: … IMPORTANTE: …"). Aqui elas viram seções com título e lista,
 * pra virar algo legível. É heurístico e conservador: na dúvida, mantém o
 * texto como parágrafo em vez de quebrar frase no lugar errado. */

type SecaoNota = { titulo?: string; itens: string[] }

const TEM_MINUSCULA = /[a-zß-öø-ÿ]/
/** Rótulos conhecidos que aparecem em Title-case no meio do texto. */
const RE_ROTULO_CONHECIDO =
  /^(?:n[ãa]o\s+)?(?:compreende|inclui|composi[çc][ãa]o|importante|obs(?:erva[çc][ãa]o)?|itens\s+(?:inclusos|exclusos))\s*:$/i
/** Divisor: rótulo em CAIXA ALTA terminado em ":" OU rótulo conhecido. */
const RE_ROTULO =
  /([A-Z0-9À-Þ][A-Z0-9À-Þ()/.–\- ]*?[A-ZÀ-Þ]:|(?:N[ãa]o\s+)?(?:Compreende|Inclui|Composi[çc][ãa]o|Importante|Obs(?:erva[çc][ãa]o)?|Itens\s+(?:[Ii]nclusos|[Ee]xclusos)):)/g

const ehRotulo = (parte: string) => {
  if (!parte.endsWith(':')) return false
  if (RE_ROTULO_CONHECIDO.test(parte.trim())) return true
  const corpo = parte.replace(/:$/, '').trim()
  return corpo.length >= 3 && !TEM_MINUSCULA.test(corpo) && /[A-ZÀ-Þ]$/.test(corpo)
}

const limparItem = (item: string) =>
  item.replace(/^[\s\-–;:.]+/, '').replace(/[\s;.,]+$/, '').trim()

/** Quebra um trecho em itens: por travessão/ponto-e-vírgula, ou por vírgula
 * só quando é claramente uma lista curta (evita picar frases de prosa). */
const emItens = (seg: string): string[] => {
  const s = limparItem(seg)
  if (!s) return []
  if (/\s[-–]\s+|;\s+/.test(s))
    return s.split(/\s[-–]\s+|;\s+/).map(limparItem).filter(Boolean)
  const partes = s.split(/,\s*(?!\d)/).map(limparItem).filter(Boolean)
  if (partes.length >= 3 && partes.every((p) => p.split(/\s+/).length <= 3)) return partes
  return [s]
}

const parseComposicao = (nota: string): SecaoNota[] => {
  let texto = nota.replace(/\s+/g, ' ').trim()
  const secoes: SecaoNota[] = []

  const abertura = texto.match(/^([^.\-–]{2,45}?):\s+/)
  if (abertura && !/,/.test(abertura[1])) {
    secoes.push({ titulo: abertura[1].trim(), itens: [] })
    texto = texto.slice(abertura[0].length)
  } else {
    // título de abertura em CAIXA ALTA com travessão, sem ":" (ex.:
    // "COMPOSIÇÃO - TAXA CIRÚRGICA POR PORTE" antes de "Compreende:")
    const caps = texto.match(/^([A-Z0-9À-Þ][A-Z0-9À-Þ()/.%–\- ]*?[A-ZÀ-Þ])\s+(?=[A-ZÀ-Þ]?[a-zß-öø-ÿ])/)
    if (caps && caps[1].length >= 6 && /[-–]/.test(caps[1])) {
      secoes.push({ titulo: caps[1].trim(), itens: [] })
      texto = texto.slice(caps[0].length)
    }
  }

  for (const parte of texto.split(RE_ROTULO)) {
    if (!parte || !parte.trim()) continue
    if (ehRotulo(parte)) {
      secoes.push({ titulo: parte.replace(/:$/, '').trim(), itens: [] })
    } else {
      const itens = emItens(parte)
      const ultima = secoes[secoes.length - 1]
      if (ultima && ultima.titulo && ultima.itens.length === 0) ultima.itens = itens
      else if (itens.length) secoes.push({ itens })
    }
  }
  return secoes.filter((s) => s.titulo || s.itens.length)
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
              width={158}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#61736d', fontSize: 13 }}
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

/** Valor da coluna: preço vira moeda; texto (especialidade, nome de tabela)
 * fica como está; vazio some. Espelha a planilha original. */
const valorFicha = (valor: LinhaFicha['valor']) =>
  typeof valor === 'number' ? money(valor) : valor || ''

function NotaComposicao({ texto }: { texto: string }) {
  const secoes = parseComposicao(texto)
  if (!secoes.length) return <p className="rd-ficha-nota">{texto}</p>
  return (
    <div className="rd-ficha-nota">
      {secoes.map((secao, i) => (
        <div className="rd-nota-secao" key={i}>
          {secao.titulo && <span className="rd-nota-titulo">{secao.titulo}</span>}
          {secao.itens.length === 1 ? (
            <p>{secao.itens[0]}</p>
          ) : secao.itens.length > 1 ? (
            <ul>
              {secao.itens.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function FichaBlocos({ ficha }: { ficha: BlocoFicha[] }) {
  return (
    <div className="rd-ficha">
      {ficha.map((bloco, index) => {
        if (bloco.tipo === 'titulo')
          return (
            <h4 className="rd-ficha-titulo" key={index}>
              {bloco.texto}
            </h4>
          )
        if (bloco.tipo === 'nota') return <NotaComposicao key={index} texto={bloco.texto} />
        // Tabela multi-coluna (ex.: IOT-RO — Porte/Auxiliar/Apartamento/
        // Enfermaria; ENDOGASTRO — pacote/códigos inclusos/valor): cada linha
        // traz as células já alinhadas às colunas. O tipo de cada coluna é
        // deduzido dos dados: coluna de VALOR (tem número → alinha à direita,
        // vira moeda) e coluna de CÓDIGO (só dígitos, ex.: TUSS empilhados →
        // fonte monoespaçada). O resto é texto normal.
        const multiColuna = bloco.linhas.some((linha) => linha.celulas)
        if (multiColuna) {
          const dados = bloco.linhas.filter((linha) => !linha.cabecalho)
          const colValor = bloco.colunas.map((_, c) =>
            dados.some((linha) => typeof linha.celulas?.[c] === 'number'),
          )
          const colCodigo = bloco.colunas.map((_, c) => {
            const vals = dados
              .map((linha) => linha.celulas?.[c])
              .filter((v) => v != null && v !== '')
            return (
              vals.length > 0 &&
              vals.every((v) => typeof v === 'string' && /^[\d\s]+$/.test(v))
            )
          })
          return (
            <div className="rd-ficha-tabela rd-ficha-tabela--larga" key={index}>
              <table>
                <thead>
                  <tr>
                    {bloco.colunas.map((coluna, c) => (
                      <th key={c} className={colValor[c] ? 'rd-value' : undefined}>
                        {coluna}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bloco.linhas.map((linha, l) => {
                    const celulas = linha.celulas ?? []
                    const Cell = linha.cabecalho ? 'th' : 'td'
                    return (
                      <tr key={l} className={linha.cabecalho ? 'rd-linha-cabecalho' : undefined}>
                        {bloco.colunas.map((_, c) => {
                          const v = celulas[c]
                          const classe = colValor[c]
                            ? 'rd-value'
                            : !linha.cabecalho && colCodigo[c]
                              ? 'rd-code'
                              : undefined
                          return (
                            <Cell key={c} className={classe}>
                              {typeof v === 'number' ? money(v) : v || ''}
                            </Cell>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        }
        // Quando a coluna de código está vazia em todas as linhas (ex.: corpo
        // clínico — médico não tem código), ela vira só ruído; some com ela.
        // Só nas tabelas no formato padrão código/descrição/valor (3 colunas).
        const semCodigo =
          bloco.colunas.length === 3 && bloco.linhas.every((linha) => !linha.codigo)
        const colunas = semCodigo ? bloco.colunas.slice(1) : bloco.colunas
        return (
          <div className="rd-ficha-tabela" key={index}>
            <table>
              <thead>
                <tr>
                  {colunas.map((coluna, c) => (
                    <th key={c} className={c === colunas.length - 1 ? 'rd-value' : undefined}>
                      {coluna}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bloco.linhas.map((linha, l) =>
                  linha.cabecalho ? (
                    <tr key={l} className="rd-linha-cabecalho">
                      {!semCodigo && <th>{linha.codigo || ''}</th>}
                      <th>{linha.descricao || ''}</th>
                      <th className="rd-value">
                        {typeof linha.valor === 'string' ? linha.valor : ''}
                      </th>
                    </tr>
                  ) : (
                    <tr key={l}>
                      {!semCodigo && <td className="rd-code">{linha.codigo || ''}</td>}
                      <td>{linha.descricao || ''}</td>
                      <td className="rd-value">{valorFicha(linha.valor)}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}

function ProviderCard({
  item,
  aberto,
  onToggle,
}: {
  item: DashboardCidade['providers'][number]
  aberto: boolean
  onToggle: () => void
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
          {item.cadastro && (item.cadastro.razao || item.cadastro.cnpj || item.cadastro.cep) && (
            <dl className="rd-cadastro">
              {item.cadastro.razao && (
                <div>
                  <dt>Razão social</dt>
                  <dd>{item.cadastro.razao}</dd>
                </div>
              )}
              {item.cadastro.cnpj && (
                <div>
                  <dt>CNPJ</dt>
                  <dd>{item.cadastro.cnpj}</dd>
                </div>
              )}
              {item.cadastro.cep && (
                <div>
                  <dt>CEP</dt>
                  <dd>{item.cadastro.cep}</dd>
                </div>
              )}
            </dl>
          )}
          {item.ficha?.length ? (
            <FichaBlocos ficha={item.ficha} />
          ) : item.procedimentos.length ? (
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descrição</th>
                  <th className="rd-value">Valor</th>
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

/* ====================== página ====================== */

export default function AdminRedes() {
  const [prestadores] = useState(() => carregarPrestadoresRedeEstatico())
  const [cidade, setCidade] = useState(() => cidadesDe(prestadores)[0] ?? '')
  const [categoria, setCategoria] = useState('')
  const [status, setStatus] = useState('')
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState<string | null>(null)

  const cidades = useMemo(() => cidadesDe(prestadores), [prestadores])

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
        (!termo || `${p.nome} ${p.servico ?? ''} ${p.macro}`.toLowerCase().includes(termo)),
    )
  }, [dash, categoria, status, busca])

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

      {!dash || !dash.meta.total ? (
        <div className="rd-card">
          <p className="rd-empty">Nenhum prestador cadastrado ainda{cidade ? ` em ${cidade}` : ''}.</p>
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
                {busca && (
                  <button
                    type="button"
                    className="rd-search-clear"
                    onClick={() => setBusca('')}
                    aria-label="Limpar busca"
                  >
                    <X />
                  </button>
                )}
              </label>
              <span className="rd-result-count">{filtrados.length} encontrados</span>
            </div>
            <p className="rd-hint">
              <ChevronRight /> Clique num prestador para ver a ficha completa.
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
              />
            ))}
            {!filtrados.length && <p className="rd-empty">Nenhum prestador encontrado com esses filtros.</p>}
          </section>
        </>
      )}
    </div>
  )
}
