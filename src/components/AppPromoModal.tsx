import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { ROUTES } from '../routes'
import promoApp from '../assets/promo-app.webp'

/*
 * Modal de divulgação do aplicativo.
 *
 * Mostra ao visitante, logo na entrada do site, que a Innova já tem app para
 * Android e iOS, levando para a página /aplicativo. Aparece uma vez por sessão
 * do navegador e não é exibido quando a pessoa já está na própria página do
 * aplicativo. Para relançar a campanha (nova arte), basta trocar a imagem e
 * atualizar PROMO_ID.
 */
const PROMO_ID = 'app-android-ios-2026-10'
const STORAGE_KEY = `promo-visto:${PROMO_ID}`

function AppPromoModal() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    /* Já está na página do app: não faz sentido divulgar. */
    if (pathname === ROUTES.aplicativo) return
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return
    } catch {
      /* sessionStorage indisponível: mostramos mesmo assim */
    }
    setOpen(true)
  }, [pathname])

  function fechar() {
    setOpen(false)
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* sem persistência: o modal pode reaparecer, tudo bem */
    }
  }

  function irParaApp() {
    fechar()
    navigate(ROUTES.aplicativo)
  }

  /* Fecha com a tecla Esc. */
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') fechar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  return (
    <div
      className="promo-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Agora temos aplicativo"
      onClick={fechar}
    >
      <div className="promo-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="promo-close" onClick={fechar} aria-label="Fechar aviso">
          <X size={22} aria-hidden="true" />
        </button>

        <button className="promo-img-btn" onClick={irParaApp} aria-label="Ver a página do aplicativo">
          <img
            className="promo-img"
            src={promoApp}
            alt="Agora temos aplicativo no Android e no iOS. Acesse o menu Aplicativo no site da Innova para baixar o app."
          />
        </button>

        <div className="promo-actions">
          <Link className="btn btn-primary" to={ROUTES.aplicativo} onClick={fechar}>
            Conhecer o aplicativo <span aria-hidden="true">→</span>
          </Link>
          <button className="promo-later" onClick={fechar}>
            Agora não
          </button>
        </div>
      </div>
    </div>
  )
}

export default AppPromoModal
