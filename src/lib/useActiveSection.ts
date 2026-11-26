'use client'

import { useEffect, useState } from 'react'

/**
 * Anasayfadaki hangi bölümün (§1, §2, §3...) ekranda olduğunu izler —
 * header'daki bölüm linklerinin altını çizmek için. Bölüm başlığı değil,
 * bölümün TAMAMI (`closest('section')`) gözlenir; kaydırma alanı <main>.
 * `enabled` false ise (anasayfa dışı) hiçbir şey yapmaz.
 */
export function useActiveSection(ids: string[], enabled: boolean): string | null {
  const [active, setActive] = useState<string | null>(null)
  const key = ids.join('|')

  useEffect(() => {
    if (!enabled) {
      setActive(null)
      return
    }
    const targets = new Map<Element, string>()
    for (const id of key.split('|')) {
      const el = document.getElementById(id)
      if (el) targets.set(el.closest('section') ?? el, id)
    }
    if (targets.size === 0) return
    const root = document.getElementById('main-content')
    const visible = new Map<string, number>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = targets.get(e.target)
          if (id) visible.set(id, e.isIntersecting ? e.boundingClientRect.top : Infinity)
        }
        let best: string | null = null
        let bestTop = Infinity
        for (const [id, top] of visible) {
          if (top !== Infinity && Math.abs(top) < Math.abs(bestTop)) {
            best = id
            bestTop = top
          }
        }
        setActive(best)
      },
      { root, rootMargin: '-20% 0px -55% 0px' }
    )
    targets.forEach((_, el) => io.observe(el))
    return () => io.disconnect()
  }, [key, enabled])

  return active
}

/**
 * Anasayfa bölümüne git. Anasayfa artık header + footer + TEK seçim
 * alanından oluşuyor; "Tüm Kayıtlar" gibi bölümler ancak seçilince DOM'a
 * girer. Bu yüzden hash'i güncelleyip `hashchange` yayınlıyoruz:
 * HomeIndex ilgili satırı seçip oraya kaydırır. Öğe zaten varsa ayrıca
 * yumuşak kaydırılır (hareketi azalt ayarına saygılı).
 */
export function scrollToSection(id: string) {
  if (window.location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}
