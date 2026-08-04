import { type CSSProperties, type MouseEvent } from 'react'
import { useRevealOnScroll } from '../hooks/useRevealOnScroll'
import { CONTATOS, linkWhatsapp } from '../contatos'

const ICONS = {
  building: (
    <>
      <rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </>
  ),
  users: (
    <>
      <circle
        cx="9"
        cy="8"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="17"
        cy="9"
        r="2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M16 14.2c2.4.3 4.5 2 4.5 4.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </>
  ),
  tooth: (
    <path
      d="M12 3c2 0 3-1 5 0s2.5 3.4 2 6c-.5 2.4-1 3.4-1.4 6-.3 2-1 3.4-2.1 3.4-1.3 0-1.4-2-1.8-4-.2-1-.7-1.6-1.7-1.6s-1.5.6-1.7 1.6c-.4 2-.5 4-1.8 4-1.1 0-1.8-1.4-2.1-3.4-.4-2.6-.9-3.6-1.4-6-.5-2.6 0-5 2-6s3 0 5 0z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  ),
}

const PLANS = [
  {
    id: 'empresarial',
    icon: ICONS.building,
    name: 'Plano',
    highlight: 'Empresarial',
    tagline: 'Para empresas que cuidam do seu time',
    text: 'Ofereça saúde completa aos colaboradores com atendimento ágil, rede qualificada e gestão simples. O plano empresarial garante bem-estar, reduz absenteísmo e valoriza quem faz o negócio acontecer.',
    features: [
      'Ampla rede credenciada',
      'Mais de 55 especialidades',
      'Telemedicina',
      'Atendimento humanizado',
    ],
    featured: false,
  },
  {
    id: 'adesao',
    icon: ICONS.users,
    name: 'Plano',
    highlight: 'Coletivo por Adesão',
    tagline: 'Saúde acessível para quem caminha em grupo',
    text: 'Se você faz parte de uma associação, conselho ou entidade de classe, pode garantir um plano completo com preços mais acessíveis. A adesão é simples e você aproveita todos os benefícios sem burocracia.',
    features: [
      'Ampla rede credenciada',
      'Mais de 55 especialidades',
      'Telemedicina',
      'Atendimento humanizado',
    ],
    featured: true,
  },
  {
    id: 'odontologico',
    icon: ICONS.tooth,
    name: 'Plano',
    highlight: 'Odontológico',
    tagline: 'Sorrir com saúde é essencial',
    text: 'Cuide do seu sorriso com um plano odontológico nacional, sem carência e com cobertura para procedimentos essenciais. Ideal para empresas e grupos que valorizam prevenção e qualidade de vida.',
    features: [
      'Cobertura Ampla',
      'Atendimento humanizado',
      'Benefícios Extras',
      'Adesão Simples',
    ],
    featured: false,
  },
]

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="check" aria-hidden="true">
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="wa-icon" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 1 1-4.2 15.2l-.3-.2-2.8.8.8-2.8-.2-.3A8.2 8.2 0 0 1 12 3.8zm-3.3 4c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.1s.9 2.4 1.1 2.6c.1.2 1.8 2.8 4.4 3.8 2.2.9 2.6.7 3.1.6.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.6-.3-1.6-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.2-.1-1-.4-2-1.2-.7-.7-1.2-1.5-1.4-1.7-.1-.2 0-.4.1-.5l.4-.5.3-.5v-.5l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5z"
      />
    </svg>
  )
}

function PlansSection() {
  const gridRef = useRevealOnScroll<HTMLDivElement>('.plan-card')

  /* Spotlight que acompanha o cursor dentro do card */
  const handleMove = (event: MouseEvent<HTMLElement>) => {
    const card = event.currentTarget
    const rect = card.getBoundingClientRect()
    card.style.setProperty('--mx', `${event.clientX - rect.left}px`)
    card.style.setProperty('--my', `${event.clientY - rect.top}px`)
  }

  return (
    <section className="plans" id="planos">
      <div className="shell">
        <header className="plans-head">
          <p className="section-eyebrow on-dark">
            <span className="eyebrow-dash" aria-hidden="true" />
            PLANOS
          </p>

          <h2 className="section-title on-dark">
            Conheça nossos planos e
            <br />
            escolha <span className="accent">o melhor para você</span>
          </h2>

          <p className="section-lead on-dark">
            Oferecemos opções sob medida para atender profissionais, estudantes
            e empresas com agilidade, qualidade e excelente custo-benefício.
          </p>
        </header>

        <div className="plans-grid" ref={gridRef}>
          {PLANS.map((plan, index) => (
            <article
              key={plan.id}
              className={`plan-card${plan.featured ? ' is-featured' : ''}`}
              style={{ '--delay': `${index * 110}ms` } as CSSProperties}
              onMouseMove={handleMove}
            >
              <span className="plan-spotlight" aria-hidden="true" />

              {plan.featured && <span className="plan-badge">Mais procurado</span>}

              <span className="plan-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">{plan.icon}</svg>
              </span>

              <h3 className="plan-name">
                {plan.name} <span className="accent">{plan.highlight}</span>
              </h3>

              <p className="plan-tagline">{plan.tagline}</p>
              <p className="plan-text">{plan.text}</p>

              <ul className="plan-features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span className="check-badge">
                      <CheckIcon />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                className="plan-cta"
                href={linkWhatsapp(
                  CONTATOS.central.whatsapp,
                  `Olá! Gostaria de saber mais sobre o ${plan.name} ${plan.highlight}.`,
                )}
                target="_blank"
                rel="noreferrer"
              >
                <WhatsAppIcon />
                Entre em contato
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PlansSection
