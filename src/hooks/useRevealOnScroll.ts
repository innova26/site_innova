import { useEffect, useRef } from 'react'

/**
 * Adiciona a classe `is-visible` aos elementos que casam com `selector`
 * conforme eles entram na viewport, permitindo revelacao escalonada via CSS.
 * Com `prefers-reduced-motion`, tudo ja nasce visivel.
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
      items.forEach((item) => item.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
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
