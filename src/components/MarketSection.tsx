const CARDS = [
  {
    title: 'Sustentabilidade',
    text: 'Crescimento contínuo da sinistralidade e eventos de alto custo que podem desestabilizar resultados.',
    icon: (
      <path
        d="M3 17l6-6 4 4 8-8m0 0h-5m5 0v5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: 'Regulação & Governança',
    text: 'Rigor regulatório da ANS, novas normativas frequentes e exigências de compliance.',
    icon: (
      <path
        d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z M9 12l2 2 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: 'Experiência do beneficiário',
    text: 'Agilidade, transparência, jornada digital e rede credenciada de qualidade.',
    icon: (
      <path
        d="M12 20s-7-4.5-7-9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7 3.5C19 15.5 12 20 12 20z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: 'Transformação digital',
    text: 'Decisões orientadas a dados, automação inteligente e capacidade contínua de inovação.',
    icon: (
      <>
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M8 14l3-3 2 2 3-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
]

function MarketSection() {
  return (
    <section className="market" id="mercado">
      <div className="shell">
        <p className="section-eyebrow">
          <span className="eyebrow-dash" aria-hidden="true" />
          MERCADO
        </p>

        <h2 className="section-title">
          Um mercado que exige
          <br />
          gestão <span className="accent">inteligente e integrada</span>
        </h2>

        <p className="section-lead">
          Mais de 50 milhões de brasileiros dependem de planos de saúde. Operar
          nesse mercado exige excelência em gestão, conformidade regulatória e
          eficiência operacional — em um cenário cada vez mais digital e
          orientado a dados.
        </p>

        <div className="market-grid">
          {CARDS.map((card) => (
            <article key={card.title} className="market-card">
              <span className="card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">{card.icon}</svg>
              </span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default MarketSection
