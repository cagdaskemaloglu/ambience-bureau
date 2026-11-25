'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Link } from '@/i18n/navigation'
import { getLocalizedValue } from '@/lib/sanity'
import type { HeroWireframeData } from '@/lib/queries'

// three.js yalnızca geniş ekranda ve tarayıcıda yüklenir — telefona inmez.
const Scene = dynamic(() => import('./HeroWireframeScene'), { ssr: false })

/**
 * Masthead'in ortasındaki "çizim masası": siyahtan uzay mavisine giden
 * zeminde, Extruded Conduit drop'undan bir ürünün 3B tel kafesi döner.
 * Yalnızca lg (≥1024px) ekranlarda görünür; ekran dışındayken çizim durur.
 */
export function HeroWireframe({ data, locale }: { data: HeroWireframeData; locale: string }) {
  const tr = locale === 'tr'
  const boxRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [visible, setVisible] = useState(true)
  const [animate, setAnimate] = useState(true)
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])

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
  const bodyCount = data.parts.filter((p) => p.slotType === 'body').length

  return (
    <div
      ref={boxRef}
      className="relative hidden min-h-[300px] self-stretch lg:-my-8 lg:block"
    >
      {/* Çerçevesiz: zemin header'ın hemen altından başlar, kenarlara doğru
          maskeyle sayfaya erir — kutu değil, header'ın uzantısı gibi. */}
      <div className="hero-wireframe absolute inset-0">
        {enabled && <Scene parts={data.parts} running={visible} animate={animate} onReady={onReady} />}
      </div>

      {/* Çizim masası künyesi */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-3 whitespace-nowrap px-[9%] py-3 font-mono text-[9.5px] uppercase tracking-widest text-[#a9c8ff]/80">
        <span>{tr ? 'Tel kafes' : 'Wireframe'}{data.dropNo ? ` · DROP-${data.dropNo}` : ''}</span>
        <span className="hidden tabular-nums xl:inline">
          {tr ? `1 taban · ${bodyCount} gövde · 1 başlık` : `1 base · ${bodyCount} body · 1 head`}
        </span>
      </div>
      {!ready && enabled && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-widest text-[#a9c8ff]/60">
          {tr ? 'Model çiziliyor…' : 'Drafting model…'}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 whitespace-nowrap px-[9%] py-3">
        <span className="truncate font-mono text-[10px] uppercase tracking-wider text-white/85">{name}</span>
        <Link
          href={`/registry/${data.slug}`}
          className="focus-bureau flex-shrink-0 font-mono text-[10px] uppercase tracking-wider text-[#f2a35e] no-underline hover:underline"
        >
          {tr ? 'Kaydı aç →' : 'Open record →'}
        </Link>
      </div>
    </div>
  )
}
