import './App.css'
import HeroArt from './components/HeroArt'
import MarketSection from './components/MarketSection'
import PlansSection from './components/PlansSection'
import FaqSection from './components/FaqSection'

const NAV_ITEMS = [
  { label: 'INÍCIO', href: '#', active: true },
  { label: 'SOLUÇÕES', href: '#solucoes', caret: true },
  { label: 'SEGMENTOS', href: '#segmentos', caret: true },
  { label: 'A INNOVA', href: '#empresa' },
  { label: 'BLOG', href: '#blog' },
  { label: 'IMPRENSA', href: '#imprensa' },
  { label: 'MATERIAIS', href: '#materiais' },
]

function App() {
  return (
    <div className="page">
      <header className="site-header">
        <div className="shell header-inner">
          <a className="brand" href="#">
            <span className="brand-top">Innova</span>
            <span className="brand-sub">operadora de saúde</span>
          </a>

          <nav className="nav" aria-label="Principal">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={item.active ? 'nav-link is-active' : 'nav-link'}
              >
                {item.label}
                {item.caret && (
                  <span className="caret" aria-hidden="true">
                    ▾
                  </span>
                )}
              </a>
            ))}
          </nav>

          <a className="btn btn-primary header-cta" href="#contato">
            FALE COM ESPECIALISTA
          </a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="shell hero-inner">
            <div className="hero-copy">
              <p className="eyebrow">SAÚDE SUPLEMENTAR · 40 ANOS</p>

              <h1 className="hero-title">
                Transformando a gestão
                <br />
                na <span className="accent">saúde suplementar</span>
              </h1>

              <p className="hero-lead">
                Tecnologia, inteligência e eficiência para garantir performance
                e conformidade em um mercado altamente regulado.
              </p>

              <div className="hero-actions">
                <a className="btn btn-primary" href="#demonstracao">
                  Agendar demonstração <span aria-hidden="true">→</span>
                </a>
                <a className="btn btn-ghost" href="#solucoes">
                  Conheça nossas soluções
                </a>
              </div>

              <div className="hero-eco">
                <p className="eco-title">Parte do ecossistema</p>
                <p className="eco-text">
                  Innova · presente em 100% das cidades brasileiras
                </p>
              </div>
            </div>

            <div className="hero-visual">
              <HeroArt />
            </div>
          </div>
        </section>

        <MarketSection />
        <PlansSection />
        <FaqSection />
      </main>
    </div>
  )
}

export default App
