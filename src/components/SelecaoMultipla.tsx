import { useEffect, useMemo, useRef, useState } from 'react'

type Props = {
  /** Opções disponíveis para escolher. */
  opcoes: string[]
  /** Valores atualmente selecionados. */
  selecionados: string[]
  onChange: (novos: string[]) => void
  placeholder?: string
  /** Permite criar um valor que não existe na lista. Padrão: true. */
  permitirNovo?: boolean
  id?: string
}

/**
 * Select múltiplo com busca e checkboxes. O usuário procura digitando,
 * marca quantas quiser e pode adicionar uma opção nova que não exista.
 */
function SelecaoMultipla({
  opcoes,
  selecionados,
  onChange,
  placeholder = 'Selecione…',
  permitirNovo = true,
  id,
}: Props) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  /* fecha ao clicar fora */
  useEffect(() => {
    if (!aberto) return
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [aberto])

  const termo = busca.trim()

  /* união das opções + selecionados (garante mostrar itens fora da lista base) */
  const todas = useMemo(
    () => [...new Set([...opcoes, ...selecionados])],
    [opcoes, selecionados],
  )

  const filtradas = useMemo(() => {
    const t = termo.toLowerCase()
    return todas
      .filter((o) => o.toLowerCase().includes(t))
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [todas, termo])

  const existeExata = todas.some(
    (o) => o.toLowerCase() === termo.toLowerCase(),
  )

  const toggle = (valor: string) =>
    onChange(
      selecionados.includes(valor)
        ? selecionados.filter((v) => v !== valor)
        : [...selecionados, valor],
    )

  const adicionarNovo = () => {
    if (!termo || existeExata) return
    onChange([...selecionados, termo])
    setBusca('')
  }

  return (
    <div className="msel" ref={ref}>
      <button
        type="button"
        id={id}
        className={`msel-control${aberto ? ' aberto' : ''}`}
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
      >
        {selecionados.length === 0 ? (
          <span className="msel-placeholder">{placeholder}</span>
        ) : (
          <span className="msel-chips">
            {selecionados.map((s) => (
              <span key={s} className="msel-chip">
                {s}
                <span
                  role="button"
                  aria-label={`Remover ${s}`}
                  className="msel-chip-x"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggle(s)
                  }}
                >
                  ×
                </span>
              </span>
            ))}
          </span>
        )}
        <span className="msel-seta" aria-hidden="true" />
      </button>

      {aberto && (
        <div className="msel-pop">
          <input
            className="msel-busca"
            type="search"
            autoFocus
            placeholder="Procurar…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <ul className="msel-lista" role="listbox" aria-multiselectable="true">
            {filtradas.map((o) => (
              <li key={o}>
                <label className="msel-item">
                  <input
                    type="checkbox"
                    checked={selecionados.includes(o)}
                    onChange={() => toggle(o)}
                  />
                  <span>{o}</span>
                </label>
              </li>
            ))}
            {filtradas.length === 0 && (
              <li className="msel-nada">Nenhuma opção encontrada</li>
            )}
          </ul>

          {permitirNovo && termo && !existeExata && (
            <button
              type="button"
              className="msel-add"
              onClick={adicionarNovo}
            >
              + Adicionar “{termo}”
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default SelecaoMultipla
