import { Link } from 'react-router-dom'
import { PORTAIS, ROUTES } from '../routes'
import { CONTATOS, linkWhatsapp } from '../contatos'
import logoInnova from '../assets/logoinnova.png'

const NAV_LINKS = [
  { label: 'Início', to: ROUTES.home },
  { label: 'Quem somos', to: ROUTES.quemSomos },
  { label: 'Rede de Atendimento', to: ROUTES.rede },
  { label: 'Cotação', to: ROUTES.cotacao },
  { label: 'Seja um credenciado', to: ROUTES.credenciado },
  { label: 'SAC', to: ROUTES.sac },
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

/* Marcas do Font Awesome: cada uma tem seu proprio viewBox, entao a
   proporcao e preservada. `height` normaliza o peso otico entre elas. */
const SOCIALS = [
  {
    label: 'WhatsApp',
    href: linkWhatsapp(CONTATOS.central.whatsapp),
    viewBox: '0 0 448 512',
    height: 20,
    path: 'M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/innovaplanodesaude',
    viewBox: '0 0 448 512',
    height: 20,
    path: 'M224.1 141c-63.6 0-114.9 51.3-114.9 114.9S160.5 370.8 224.1 370.8 339 319.5 339 255.9 287.7 141 224.1 141zm124.7-41c22.2 0 40.1 18 40.1 40.1s-18 40.1-40.1 40.1-40.1-18-40.1-40.1 18-40.1 40.1-40.1zm76.1 41.2c-1.7-35.7-9.9-67.3-36.1-93.5S338.4 32 302.7 30.3c-36.3-1.8-121.1-1.8-157.4 0-35.7 1.7-67.3 9.9-93.5 36.1S34.4 109 32.7 144.7c-1.8 36.3-1.8 121.1 0 157.4 1.7 35.7 9.9 67.3 36.1 93.5s57.8 34.4 93.5 36.1c36.3 1.8 121.1 1.8 157.4 0 35.7-1.7 67.3-9.9 93.5-36.1s34.4-57.8 36.1-93.5c1.8-36.3 1.8-121.1 0-157.4zm-48.4 213.5c-7.8 19.5-22.9 34.6-42.4 42.4-29.4 11.8-99.3 9.1-132.4 9.1s-103.1 2.6-132.4-9.1c-19.5-7.8-34.6-22.9-42.4-42.4-11.8-29.4-9.1-99.3-9.1-132.4s-2.6-103.1 9.1-132.4c7.8-19.5 22.9-34.6 42.4-42.4 29.4-11.8 99.3-9.1 132.4-9.1s103.1-2.6 132.4 9.1c19.5 7.8 34.6 22.9 42.4 42.4 11.8 29.4 9.1 99.3 9.1 132.4s2.7 103.1-9.1 132.4z',
  },
]

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div className="footer-brand">
          <img
            src={logoInnova}
            alt="Innova Operadora de Saúde"
            className="brand-logo"
            width={150}
          />
          <span className="footer-tagline">A evolução do seu Plano de Saúde</span>
          <span className="ans-badge">ANS: 42357 - 2</span>
        </div>

        <nav className="footer-col" aria-label="Navegação">
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="footer-col" aria-label="Portais">
          <h2>Portais</h2>
          <ul>
            {PORTAIS.map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
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
                  viewBox={social.viewBox}
                  height={social.height}
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
