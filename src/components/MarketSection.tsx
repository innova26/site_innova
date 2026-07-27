const CARDS = [
  {
    title: 'Telemedicina',
    text: 'Acesse médicos online de onde estiver, com praticidade e segurança. Atendimento rápido, humanizado e disponível 24h para você cuidar da sua saúde sem sair de casa. Entre em contato pela central 0800 892 4888 ou 3003 6291',
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
    title: 'Rede credenciada',
    text: 'Consulte médicos, clínicas e hospitais disponíveis no seu plano. Encontre atendimento com agilidade e confiança.',
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
    title: 'Autorizações e exames',
    text: 'Solicite suas autorizações e acompanhe seus exames com poucos cliques. Mais controle, menos burocracia. Entre em contato com nossa Central: 0800 345 9999 (telefone ou WhatsApp)',
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
    title: 'Agendamentos',
    text: 'Marque suas consultas com os prestadores do nosso guia médico, disponível em nosso site ou ligue no 0800 345 9999 para saber mais!',
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
          Serviçoss
        </p>

        <h2 className="section-title">
          Acesse facilmente os serviços do seu plano.
        </h2>        

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
