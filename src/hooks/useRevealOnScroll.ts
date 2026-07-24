import { useEffect, useRef } from 'react'

/**
 * Marca com `data-revealed` os elementos que casam com `selector` conforme
 * eles entram na viewport, permitindo revelacao escalonada via CSS.
 * Com `prefers-reduced-motion`, tudo ja nasce visivel.
 *
 * Usa atributo em vez de classe de proposito: o React reescreve `className`
 * a cada re-render a partir do JSX, o que apagaria uma classe adicionada
 * imperativamente aqui (era o que fazia o item do FAQ sumir ao ser aberto).
 * `data-revealed` nao e gerenciado pelo React, entao sobrevive ao re-render.
 */
export function useRevealOnScroll<T extends HTMLElement>(selector: string) {
  const containerRef = useRef<T>(null)

  useEffect(() => {
    const items = containerRef.current?.querySelectorAll(selector)
    if (!items?.length) return

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (reduceMotion) {
      items.forEach((item) => item.setAttribute('data-revealed', 'true'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-revealed', 'true')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.2 },
    )

    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [selector])

  return containerRef
}
