import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import avisoImg from '../assets/aviso-portal-prestador.webp'

/*
 * Popup de comunicado aos clientes/prestadores.
 *
 * Exibe uma imagem de aviso assim que a pessoa entra no site. Para nao
 * incomodar durante a navegacao, aparece apenas uma vez por sessao do
 * navegador (sessionStorage). Quando o comunicado mudar, basta trocar a
 * imagem e atualizar AVISO_ID para que o popup volte a aparecer.
 */
const AVISO_ID = 'portal-prestador-2026-10'
const STORAGE_KEY = `aviso-visto:${AVISO_ID}`

function AvisoModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return
    } catch {
      /* sessionStorage indisponivel (aba anonima/bloqueado): mostramos mesmo assim */
    }
    setOpen(true)
  }, [])

  function fechar() {
    setOpen(false)
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* sem persistencia: o popup pode reaparecer, tudo bem */
    }
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
      className="aviso-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Comunicado importante"
      onClick={fechar}
    >
      <div className="aviso-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="aviso-close" onClick={fechar} aria-label="Fechar comunicado">
          <X size={22} aria-hidden="true" />
        </button>
        <img
          className="aviso-img"
          src={avisoImg}
          alt="Comunicado: problema de acesso ao Portal do Prestador. Suporte atuando para normalizar. Telefones 0800 345 9999 e 92 99374-8838."
        />
      </div>
    </div>
  )
}

export default AvisoModal
