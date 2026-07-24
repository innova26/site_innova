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

const SOCIALS = [
  {
    label: 'Facebook',
    href: 'https://facebook.com',
    path: 'M13.5 21v-8h2.7l.4-3h-3.1V8.2c0-.9.3-1.5 1.5-1.5h1.7V4c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2V10H7.5v3h2.7v8z',
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/',
    path: 'M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 1 1-4.2 15.2l-.3-.2-2.8.8.8-2.8-.2-.3A8.2 8.2 0 0 1 12 3.8zm-3.3 4c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.1s.9 2.4 1.1 2.6c.1.2 1.8 2.8 4.4 3.8 2.2.9 2.6.7 3.1.6.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.6-.3-1.6-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.2-.1-1-.4-2-1.2-.7-.7-1.2-1.5-1.4-1.7-.1-.2 0-.4.1-.5l.4-.5.3-.5v-.5l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5z',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com',
    path: 'M6.9 8.8H4V20h2.9zM5.4 4a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zM20 13.6c0-3-1.6-4.5-3.8-4.5-1.7 0-2.5.9-2.9 1.6V8.8H10.4V20h2.9v-6.1c0-1.3.6-2.1 1.8-2.1s1.9.8 1.9 2.1V20H20z',
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
                <svg viewBox="0 0 24 24" aria-hidden="true">
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
