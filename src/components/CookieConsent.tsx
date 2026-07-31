import { useEffect, useState } from 'react'
import { getConsent, setConsent } from '../lib/cookieConsent'

/*
 * Banner de consentimento de cookies (LGPD).
 *
 * Aparece na primeira visita ate o usuario decidir. Pode ser reaberto pelo
 * link "Gerenciar Cookies" do rodape, que aponta para `#cookies` — ouvimos a
 * mudanca de hash para reexibir o painel de preferencias.
 */
function CookieConsent() {
  const [open, setOpen] = useState(false)
  const [showPrefs, setShowPrefs] = useState(false)
  const [analytics, setAnalytics] = useState(true)

  /* Primeira visita: sem escolha registrada -> mostra o banner. */
  useEffect(() => {
    if (!getConsent()) setOpen(true)
  }, [])

  /* Reabre pelo link do rodape (#cookies), ja no modo de preferencias. */
  useEffect(() => {
    function abrirPreferencias() {
      if (window.location.hash !== '#cookies') return
      const atual = getConsent()
      setAnalytics(atual?.analytics ?? true)
      setShowPrefs(true)
      setOpen(true)
      /* Limpa o hash para permitir clicar no link de novo depois de fechar. */
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    abrirPreferencias()
    window.addEventListener('hashchange', abrirPreferencias)
    return () => window.removeEventListener('hashchange', abrirPreferencias)
  }, [])

  function decidir(valorAnalytics: boolean) {
    setConsent(valorAnalytics)
    setOpen(false)
    setShowPrefs(false)
  }

  if (!open) return null

  return (
    <div className="cookie-banner" role="dialog" aria-modal="false" aria-label="Aviso de cookies">
      <div className="cookie-inner">
        <div className="cookie-text">
          <h2>Nós usamos cookies</h2>
          <p>
            Utilizamos cookies para melhorar sua experiência de navegação e
            analisar o tráfego do site. Os cookies necessários são sempre
            ativos. Você pode aceitar todos, recusar os opcionais ou gerenciar
            suas preferências. Saiba mais na nossa{' '}
            <a href="#privacidade">Política de Privacidade</a>.
          </p>

          {showPrefs && (
            <div className="cookie-prefs">
              <label className="cookie-option cookie-option--locked">
                <input type="checkbox" checked disabled />
                <span>
                  <strong>Necessários</strong>
                  <small>Essenciais para o funcionamento do site. Sempre ativos.</small>
                </span>
              </label>
              <label className="cookie-option">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                />
                <span>
                  <strong>Análise e desempenho</strong>
                  <small>
                    Ajudam a entender como o site é usado (Vercel Analytics e
                    Speed Insights).
                  </small>
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="cookie-actions">
          {showPrefs ? (
            <button className="btn btn-primary" onClick={() => decidir(analytics)}>
              Salvar preferências
            </button>
          ) : (
            <>
              <button className="btn btn-primary" onClick={() => decidir(true)}>
                Aceitar todos
              </button>
              <button className="btn btn-ghost" onClick={() => decidir(false)}>
                Recusar opcionais
              </button>
              <button
                className="cookie-link"
                onClick={() => setShowPrefs(true)}
              >
                Gerenciar preferências
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CookieConsent
