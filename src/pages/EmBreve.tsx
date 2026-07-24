import { Link, useLocation } from 'react-router-dom'
import { ROUTE_TITLES } from '../routes'

/** Placeholder para as rotas ja previstas no menu mas ainda nao construidas. */
function EmBreve() {
  const { pathname } = useLocation()
  const titulo = ROUTE_TITLES[pathname] ?? 'Página'

  return (
    <section className="em-breve">
      <div className="shell">
        <p className="section-eyebrow on-dark">
          <span className="eyebrow-dash" aria-hidden="true" />
          EM CONSTRUÇÃO
        </p>

        <h1 className="section-title on-dark">
          {titulo} <span className="accent">em breve</span>
        </h1>

        <p className="section-lead on-dark">
          Esta página ainda está sendo montada. Enquanto isso, fale com a nossa
          equipe ou volte para a página inicial.
        </p>

        <div className="hero-actions">
          <Link className="btn btn-primary" to="/">
            Voltar para o início <span aria-hidden="true">→</span>
          </Link>
          <a className="btn btn-ghost" href="#contato">
            Falar com um especialista
          </a>
        </div>
      </div>
    </section>
  )
}

export default EmBreve
