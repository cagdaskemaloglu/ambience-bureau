'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Link } from '@/i18n/navigation'
import { getLocalizedValue } from '@/lib/sanity'
import type { HeroWireframeData } from '@/lib/queries'
import { useTheme } from '@/components/theme/ThemeProvider'

// three.js yalnızca geniş ekranda ve tarayıcıda yüklenir — telefona inmez.
const Scene = dynamic(() => import('./HeroWireframeScene'), { ssr: false })

/** Bir ürün en az bu kadar ekranda kalır; sıradaki hazır değilse daha uzun. */
const MIN_SHOW_MS = 12000
const FADE_MS = 450

/**
 * Masthead'in ortasındaki "çizim masası": siyahtan uzay mavisine giden
 * zeminde ürünlerin 3B tel kafesi döner. İlk ürün (Extruded Conduit 001)
 * yüklenince sıradaki ürünün STL'leri ARKA PLANDA indirilir; hazır olunca
 * (ve ilki en az MIN_SHOW_MS göründükten sonra) yumuşak geçişle o girer.
 * Yalnızca lg (≥1024px) ekranlarda görünür; ekran dışındayken çizim ve
 * sıra durur; "hareketi azalt" açıksa ilk üründe kalır.
 */
export function HeroWireframe({
  items,
  locale,
  focusCollection = null,
  focusSlug = null,
  active = true,
}: {
  /** Seçilen nesne (ürün slug'ı ya da "model:<id>"): koleksiyondan önce gelir. */
  focusSlug?: string | null
  items: HeroWireframeData[]
  locale: string
  /** Seçilen Özel Tahsis koleksiyonu: sahne o koleksiyonun bir nesnesine geçer, sıra durur. */
  focusCollection?: string | null
  /** false: üstte gömülü konfigüratör açık — sahne çizimi durur (GPU'yu boşalt). */
  active?: boolean
}) {
  const tr = locale === 'tr'
  const { theme } = useTheme()
  const boxRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [visible, setVisible] = useState(true)
  const [animate, setAnimate] = useState(true)
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  const [idx, setIdx] = useState(0)
  // ?wf=<slug|model:id> → görüntüleyici o nesneyle başlar (paylaşılabilir bağlantı).
  useEffect(() => {
    const wf = new URLSearchParams(window.location.search).get('wf')
    if (!wf) return
    const i = items.findIndex((x) => x.slug === wf || x.slug === `model:${wf}`)
    if (i > 0) setIdx(i)
  }, [items])
  const [nextReady, setNextReady] = useState(false)
  const [fading, setFading] = useState(false)
  const shownAt = useRef(0)
  const onPreloaded = useCallback(() => setNextReady(true), [])
  const rotating = items.length > 1 && animate && !focusCollection && !focusSlug
  const nextIdx = (idx + 1) % items.length

  useEffect(() => {
    if (ready && !shownAt.current) shownAt.current = Date.now()
  }, [ready])

  // Sıradaki hazır + süre doldu + görünür → sönerek değiştir.
  useEffect(() => {
    if (!rotating || !ready || !nextReady || !visible) return
    const wait = Math.max(0, MIN_SHOW_MS - (Date.now() - shownAt.current))
    let swap = 0
    const t = window.setTimeout(() => {
      setFading(true)
      swap = window.setTimeout(() => {
        setIdx(nextIdx)
        setNextReady(false)
        shownAt.current = Date.now()
        requestAnimationFrame(() => setFading(false))
      }, FADE_MS)
    }, wait)
    return () => {
      window.clearTimeout(t)
      window.clearTimeout(swap)
    }
  }, [rotating, ready, nextReady, visible, nextIdx])

  // Koleksiyon seçildi: tel kafes o koleksiyonun ilk nesnesine geçer.
  useEffect(() => {
    if (!focusCollection && !focusSlug) return
    let i = focusSlug ? items.findIndex((x) => x.slug === focusSlug) : -1
    if (i < 0 && focusCollection) i = items.findIndex((x) => x.collectionKey === focusCollection)
    if (i >= 0) {
      setIdx(i)
      setFading(false)
    }
  }, [focusCollection, focusSlug, items])

  const data = items[idx]

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)')
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      setEnabled(wide.matches)
      setAnimate(!motion.matches)
    }
    setAnimate(!motion.matches)
    // three.js'i sayfa etkileşime hazır olduktan SONRA başlat: önce
    // hidrasyon ve bağlantı ön yüklemeleri bitsin, tel kafes sonra gelsin.
    const start = () => setEnabled(wide.matches)
    const hasIdle = typeof window.requestIdleCallback === 'function'
    const idle = hasIdle ? window.requestIdleCallback(start, { timeout: 2500 }) : window.setTimeout(start, 1200)
    wide.addEventListener('change', sync)
    motion.addEventListener('change', sync)
    return () => {
      if (hasIdle) window.cancelIdleCallback(idle)
      else window.clearTimeout(idle)
      wide.removeEventListener('change', sync)
      motion.removeEventListener('change', sync)
    }
  }, [])

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const name = getLocalizedValue(data.name, locale, '') ?? ''
  const count = (t: string) => data.parts.filter((p) => p.slotType === t).length
  const [baseN, bodyN, headN] = [count('base'), count('body'), count('head')]
  const labelFade = { opacity: fading ? 0 : 1, transition: `opacity ${FADE_MS}ms ease-out` }

  return (
    <div ref={boxRef} className="absolute inset-0 hidden lg:block">
      {/* İlk ekranın TAMAMINA yayılan sahne: header'ın hemen altından başlar,
          kenarlara doğru iyice siyaha erir (vinyet), metin ve paneller üstünde. */}
      <div className="hero-wireframe absolute inset-0">
        {enabled && (
          <div className="absolute inset-0 transition-opacity ease-out" style={{ opacity: fading ? 0 : 1, transitionDuration: `${FADE_MS}ms` }}>
            <Scene
              item={data}
              tone={theme === 'dark' ? 'night' : 'paper'}
              preloadUrls={rotating && ready ? items[nextIdx].parts.map((p) => p.url) : undefined}
              running={visible && active}
              animate={animate}
              onReady={onReady}
              onPreloaded={onPreloaded}
            />
          </div>
        )}
      </div>
      <div aria-hidden="true" className="hero-vignette pointer-events-none absolute inset-0" />

      {!ready && enabled && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-widest text-bureau-wire/60">
          {tr ? 'Model çiziliyor…' : 'Drafting model…'}
        </span>
      )}
      {/* Çizim masası künyesi — sahnenin altında (üst kenar sahneye kaldı) */}
      <div className="pointer-events-none absolute bottom-[38px] left-1/2 flex w-[min(560px,38%)] -translate-x-1/2 items-center justify-between gap-3 whitespace-nowrap font-mono text-[9.5px] uppercase tracking-widest text-bureau-wire/80">
        <span style={labelFade}>{tr ? 'Tel kafes' : 'Wireframe'}{data.tag ? ` · ${tr ? data.tag : data.tag.replace('SINIF', 'CLASS')}` : ''}</span>
        <span className="hidden tabular-nums xl:inline" style={labelFade}>
          {data.kind === 'placed'
            ? tr
              ? `${data.parts.length} parça${data.hanging ? ' · tavandan' : ''}`
              : `${data.parts.length} part${data.parts.length === 1 ? '' : 's'}${data.hanging ? ' · ceiling' : ''}`
            : tr
              ? `${baseN} taban · ${bodyN} gövde · ${headN} başlık`
              : `${baseN} base · ${bodyN} body · ${headN} head`}
          {items.length > 1 ? ` · ${String(idx + 1).padStart(2, '0')}/${String(items.length).padStart(2, '0')}` : ''}
        </span>
      </div>
      <div className="absolute bottom-0 left-1/2 z-20 flex w-[min(560px,38%)] -translate-x-1/2 items-end justify-between gap-3 whitespace-nowrap py-4" style={labelFade}>
        <span className="truncate font-mono text-[10px] uppercase tracking-wider text-bureau-black/85">{name}</span>
        <Link
          href={data.href}
          className="focus-bureau flex-shrink-0 font-mono text-[10px] uppercase tracking-wider text-bureau-amber no-underline hover:underline"
        >
          {data.kind === 'placed' ? (tr ? 'Tasarla →' : 'Design →') : tr ? 'Kaydı aç →' : 'Open record →'}
        </Link>
      </div>
    </div>
  )
}
