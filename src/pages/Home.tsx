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
            <p className="eyebrow">Sua saúde em boas mãos, sem burocracia.</p>

            <h1 className="hero-title">
              A evolução do seu plano de saúde
              <br />
              a <span className="accent">o futuro começa aqui.</span>
            </h1>

            <p className="hero-lead">
              O futuro da saúde começa aqui.
            </p>

            <div className="hero-actions">
              <a className="btn btn-primary" href="#demonstracao">
                Portal do Beneficiario <span aria-hidden="true">→</span>
              </a>
              <a className="btn btn-ghost" href="#solucoes">
                Saiba mais <span aria-hidden="true">→</span>
              </a>
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
