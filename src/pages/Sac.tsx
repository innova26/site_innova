import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'
import { CONTATOS, linkWhatsapp } from '../contatos'

function Sac() {
  return (
    <>
      {/* ---------- abertura ---------- */}
      <section className="page-hero">
        <div className="shell">
          <nav className="crumbs" aria-label="Trilha">
            <Link to={ROUTES.home}>Início</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">SAC</span>
          </nav>

          <h1 className="page-title">
            Fale com a gente
            <br />
            <span className="accent">sempre que precisar</span>
          </h1>

          <p className="page-lead">
            Nosso time está pronto para te atender com atenção, agilidade e
            respeito. Seja por telefone ou WhatsApp, garantimos um suporte
            eficiente e acolhedor para tirar dúvidas, resolver pendências ou
            orientar sobre seu plano de saúde.
          </p>
        </div>
      </section>

      {/* ---------- canais ---------- */}
      <section className="canais">
        <div className="shell canais-grid">
          <article className="canal-card">
            <span className="canal-icone" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 7.2 2 2 0 0 1 6 5z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
              </svg>
            </span>

            <h2>Telefone para contato</h2>
            <p>
              Canal exclusivo para beneficiários e prestadores da rede Innova.
              Fale com a nossa central de atendimento e tire suas dúvidas com um
              de nossos especialistas.
            </p>

            <a className="canal-numero" href={CONTATOS.central.telefone}>
              {CONTATOS.central.rotulo}
            </a>

            <a
              className="btn btn-ghost"
              href={linkWhatsapp(
                CONTATOS.central.whatsapp,
                'Olá! Preciso de atendimento da central Innova.',
              )}
              target="_blank"
              rel="noreferrer"
            >
              Falar pela central
            </a>
          </article>
        </div>
      </section>

      {/* ---------- localização ---------- */}
      <section className="localizacao">
        <div className="shell">
          <p className="section-eyebrow">
            <span className="eyebrow-dash" aria-hidden="true" />
            ONDE ESTAMOS
          </p>

          <h2 className="section-title">
            Estamos em uma das principais
            <br />
            avenidas de <span className="accent">Porto Velho</span>
          </h2>

          <p className="section-lead">
            Estrutura moderna para receber você com conforto e agilidade.
          </p>

          <div className="mapa-bloco">
            <address className="endereco">
              <strong>{CONTATOS.endereco.rua}</strong>
              <span>{CONTATOS.endereco.bairro}</span>
              <span>{CONTATOS.endereco.cidade}</span>
              <span>CEP {CONTATOS.endereco.cep}</span>

              <a
                className="btn btn-primary"
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  `${CONTATOS.endereco.rua}, ${CONTATOS.endereco.bairro}, ${CONTATOS.endereco.cidade}`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                Ver rota <span aria-hidden="true">→</span>
              </a>
            </address>

            <div className="mapa">
              <iframe
                src={CONTATOS.endereco.mapa}
                title="Mapa da sede da Innova em Porto Velho"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Sac
