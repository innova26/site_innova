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
import { carregarVisiveis } from '../data/redeRepo'
import gps from '../assets/gps.webp'

const POR_PAGINA = 50
const TIPOS_UNICOS: TipoRecurso[] = [...new Set(TIPOS)]

/** Ícone (path do SVG 24x24) de acordo com o tipo de recurso. */
const ICONE_TIPO: Record<TipoRecurso, string> = {
  Hospital: 'M4 21V7l8-4 8 4v14M9 21v-5h6v5M12 9v3m-1.5-1.5h3',
  Clínica: 'M4 21V9l8-6 8 6v12M10 21v-6h4v6',
  Laboratório: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3',
  Consultório: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0',
  'Pronto atendimento': 'M12 7v10M7 12h10M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z',
}

type PrestadorGrupo = {
  id: string
  tipo: TipoRecurso
  nome: string
  instituicao?: string
  logo?: string
  especialidades: string[]
  redes: string[]
  telefones: string[]
  profissionais: string[]
  endereco: string
  prestadores: Prestador[]
}

function agruparPrestadoresPorTipoEndereco(lista: Prestador[]): PrestadorGrupo[] {
  const grupos = new Map<string, PrestadorGrupo>()

  for (const prestador of lista) {
    const chave = `${prestador.tipo}||${prestador.endereco}`
    const grupo = grupos.get(chave)

    if (!grupo) {
      grupos.set(chave, {
        id: chave,
        tipo: prestador.tipo,
        nome: prestador.nome,
        instituicao: prestador.instituicao,
        logo: prestador.logo,
        especialidades: [...new Set(prestador.especialidades)],
        redes: [...new Set(prestador.redes)],
        telefones: [...new Set(prestador.telefones)],
        profissionais: prestador.profissional ? [prestador.profissional] : [],
        endereco: prestador.endereco,
        prestadores: [prestador],
      })
      continue
    }

    grupo.prestadores.push(prestador)
    grupo.instituicao ??= prestador.instituicao
    grupo.logo ??= prestador.logo
    grupo.especialidades = [...new Set([...grupo.especialidades, ...prestador.especialidades])]
    grupo.redes = [...new Set([...grupo.redes, ...prestador.redes])]
    grupo.telefones = [...new Set([...grupo.telefones, ...prestador.telefones])]
    if (prestador.profissional && !grupo.profissionais.includes(prestador.profissional)) {
      grupo.profissionais.push(prestador.profissional)
    }
  }

  return [...grupos.values()]
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

function IconePessoa() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle
        cx="12"
        cy="8"
        r="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5 20a7 7 0 0 1 14 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
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

/** Monta a URL de busca do endereço no Google Maps. */
const mapsHref = (endereco: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`

/**
 * Remove duplicatas ignorando caixa e espaços nas pontas, preservando a
 * primeira forma encontrada. Evita, por exemplo, dezenas de chips
 * "PEDIATRIA" idênticos quando cada profissional repete a especialidade.
 */
function normalizarLista(itens: string[]): string[] {
  const vistos = new Map<string, string>()
  for (const item of itens) {
    const limpo = item.trim()
    const chave = limpo.toLocaleUpperCase('pt-BR')
    if (limpo && !vistos.has(chave)) vistos.set(chave, limpo)
  }
  return [...vistos.values()]
}

/**
 * Muitas entradas trazem vários profissionais concatenados numa única string,
 * com separadores variados:
 *   - "DRA JULIA ... | DR LUCAS ... | DR MARCELO ..."        (pipe)
 *   - "DRA. ARISE ... (Pediatria), DR. ADRIANO ... (Pediatra)" (vírgula antes de DR/DRA)
 * Quebramos em ambos, preservando a especialidade entre parênteses de cada nome
 * e aceitando "DR"/"DRA" com ou sem ponto.
 */
function separarMedicos(entradas: string[]): string[] {
  const todos: string[] = []
  for (const entrada of entradas) {
    const partes = entrada
      .split(/\s*\|\s*/)
      .flatMap((parte) => parte.split(/\s*,\s*(?=DRA?\.?\s)/i))
    for (const parte of partes) {
      const nome = parte.trim()
      if (nome) todos.push(nome)
    }
  }
  return todos
}

function CardPrestador({ grupo }: { grupo: PrestadorGrupo }) {
  const especialidades = normalizarLista(grupo.especialidades)
  const medicos = normalizarLista(separarMedicos(grupo.profissionais))
  const redes = normalizarLista(grupo.redes)
  const telefones = normalizarLista(grupo.telefones)

  return (
    <article className="rede-card">
      <header className="rede-card-topo">
        {grupo.logo ? (
          <span className="rede-card-logo">
            <img
              src={grupo.logo}
              alt={`Logo ${grupo.instituicao ?? grupo.nome}`}
              loading="lazy"
            />
          </span>
        ) : (
          <span className="rede-card-icone" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d={ICONE_TIPO[grupo.tipo]}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
        <div className="rede-card-identidade">
          <h3>{grupo.nome}</h3>
          {grupo.instituicao && (
            <p className="rede-card-inst">{grupo.instituicao}</p>
          )}

          <div className="rede-card-contato">
            <p className="rede-card-linha">
              <span className="rede-card-ic">
                <IconePin />
              </span>
              <a
                className="rede-endereco-link"
                href={mapsHref(grupo.endereco)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {grupo.endereco}
              </a>
            </p>

            {telefones.length > 0 && (
              <p className="rede-card-linha">
                <span className="rede-card-ic">
                  <IconeFone />
                </span>
                <span className="rede-fones">
                  {telefones.map((tel) => (
                    <span key={tel}>{tel}</span>
                  ))}
                </span>
              </p>
            )}
          </div>
        </div>
        <span className="rede-tag rede-tag-tipo">{grupo.tipo}</span>
      </header>

      {especialidades.length > 0 && (
        <section className="rede-card-secao">
          <p className="rede-card-label">
            {especialidades.length > 1 ? 'Especialidades' : 'Especialidade'}
            <span className="rede-card-contagem">{especialidades.length}</span>
          </p>
          <ul className="rede-chips" aria-label="Especialidades">
            {especialidades.map((esp) => (
              <li key={esp} className="rede-chip">
                {esp}
              </li>
            ))}
          </ul>
        </section>
      )}

      {medicos.length > 0 && (
        <section className="rede-card-secao">
          <p className="rede-card-label">
            Corpo clínico
            <span className="rede-card-contagem">
              {medicos.length}{' '}
              {medicos.length === 1 ? 'profissional' : 'profissionais'}
            </span>
          </p>
          <ul className="rede-medicos">
            {medicos.map((medico) => (
              <li key={medico}>
                <IconePessoa />
                {medico}
              </li>
            ))}
          </ul>
        </section>
      )}

      {redes.length > 0 && (
        <p className="rede-card-redes">
          <span>Redes:</span> {redes.join(' · ')}
        </p>
      )}
    </article>
  )
}

function RedeAtendimento() {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS)
  const [prestadores, setPrestadores] = useState<Prestador[]>([])
  const [carregando, setCarregando] = useState(true)

  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    let ativo = true
    carregarVisiveis()
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

  const resultadosAgrupados = useMemo(
    () => agruparPrestadoresPorTipoEndereco(resultados),
    [resultados],
  )

  /* volta para a 1ª página sempre que os filtros mudam */
  useEffect(() => setPagina(1), [filtros])

  const totalPaginas = Math.max(1, Math.ceil(resultadosAgrupados.length / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveisPagina = resultadosAgrupados.slice(
    (paginaAtual - 1) * POR_PAGINA,
    paginaAtual * POR_PAGINA,
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
      <section className="page-hero rede-hero">
        <div className="shell rede-hero-inner">
          <div className="rede-hero-copy">
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

          <img className="rede-hero-img" src={gps} alt="Mapa de localização da rede" />
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
                {TIPOS_UNICOS.map((t) => (
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
            <>
              <div className="rede-grid">
                {visiveisPagina.map((grupo) => (
                  <CardPrestador key={grupo.id} grupo={grupo} />
                ))}
              </div>

              {totalPaginas > 1 && (
                <nav className="rede-paginacao" aria-label="Paginação">
                  <button
                    type="button"
                    className="rede-pag-btn"
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                  >
                    ← Anterior
                  </button>
                  <span className="rede-pag-info">
                    Página {paginaAtual} de {totalPaginas}
                  </span>
                  <button
                    type="button"
                    className="rede-pag-btn"
                    onClick={() =>
                      setPagina((p) => Math.min(totalPaginas, p + 1))
                    }
                    disabled={paginaAtual === totalPaginas}
                  >
                    Próxima →
                  </button>
                </nav>
              )}
            </>
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
