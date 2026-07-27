import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'
import {
  ESTADOS,
  FILTROS_VAZIOS,
  TIPOS,
  filtrarPrestadores,
  municipiosDe,
  todasEspecialidades,
  todasRedes,
  type Filtros,
  type Prestador,
  type TipoRecurso,
} from '../data/rede'
import { carregarPrestadores } from '../data/redeRepo'

/** Ícone (path do SVG 24x24) de acordo com o tipo de recurso. */
const ICONE_TIPO: Record<TipoRecurso, string> = {
  Hospital: 'M4 21V7l8-4 8 4v14M9 21v-5h6v5M12 9v3m-1.5-1.5h3',
  Clínica: 'M4 21V9l8-6 8 6v12M10 21v-6h4v6',
  Laboratório: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3',
  Consultório: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0',
  'Pronto atendimento': 'M12 7v10M7 12h10M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z',
}

function IconePin() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function IconeFone() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.5 4h3l1.5 4-2 1.2a12 12 0 0 0 5.8 5.8L16 13l4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Transforma um telefone exibido em href tel: (mantém só os dígitos). */
const telHref = (tel: string) => `tel:+55${tel.replace(/\D/g, '')}`

function CardPrestador({ prestador }: { prestador: Prestador }) {
  return (
    <article className="rede-card">
      <header className="rede-card-topo">
        {prestador.logo ? (
          <span className="rede-card-logo">
            <img
              src={prestador.logo}
              alt={`Logo ${prestador.instituicao ?? prestador.nome}`}
              loading="lazy"
            />
          </span>
        ) : (
          <span className="rede-card-icone" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d={ICONE_TIPO[prestador.tipo]}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
        <div>
          <h3>{prestador.nome}</h3>
          {prestador.instituicao && (
            <p className="rede-card-inst">{prestador.instituicao}</p>
          )}
        </div>
        <span className="rede-tag rede-tag-tipo">{prestador.tipo}</span>
      </header>

      <ul className="rede-chips" aria-label="Especialidades">
        {prestador.especialidades.map((esp) => (
          <li key={esp} className="rede-chip">
            {esp}
          </li>
        ))}
      </ul>

      <p className="rede-card-linha">
        <span className="rede-card-ic">
          <IconePin />
        </span>
        {prestador.endereco}
      </p>

      <p className="rede-card-linha">
        <span className="rede-card-ic">
          <IconeFone />
        </span>
        <span className="rede-fones">
          {prestador.telefones.map((tel) => (
            <a key={tel} href={telHref(tel)}>
              {tel}
            </a>
          ))}
        </span>
      </p>

      <p className="rede-card-redes">
        <span>Redes:</span> {prestador.redes.join(' · ')}
      </p>
    </article>
  )
}

function RedeAtendimento() {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS)
  const [prestadores, setPrestadores] = useState<Prestador[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    carregarPrestadores()
      .then((lista) => ativo && setPrestadores(lista))
      .catch((e) => console.error('Falha ao carregar prestadores', e))
      .finally(() => ativo && setCarregando(false))
    return () => {
      ativo = false
    }
  }, [])

  const municipios = useMemo(
    () => municipiosDe(prestadores, filtros.uf),
    [prestadores, filtros.uf],
  )
  const redes = useMemo(() => todasRedes(prestadores), [prestadores])
  const especialidades = useMemo(
    () => todasEspecialidades(prestadores),
    [prestadores],
  )

  const resultados = useMemo(
    () => filtrarPrestadores(prestadores, filtros),
    [prestadores, filtros],
  )

  const alterar = (campo: keyof Filtros, valor: string) => {
    setFiltros((atual) => {
      const proximo = { ...atual, [campo]: valor }
      /* trocar de estado zera o município (cascata) */
      if (campo === 'uf') proximo.municipio = ''
      return proximo
    })
  }

  const temFiltro = Object.values(filtros).some((v) => v !== '')

  return (
    <>
      {/* ---------- Abertura ---------- */}
      <section className="page-hero">
        <div className="shell">
          <nav className="crumbs" aria-label="Trilha">
            <Link to={ROUTES.home}>Início</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Rede de Atendimento</span>
          </nav>

          <h1 className="page-title">
            Encontre a rede
            <br />
            <span className="accent">credenciada</span> perto de você
          </h1>

          <p className="page-lead">
            Filtre por estado, cidade, plano, tipo de recurso e especialidade
            para localizar hospitais, clínicas, laboratórios e profissionais
            credenciados à Innova.
          </p>
        </div>
      </section>

      {/* ---------- Busca ---------- */}
      <section className="rede">
        <div className="shell">
          <form
            className="rede-filtros"
            onSubmit={(e) => e.preventDefault()}
            aria-label="Filtros da rede de atendimento"
          >
            <div className="campo">
              <label htmlFor="f-uf">Estado</label>
              <select
                id="f-uf"
                value={filtros.uf}
                onChange={(e) => alterar('uf', e.target.value)}
              >
                <option value="">Todos os estados</option>
                {ESTADOS.map((e) => (
                  <option key={e.uf} value={e.uf}>
                    {e.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="f-municipio">Município</label>
              <select
                id="f-municipio"
                value={filtros.municipio}
                onChange={(e) => alterar('municipio', e.target.value)}
                disabled={!filtros.uf}
              >
                <option value="">
                  {filtros.uf ? 'Todos os municípios' : 'Escolha o estado antes'}
                </option>
                {municipios.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="f-rede">Rede / Plano</label>
              <select
                id="f-rede"
                value={filtros.rede}
                onChange={(e) => alterar('rede', e.target.value)}
              >
                <option value="">Todas as redes</option>
                {redes.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="f-tipo">Tipo de recurso</label>
              <select
                id="f-tipo"
                value={filtros.tipo}
                onChange={(e) => alterar('tipo', e.target.value)}
              >
                <option value="">Todos os tipos</option>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="f-especialidade">Especialidade</label>
              <select
                id="f-especialidade"
                value={filtros.especialidade}
                onChange={(e) => alterar('especialidade', e.target.value)}
              >
                <option value="">Todas as especialidades</option>
                {especialidades.map((esp) => (
                  <option key={esp} value={esp}>
                    {esp}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo rede-busca">
              <label htmlFor="f-busca">Buscar por nome</label>
              <input
                id="f-busca"
                type="search"
                placeholder="Ex.: Hospital, clínica, laboratório…"
                value={filtros.busca}
                onChange={(e) => alterar('busca', e.target.value)}
              />
            </div>
          </form>

          <div className="rede-barra">
            <p className="rede-contagem" role="status" aria-live="polite">
              {carregando ? (
                'Carregando prestadores…'
              ) : (
                <>
                  <strong>{resultados.length}</strong>{' '}
                  {resultados.length === 1
                    ? 'prestador encontrado'
                    : 'prestadores encontrados'}
                </>
              )}
            </p>

            {temFiltro && (
              <button
                type="button"
                className="rede-limpar"
                onClick={() => setFiltros(FILTROS_VAZIOS)}
              >
                Limpar filtros
              </button>
            )}
          </div>

          {carregando ? null : resultados.length > 0 ? (
            <div className="rede-grid">
              {resultados.map((p) => (
                <CardPrestador key={p.id} prestador={p} />
              ))}
            </div>
          ) : (
            <div className="rede-vazio">
              <h3>Nenhum prestador encontrado</h3>
              <p>
                Não localizamos prestadores com esses filtros. Tente ampliar a
                busca ou{' '}
                <button
                  type="button"
                  className="rede-link"
                  onClick={() => setFiltros(FILTROS_VAZIOS)}
                >
                  limpar os filtros
                </button>
                .
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export default RedeAtendimento
