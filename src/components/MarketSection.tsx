const CARDS = [
  {
    title: 'Telemedicina',
    text: 'Acesse médicos online de onde estiver, com praticidade e segurança. Atendimento rápido, humanizado e disponível 24h para você cuidar da sua saúde sem sair de casa. Entre em contato pela central 0800 892 4888 ou 3003 6291',
    icon: (
      <>
        <rect
          x="3"
          y="4"
          width="18"
          height="13"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M8 21h8 M12 17v4 M12 8v5 M9.5 10.5h5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  {
    title: 'Rede credenciada',
    text: 'Consulte médicos, clínicas e hospitais disponíveis no seu plano. Encontre atendimento com agilidade e confiança.',
    icon: (
      <>
        <circle cx="12" cy="5" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="5" cy="19" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="19" cy="19" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <path
          d="M10.7 6.9 6.3 16.8 M13.3 6.9 17.7 16.8 M7.5 19h9"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  {
    title: 'Autorizações e exames',
    text: 'Solicite suas autorizações e acompanhe seus exames com poucos cliques. Mais controle, menos burocracia. Entre em contato com nossa Central: 0800 345 9999 (telefone ou WhatsApp)',
    icon: (
      <>
        <path
          d="M9 4H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="9"
          y="2.5"
          width="6"
          height="3.5"
          rx="1"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M8.5 13l2.2 2.2L15.5 10.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  {
    title: 'Agendamentos',
    text: 'Marque suas consultas com os prestadores do nosso guia médico, disponível em nosso site ou ligue no 0800 345 9999 para saber mais!',
    icon: (
      <>
        <rect
          x="4"
          y="5"
          width="16"
          height="15"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M4 9h16 M8 3v4 M16 3v4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 13.5l1.8 1.8L15 11.5"
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
