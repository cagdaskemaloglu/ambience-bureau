'use client'

import { useEffect, useState } from 'react'

export interface SectionLink {
  id: string
  number: string
  tr: string
  en: string
}

/**
 * Tek sayfa bölüm çubuğu (§1 · §2 · §3 ...). Masthead'in hemen altında
 * durur, aşağı kaydırınca <main>'in üstüne YAPIŞIR; böylece bölüm
 * butonları tıklanınca/kaydırınca ekrandan kaybolmaz. Ekranda olan bölüm
 * amber çizgiyle işaretlenir.
 */
export function SectionNav({ links, locale }: { links: SectionLink[]; locale: string }) {
  const tr = locale === 'tr'
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    // Bölüm başlığı değil, bölümün TAMAMI gözlenir (başlık ekrandan çıksa da
    // aktif kalsın); hedef elemandan bağlantı kimliğine eşleme tutulur.
    const targets = new Map<Element, string>()
    for (const l of links) {
      const el = document.getElementById(l.id)
      if (el) targets.set(el.closest('section') ?? el, l.id)
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
        // Ekranın üst yarısına en yakın görünür bölüm aktif sayılır.
        let best: string | null = null
        let bestTop = Infinity
        for (const [id, top] of visible) {
          if (top !== Infinity && Math.abs(top) < Math.abs(bestTop)) {
            best = id
            bestTop = top
          }
        }
        if (best) setActive(best)
      },
      { root, rootMargin: '-20% 0px -55% 0px' }
    )
    targets.forEach((_, el) => io.observe(el))
    return () => io.disconnect()
  }, [links])

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    setActive(id)
  }

  return (
    <nav
      aria-label={tr ? 'Sayfa bölümleri' : 'Page sections'}
      className="sticky top-0 z-30 border-b border-bureau-rule bg-bureau-white/90 backdrop-blur-sm"
    >
      <ul className="scrollbar-none flex gap-1 overflow-x-auto px-5 md:gap-2 md:px-9">
        {links.map((l) => {
          const isActive = active === l.id
          return (
            <li key={l.id} className="shrink-0">
              <a
                href={`#${l.id}`}
                onClick={go(l.id)}
                aria-current={isActive ? 'location' : undefined}
                className={`focus-bureau relative block px-2.5 py-3 font-mono text-[10.5px] uppercase tracking-wider no-underline transition-colors after:absolute after:inset-x-2.5 after:bottom-0 after:h-[2px] after:origin-left after:bg-bureau-amber after:transition-transform after:duration-300 ${
                  isActive
                    ? 'text-bureau-black after:scale-x-100'
                    : 'text-bureau-muted after:scale-x-0 hover:text-bureau-black hover:after:scale-x-100'
                }`}
              >
                <span className="text-bureau-amber">§{l.number}</span> {tr ? l.tr : l.en}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
