const NAV_LINKS = [
  { label: 'Início', href: '#' },
  { label: 'Quem somos', href: '#empresa' },
  { label: 'Blog', href: '#blog' },
  { label: 'Rede de Atendimento', href: '#rede' },
  { label: 'Suporte ao cliente', href: '#suporte' },
  { label: 'Cotação', href: '#cotacao' },
  { label: 'Seja um credenciado', href: '#credenciado' },
]

const PORTAL_LINKS = [
  { label: 'Portal do Beneficiário', href: '#portal-beneficiario' },
  { label: 'Portal do Prestador', href: '#portal-prestador' },
  { label: 'Portal do Corretor', href: '#portal-corretor' },
  { label: 'Portal da Empresa', href: '#portal-empresa' },
]

const LEGAL_LINKS = [
  { label: 'Termos de Uso', href: '#termos' },
  { label: 'Política de Privacidade', href: '#privacidade' },
  { label: 'Gerenciar Cookies', href: '#cookies' },
]

const CITIES = ['Porto Velho', 'Manaus', 'Boa Vista']

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 7.2 2 2 0 0 1 6 5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M4 7.5l8 5 8-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="10"
        r="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  )
}

/* Tracados oficiais das marcas (grid 24x24, preenchimento solido).
   `inset` compensa o peso otico: o glifo do WhatsApp ocupa a caixa
   inteira, enquanto "f" e "in" sao naturalmente menores. */
const SOCIALS = [
  {
    label: 'Facebook',
    href: 'https://facebook.com',
    inset: false,
    path: 'M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z',
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/',
    inset: true,
    path: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com',
    inset: false,
    path: 'M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z',
  },
]

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div className="footer-brand">
          <span className="brand-top">Innova</span>
          <span className="footer-tagline">A evolução do seu Plano de Saúde</span>
          <span className="ans-badge">ANS: 42357 - 2</span>
        </div>

        <nav className="footer-col" aria-label="Navegação">
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="footer-col" aria-label="Portais">
          <h2>Portais</h2>
          <ul>
            {PORTAL_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="footer-col" aria-label="Informações legais">
          <ul>
            {LEGAL_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer-col footer-contact">
          <h2>Contato</h2>
          <ul>
            <li>
              <span className="contact-icon">
                <PhoneIcon />
              </span>
              <a href="tel:08003459999">
                Central de Atendimento – 0800 345 9999
              </a>
            </li>
            <li>
              <span className="contact-icon">
                <PhoneIcon />
              </span>
              <a href="tel:+556920181000">Ouvidoria – (69) 2018-1000</a>
            </li>
            <li>
              <span className="contact-icon">
                <MailIcon />
              </span>
              <a href="mailto:faleconosco@innovaoperadora.com.br">
                faleconosco@innovaoperadora.com.br
              </a>
            </li>
            {CITIES.map((city) => (
              <li key={city}>
                <span className="contact-icon">
                  <PinIcon />
                </span>
                <span>{city}</span>
              </li>
            ))}
          </ul>

          <h3 className="soon-title">Em breve em</h3>
          <ul>
            <li>
              <span className="contact-icon">
                <PinIcon />
              </span>
              <span>Macaé</span>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h2>Redes Sociais</h2>
          <div className="socials">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                className="social-btn"
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
              >
                <svg
                  viewBox="0 0 24 24"
                  className={social.inset ? 'is-inset' : undefined}
                  aria-hidden="true"
                >
                  <path fill="currentColor" d={social.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="shell">
          <p>
            ©2026 Innova Plano de Saúde – Todos os Direitos Reservados
            <span className="sep" aria-hidden="true">
              |
            </span>
            CNPJ: 48.982.275/0001-02
          </p>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
