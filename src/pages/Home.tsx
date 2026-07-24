import HeroArt from '../components/HeroArt'
import MarketSection from '../components/MarketSection'
import PlansSection from '../components/PlansSection'
import FaqSection from '../components/FaqSection'

function Home() {
  return (
    <>
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
              Tecnologia, inteligência e eficiência para garantir performance e
              conformidade em um mercado altamente regulado.
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
    </>
  )
}

export default Home
