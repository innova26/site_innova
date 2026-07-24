import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { NAV_ITEMS, ROUTES } from '../routes'

function Caret() {
  return (
    <svg className="caret" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 9.5l6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SiteHeader() {
  const [portaisOpen, setPortaisOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const portaisRef = useRef<HTMLDivElement>(null)

  /* Fecha o dropdown ao clicar fora ou apertar Esc */
  useEffect(() => {
    if (!portaisOpen) return

    const onPointerDown = (event: PointerEvent) => {
      if (!portaisRef.current?.contains(event.target as Node)) {
        setPortaisOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPortaisOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [portaisOpen])

  /* Trava o scroll do fundo enquanto o menu mobile esta aberto */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const closeAll = () => {
    setMenuOpen(false)
    setPortaisOpen(false)
  }

  const renderLinks = (onNavigate?: () => void) =>
    NAV_ITEMS.map((item) =>
      item.submenu ? (
        <div
          key={item.label}
          className={`nav-group${portaisOpen ? ' is-open' : ''}`}
          ref={portaisRef}
        >
          <button
            type="button"
            className="nav-link nav-trigger"
            aria-expanded={portaisOpen}
            aria-haspopup="true"
            onClick={() => setPortaisOpen((open) => !open)}
          >
            {item.label}
            <Caret />
          </button>

          <ul className="nav-submenu">
            {item.submenu.map((sub) => (
              <li key={sub.label}>
                {/* portais sao sistemas externos */}
                <a
                  href={sub.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={onNavigate}
                >
                  {sub.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <NavLink
          key={item.label}
          to={item.to!}
          end={item.to === ROUTES.home}
          className={({ isActive }) =>
            isActive ? 'nav-link is-active' : 'nav-link'
          }
          onClick={onNavigate}
        >
          {item.label}
        </NavLink>
      ),
    )

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" to={ROUTES.home} onClick={closeAll}>
          <span className="brand-top">Innova</span>
          <span className="brand-sub">operadora de saúde</span>
        </Link>

        <nav className="nav" aria-label="Principal">
          {renderLinks()}
        </nav>

        <a className="btn btn-primary header-cta" href="#contato">
          FALE COM ESPECIALISTA
        </a>

        <button
          type="button"
          className={`burger${menuOpen ? ' is-open' : ''}`}
          aria-expanded={menuOpen}
          aria-controls="menu-mobile"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div
        id="menu-mobile"
        className={`mobile-menu${menuOpen ? ' is-open' : ''}`}
        hidden={!menuOpen}
      >
        <nav className="mobile-nav" aria-label="Principal (mobile)">
          {renderLinks(closeAll)}
        </nav>

        <a className="btn btn-primary" href="#contato" onClick={closeAll}>
          FALE COM ESPECIALISTA
        </a>
      </div>
    </header>
  )
}

export default SiteHeader
