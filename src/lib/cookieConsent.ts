/*
 * Gerenciamento de consentimento de cookies (LGPD).
 *
 * O estado fica no localStorage e e observavel: o banner grava a escolha e os
 * consumidores (ex.: Analytics) reagem via `subscribe`. Cookies necessarios
 * estao sempre ligados; a unica categoria opcional hoje e `analytics`
 * (Vercel Analytics + Speed Insights).
 */

export type CookieConsent = {
  analytics: boolean
  /* Momento da decisao, em ISO — util para reexibir o banner apos um tempo. */
  timestamp: string
}

const STORAGE_KEY = 'innova-cookie-consent'

/* Evento interno para notificar mudancas na mesma aba (o `storage` do browser
   so dispara em outras abas). */
const CHANGE_EVENT = 'innova:cookie-consent'

export function getConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<CookieConsent>
    if (typeof parsed.analytics !== 'boolean') return null
    return {
      analytics: parsed.analytics,
      timestamp: parsed.timestamp ?? new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function setConsent(analytics: boolean): void {
  if (typeof window === 'undefined') return
  const value: CookieConsent = {
    analytics,
    timestamp: new Date().toISOString(),
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent<CookieConsent>(CHANGE_EVENT, { detail: value }))
}

/* Inscreve-se em mudancas de consentimento. Retorna a funcao de limpeza. */
export function subscribe(listener: (consent: CookieConsent | null) => void): () => void {
  const handler = () => listener(getConsent())
  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}
