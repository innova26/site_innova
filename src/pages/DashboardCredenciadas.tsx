import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigurado } from '../lib/supabase'
import {
  DISTRIBUICAO_ITENS_CATALOGO,
  DISTRIBUICAO_PRESTADORES,
  SITUACAO_REDE,
  STATS,
  TODOS_PRESTADORES,
  TOP_POR_VALOR,
  type CategoriaServico,
  type PrestadorDash,
  type StatusRede,
} from '../data/dashboardCredenciadasMock'

const CATEGORIAS: CategoriaServico[] = DISTRIBUICAO_PRESTADORES.map((d) => d.categoria)

const fmtInt = (n: number) => n.toLocaleString('pt-BR')
const fmtBRL = (n: number) =>
  'R$ ' + n.toLocaleString('pt-BR', { maximumFractionDigits: n % 1 === 0 ? 0 : 2 })

function statusCor(status: StatusRede): string {
  if (status === 'Ativo') return '#1f9d6e'
  if (status === 'Descredenciado') return '#d9534f'
  return '#e0902f'
}

/* ====================== Login (gate reaproveitado do /admin) ====================== */
function OlhoIcone({ aberto }: { aberto: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      {!aberto && (
        <path d="M4 4l16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      )}
    </svg>
  )
}

function LoginPainel() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)

  const entrar = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    setEntrando(true)
    const { error } = await supabase!.auth.signInWithPassword({ email, password: senha })
    setEntrando(false)
    if (error) setErro('E-mail ou senha inválidos.')
  }

  return (
    <section className="admin-login">
      <form className="admin-login-card" onSubmit={entrar}>
        <h1>Dashboard · Credenciadas</h1>
        <p className="admin-login-sub">Acesso restrito à equipe Innova.</p>

        <div className="campo">
          <label htmlFor="dc-email">E-mail</label>
          <input
            id="dc-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="dc-senha">Senha</label>
          <div className="campo-senha">
            <input
              id="dc-senha"
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            <button
              type="button"
              className="olho-btn"
              onClick={() => setMostrarSenha((v) => !v)}
              aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={mostrarSenha}
            >
              <OlhoIcone aberto={mostrarSenha} />
            </button>
          </div>
        </div>

        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}

        <button type="submit" className="btn btn-primary form-enviar" disabled={entrando}>
          {entrando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </section>
  )
}

/* ====================== Painel principal ====================== */
function Painel({ sessao }: { sessao: Session }) {
  const [modoDistribuicao, setModoDistribuicao] = useState<'prestadores' | 'itens'>('prestadores')
  const [filtroStatus, setFiltroStatus] = useState<StatusRede | 'todos'>('todos')
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaServico | 'todos'>('todos')
  const [busca, setBusca] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)

  const distribuicao = modoDistribuicao === 'prestadores' ? DISTRIBUICAO_PRESTADORES : DISTRIBUICAO_ITENS_CATALOGO
  const maxDistribuicao = Math.max(...distribuicao.map((d) => d.valor))
  const maxTopValor = Math.max(...TOP_POR_VALOR.map((p) => p.faixaMax))

  const listaFiltrada = useMemo(() => {
    const t = busca.trim().toLowerCase()
    return TODOS_PRESTADORES.filter((p) => {
      if (filtroStatus !== 'todos' && p.status !== filtroStatus) return false
      if (filtroCategoria !== 'todos' && p.categoria !== filtroCategoria) return false
      if (!t) return true
      return [p.nome, p.instituicao, p.servico].join(' ').toLowerCase().includes(t)
    })
  }, [busca, filtroStatus, filtroCategoria])

  return (
    <section className="admin dcx">
      <div className="shell">
        <header className="dcx-topo">
          <div className="dcx-logo-bloco">
            <span className="dcx-logo-icone" aria-hidden="true">
              ⊕
            </span>
            <div>
              <p className="dcx-eyebrow">INNOVA · NATIVA SAÚDE</p>
              <h1 className="page-title admin-titulo">Rede Credenciada — Porto Velho</h1>
              <p className="dcx-sub">Panorama da rede, especialidades e ficha completa de cada prestador</p>
            </div>
          </div>
          <div className="dcx-topo-direita">
            <p className="dcx-base-analisada">
              Base analisada
              <br />
              <strong>{fmtInt(STATS.prestadores)} prestadores mapeados</strong>
            </p>
            <button type="button" className="btn btn-ghost" onClick={() => supabase!.auth.signOut()}>
              Sair
            </button>
          </div>
        </header>

        <p className="dcx-usuario">{sessao.user.email} · dados mockados para visualização de layout</p>

        {/* -------- cartões de estatística -------- */}
        <div className="dcx-stats">
          <div className="dcx-stat-card" style={{ borderLeftColor: '#1c2a4a' }}>
            <strong>{fmtInt(STATS.prestadores)}</strong>
            <span>Prestadores na rede</span>
          </div>
          <div className="dcx-stat-card" style={{ borderLeftColor: '#1f9d6e' }}>
            <strong>{fmtInt(STATS.especialidades)}</strong>
            <span>Especialidades / serviços distintos</span>
          </div>
          <div className="dcx-stat-card" style={{ borderLeftColor: '#e0902f' }}>
            <strong>{fmtInt(STATS.itensComValorMapeado)}</strong>
            <span>Itens com valor mapeado</span>
          </div>
          <div className="dcx-stat-card" style={{ borderLeftColor: '#132552' }}>
            <strong>{fmtInt(STATS.contratosAtivos)}</strong>
            <span>Contratos ativos</span>
            <small>{STATS.pendencias} com pendência</small>
          </div>
        </div>

        {/* -------- distribuição + situação -------- */}
        <div className="dcx-grid-2">
          <div className="dcx-card">
            <h2>Distribuição por tipo de serviço</h2>
            <p className="dcx-card-hint">Clique em uma categoria para filtrar a lista de prestadores</p>

            <div className="dcx-toggle">
              <button
                type="button"
                className={modoDistribuicao === 'prestadores' ? 'ativo' : ''}
                onClick={() => setModoDistribuicao('prestadores')}
              >
                Nº de prestadores
              </button>
              <button
                type="button"
                className={modoDistribuicao === 'itens' ? 'ativo' : ''}
                onClick={() => setModoDistribuicao('itens')}
              >
                Itens no catálogo
              </button>
            </div>

            <ul className="dcx-barras">
              {distribuicao.map((d) => (
                <li key={d.categoria}>
                  <button
                    type="button"
                    className={`dcx-barra-linha${filtroCategoria === d.categoria ? ' selecionada' : ''}`}
                    onClick={() =>
                      setFiltroCategoria((atual) => (atual === d.categoria ? 'todos' : d.categoria))
                    }
                  >
                    <span className="dcx-barra-label">{d.categoria}</span>
                    <span className="dcx-barra-trilho">
                      <span
                        className="dcx-barra-fill"
                        style={{ width: `${Math.max(3, (d.valor / maxDistribuicao) * 100)}%` }}
                      />
                    </span>
                    <span className="dcx-barra-valor">{fmtInt(d.valor)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="dcx-card">
            <h2>Situação da rede</h2>
            <p className="dcx-card-hint">Clique em um status para filtrar a lista</p>

            <div className="dcx-donut-bloco">
              <Donut />
              <div className="dcx-donut-legenda">
                {SITUACAO_REDE.map((s) => (
                  <button
                    type="button"
                    key={s.status}
                    className={`dcx-legenda-item${filtroStatus === s.status ? ' selecionada' : ''}`}
                    onClick={() => setFiltroStatus((atual) => (atual === s.status ? 'todos' : s.status))}
                  >
                    <span className="dcx-legenda-dot" style={{ background: s.cor }} />
                    <span className="dcx-legenda-texto">
                      <strong>{s.status}</strong>
                      <small>{s.status === 'Ativo' ? 'contratos ativos' : s.status === 'Descredenciado' ? 'fora da rede' : 'pendente de assinatura'}</small>
                    </span>
                    <span className="dcx-legenda-num" style={{ color: s.cor }}>
                      {s.total}
                      <small>{Math.round((s.total / STATS.prestadores) * 100)}% da rede</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {(filtroStatus !== 'todos' || filtroCategoria !== 'todos') && (
              <button
                type="button"
                className="dcx-limpar-filtro"
                onClick={() => {
                  setFiltroStatus('todos')
                  setFiltroCategoria('todos')
                }}
              >
                Mostrando filtro ativo — limpar
              </button>
            )}
            {filtroStatus === 'todos' && filtroCategoria === 'todos' && (
              <p className="dcx-status-todos">Mostrando todos os status</p>
            )}
          </div>
        </div>

        {/* -------- maiores prestadores por valor -------- */}
        <div className="dcx-card">
          <h2>Maiores prestadores por valor</h2>
          <p className="dcx-card-hint">Faixa de valores (mín → • média → máx) — top prestadores por nº de itens</p>

          <ul className="dcx-top-lista">
            {TOP_POR_VALOR.map((p) => {
              const media = (p.faixaMin + p.faixaMax) / 2
              return (
                <li key={p.id} className="dcx-top-linha">
                  <span className="dcx-top-nome">{p.nome}</span>
                  <span className="dcx-top-trilho">
                    <span
                      className="dcx-top-fill"
                      style={{
                        left: `${(p.faixaMin / maxTopValor) * 100}%`,
                        width: `${Math.max(0.6, ((p.faixaMax - p.faixaMin) / maxTopValor) * 100)}%`,
                      }}
                    />
                    <span className="dcx-top-dot" style={{ left: `${(media / maxTopValor) * 100}%` }} />
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        {/* -------- busca + filtros -------- */}
        <div className="dcx-card">
          <div className="dcx-busca-wrap">
            <input
              type="search"
              className="admin-busca-input"
              placeholder="Buscar prestador ou serviço…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div className="dcx-pills">
            <button
              type="button"
              className={filtroCategoria === 'todos' ? 'ativo' : ''}
              onClick={() => setFiltroCategoria('todos')}
            >
              Todos
            </button>
            {CATEGORIAS.map((c) => (
              <button
                type="button"
                key={c}
                className={filtroCategoria === c ? 'ativo' : ''}
                onClick={() => setFiltroCategoria((atual) => (atual === c ? 'todos' : c))}
              >
                {c}
              </button>
            ))}
          </div>

          <p className="dcx-contagem">
            {listaFiltrada.length} de {STATS.prestadores}
          </p>
          <p className="dcx-dica">
            Clique em um prestador para ver a ficha completa: pacotes, valores, composição, observações e aditivos.
          </p>

          <div className="dcx-tabela-wrap">
            <table className="dcx-tabela">
              <thead>
                <tr>
                  <th aria-hidden="true" />
                  <th>Prestador</th>
                  <th>Serviço</th>
                  <th>Status</th>
                  <th>Itens</th>
                  <th>Faixa (R$)</th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.length === 0 && (
                  <tr>
                    <td colSpan={6} className="admin-td-vazio">
                      Nenhum prestador encontrado.
                    </td>
                  </tr>
                )}
                {listaFiltrada.map((p) => (
                  <PrestadorLinha
                    key={p.id}
                    prestador={p}
                    expandido={expandido === p.id}
                    onToggle={() => setExpandido((atual) => (atual === p.id ? null : p.id))}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

function Donut() {
  const total = SITUACAO_REDE.reduce((s, x) => s + x.total, 0)
  const r = 15.9155
  let acumulado = 0
  const circ = 2 * Math.PI * r

  return (
    <svg viewBox="0 0 40 40" className="dcx-donut" role="img" aria-label="Situação da rede">
      <circle cx="20" cy="20" r={r} fill="none" stroke="#e6ebf5" strokeWidth="6" />
      {SITUACAO_REDE.map((s) => {
        const fracao = s.total / total
        const comprimento = fracao * circ
        const offset = circ - acumulado
        acumulado += comprimento
        return (
          <circle
            key={s.status}
            cx="20"
            cy="20"
            r={r}
            fill="none"
            stroke={s.cor}
            strokeWidth="6"
            strokeDasharray={`${comprimento} ${circ - comprimento}`}
            strokeDashoffset={offset}
            transform="rotate(-90 20 20)"
          />
        )
      })}
      <text x="20" y="19" textAnchor="middle" className="dcx-donut-num">
        {SITUACAO_REDE[0].total}
      </text>
      <text x="20" y="25" textAnchor="middle" className="dcx-donut-legenda-svg">
        ativos
      </text>
    </svg>
  )
}

function PrestadorLinha({
  prestador,
  expandido,
  onToggle,
}: {
  prestador: PrestadorDash
  expandido: boolean
  onToggle: () => void
}) {
  const p = prestador
  const temDetalhe = Boolean(p.itensTuss?.length || p.pacotes?.length || p.cnpj)

  return (
    <>
      <tr className={`dcx-linha${expandido ? ' expandida' : ''}${temDetalhe ? ' clicavel' : ''}`} onClick={temDetalhe ? onToggle : undefined}>
        <td className="dcx-td-chevron">{temDetalhe ? (expandido ? '⌄' : '›') : ''}</td>
        <td>
          <strong>{p.nome}</strong>
          <small>{p.instituicao}</small>
        </td>
        <td>
          <span className="dcx-badge">{p.servico}</span>
        </td>
        <td>
          <span className="dcx-status">
            <span className="dcx-status-dot" style={{ background: statusCor(p.status) }} />
            {p.status}
          </span>
        </td>
        <td>
          {p.itens}
          <small> itens</small>
        </td>
        <td>
          {fmtBRL(p.faixaMin)}–{fmtBRL(p.faixaMax).replace('R$ ', '')}
        </td>
      </tr>

      {expandido && temDetalhe && (
        <tr className="dcx-detalhe-linha">
          <td colSpan={6}>
            <div className="dcx-detalhe">
              <div className="dcx-detalhe-info">
                {p.instituicao && (
                  <div>
                    <span>RAZÃO SOCIAL</span>
                    <strong>{p.instituicao}</strong>
                  </div>
                )}
                {p.cnpj && (
                  <div>
                    <span>CNPJ</span>
                    <strong>{p.cnpj}</strong>
                  </div>
                )}
                {p.cep && (
                  <div>
                    <span>CEP</span>
                    <strong>{p.cep}</strong>
                  </div>
                )}
                <div>
                  <span>SERVIÇO</span>
                  <strong>{p.servico}</strong>
                </div>
              </div>

              {p.itensTuss && p.itensTuss.length > 0 && (
                <table className="dcx-subtabela">
                  <thead>
                    <tr>
                      <th>TUSS</th>
                      <th>Descrição</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.itensTuss.map((it, i) => (
                      <tr key={`${it.tuss}-${i}`}>
                        <td>{it.tuss}</td>
                        <td>{it.descricao}</td>
                        <td>{fmtBRL(it.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {p.servicosTabela && p.servicosTabela.length > 0 && (
                <table className="dcx-subtabela">
                  <thead>
                    <tr>
                      <th>Serviços</th>
                      <th>Tabela</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.servicosTabela.map((s, i) => (
                      <tr key={i}>
                        <td>{s.servico}</td>
                        <td>{s.tabela}</td>
                        <td>{s.valor === null ? '—' : fmtBRL(s.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {p.pacotes && p.pacotes.length > 0 && (
                <>
                  <p className="dcx-subtitulo">Pacotes atualizados</p>
                  <table className="dcx-subtabela">
                    <thead>
                      <tr>
                        <th>Pacote</th>
                        <th>Descrição</th>
                        <th>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.pacotes.map((pac, i) => (
                        <tr key={i}>
                          <td>{pac.codigo}</td>
                          <td>{pac.descricao}</td>
                          <td>{fmtBRL(pac.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {p.composicao && (
                <div className="dcx-composicao">
                  <span>Composição</span>
                  <p>{p.composicao}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

/* ====================== Entrada ====================== */
function DashboardCredenciadas() {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setPronto(true)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session)
      setPronto(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSessao(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!supabaseConfigurado) {
    return (
      <section className="admin-login">
        <div className="admin-login-card">
          <h1>Dashboard · Credenciadas</h1>
          <p className="admin-login-sub">
            O Supabase ainda não está configurado. Preencha o arquivo <code>.env</code> com{' '}
            <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>.
          </p>
        </div>
      </section>
    )
  }
  if (!pronto) return <p className="admin-info shell">Carregando…</p>
  return sessao ? <Painel sessao={sessao} /> : <LoginPainel />
}

export default DashboardCredenciadas
