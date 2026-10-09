import { type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useRevealOnScroll } from '../hooks/useRevealOnScroll'
import { ROUTES } from '../routes'
import appHome from '../assets/app-home.png'
import appCarteirinha from '../assets/app-carteirinha.png'

/*
 * Links das lojas. Substituir pelos endereços reais do app quando publicado.
 * Enquanto não estiverem no ar, os botões abrem a busca da loja pelo nome.
 */
const APP_STORE_URL = 'https://apps.apple.com/br/app/acesso-innova/id6794425548'
/* App ainda não indexado na Play Store. Descomentar quando tiver o link. */
// const PLAY_STORE_URL =
//   'https://play.google.com/store/apps/details?id=br.com.innovaoperadora'

/* Recursos disponíveis no aplicativo (espelham o menu principal do app). */
const RECURSOS = [
  {
    titulo: 'Carteirinha digital',
    texto:
      'Tenha sua carteirinha sempre à mão, direto no celular. Apresente nos atendimentos sem precisar do cartão físico.',
    icone: 'M3 7h18v10H3zM3 11h18M7 15h4',
  },
  {
    titulo: 'Guia médico',
    texto:
      'Encontre médicos, clínicas, laboratórios e hospitais da rede credenciada perto de você, por especialidade e região.',
    icone: 'M9 3 4 6v13l5-3 6 3 5-3V3l-5 3-6-3zM9 3v13M15 6v13',
  },
  {
    titulo: 'Autorizações',
    texto:
      'Acompanhe o status das suas solicitações e autorizações de procedimentos de forma rápida e transparente.',
    icone: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.5-4.5',
  },
  {
    titulo: 'Atendimentos',
    texto:
      'Fale com a Innova, acompanhe seus atendimentos e tenha suporte sempre que precisar, sem sair do app.',
    icone: 'M4 5h16v11H8l-4 4V5z',
  },
]

/* Passos para começar a usar. */
const PASSOS = [
  {
    numero: '01',
    titulo: 'Baixe o aplicativo',
    texto: 'Disponível gratuitamente na App Store, para iPhone. Em breve também para Android.',
  },
  {
    numero: '02',
    titulo: 'Faça seu primeiro acesso',
    texto: 'Entre com seu CPF e crie sua senha tocando em “Primeiro acesso?”.',
  },
  {
    numero: '03',
    titulo: 'Tudo na palma da mão',
    texto: 'Acesse carteirinha, guia médico, autorizações e atendimentos quando quiser.',
  },
]

function AppleIcon() {
  return (
    <svg viewBox="0 0 384 512" aria-hidden="true" height={26}>
      <path
        fill="currentColor"
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
      />
    </svg>
  )
}

/* Ícone do Google Play — reativar junto com o botão quando o app indexar. */
// function PlayIcon() {
//   return (
//     <svg viewBox="0 0 512 512" aria-hidden="true" height={26}>
//       <path fill="#00d2ff" d="M47 24C38 29 32 39 32 53v406c0 14 6 24 15 29l236-232z" />
//       <path fill="#00f076" d="M47 24c7-4 16-3 25 2l317 183-73 72z" />
//       <path fill="#ffce00" d="M389 209 462 251c16 9 16 33 0 42l-73 42-74-84z" />
//       <path fill="#ff3a44" d="M47 488c9 5 18 6 25 2l241-139-73-72z" />
//     </svg>
//   )
// }

function StoreButtons({ className = '' }: { className?: string }) {
  return (
    <div className={`store-buttons ${className}`.trim()}>
      <a
        className="store-btn"
        href={APP_STORE_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Baixar na App Store"
      >
        <span className="store-btn-icon">
          <AppleIcon />
        </span>
        <span className="store-btn-text">
          <small>Baixar na</small>
          <strong>App Store</strong>
        </span>
      </a>

      {/* App ainda não indexado na Play Store. Descomentar quando tiver o link.
      <a
        className="store-btn"
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Disponível no Google Play"
      >
        <span className="store-btn-icon">
          <PlayIcon />
        </span>
        <span className="store-btn-text">
          <small>Disponível no</small>
          <strong>Google Play</strong>
        </span>
      </a>
      */}
    </div>
  )
}

function Aplicativo() {
  const recursosRef = useRevealOnScroll<HTMLDivElement>('.recurso-card')
  const passosRef = useRevealOnScroll<HTMLDivElement>('.passo-card')

  return (
    <>
      {/* ---------- Abertura ---------- */}
      <section className="page-hero app-hero">
        <div className="shell app-hero-inner">
          <div className="app-hero-copy">
            <nav className="crumbs" aria-label="Trilha">
              <Link to={ROUTES.home}>Início</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Aplicativo</span>
            </nav>

            <p className="section-eyebrow">
              <span className="eyebrow-dash" aria-hidden="true" />
              APP DO BENEFICIÁRIO
            </p>

            <h1 className="page-title">
              Seu plano de saúde
              <br />
              na palma da <span className="accent">mão</span>
            </h1>

            <p className="page-lead">
              Com o aplicativo da Innova, o beneficiário acessa a carteirinha
              digital, consulta o guia médico, acompanha autorizações e fala com
              o atendimento — tudo em um só lugar, a qualquer hora.
            </p>

            <StoreButtons />

            <p className="app-note">
              Download gratuito na App Store. Em breve também para Android.
            </p>
          </div>

          <div className="app-hero-art" aria-hidden="true">
            <div className="app-phone app-phone--back">
              <img src={appCarteirinha} alt="" />
            </div>
            <div className="app-phone app-phone--front">
              <img src={appHome} alt="" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Recursos ---------- */}
      <section className="app-recursos">
        <div className="shell">
          <div className="recursos-head">
            <p className="section-eyebrow">
              <span className="eyebrow-dash" aria-hidden="true" />
              RECURSOS
            </p>
            <h2 className="section-title">
              Tudo o que você precisa,
              <br />
              sem <span className="accent">burocracia</span>
            </h2>
          </div>

          <div className="recursos-grid" ref={recursosRef}>
            {RECURSOS.map((recurso, i) => (
              <article
                key={recurso.titulo}
                className="recurso-card"
                style={{ '--delay': `${i * 80}ms` } as CSSProperties}
              >
                <span className="recurso-icone" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path
                      d={recurso.icone}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h3>{recurso.titulo}</h3>
                <p>{recurso.texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Como começar ---------- */}
      <section className="app-passos">
        <div className="shell">
          <div className="recursos-head">
            <p className="section-eyebrow">
              <span className="eyebrow-dash" aria-hidden="true" />
              COMO COMEÇAR
            </p>
            <h2 className="section-title">
              Em 3 passos <span className="accent">simples</span>
            </h2>
          </div>

          <div className="passos-grid" ref={passosRef}>
            {PASSOS.map((passo, i) => (
              <article
                key={passo.numero}
                className="passo-card"
                style={{ '--delay': `${i * 90}ms` } as CSSProperties}
              >
                <span className="passo-numero" aria-hidden="true">
                  {passo.numero}
                </span>
                <h3>{passo.titulo}</h3>
                <p>{passo.texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA download ---------- */}
      <section className="app-cta">
        <div className="shell app-cta-inner">
          <div>
            <h2>Baixe agora e tenha a Innova com você</h2>
            <p>
              Gratuito para beneficiários. Já disponível para iPhone na App
              Store — rápido, seguro e sempre atualizado. Em breve também para
              Android.
            </p>
          </div>
          <StoreButtons className="store-buttons--on-dark" />
        </div>
      </section>
    </>
  )
}

export default Aplicativo
