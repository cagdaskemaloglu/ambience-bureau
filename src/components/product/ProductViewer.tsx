'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useLocale } from 'next-intl'
import { useTheme } from '@/components/theme/ThemeProvider'
import { ProductGallery } from './ProductGallery'
import type { HeroWireframeData } from '@/lib/queries'
import type { SanityImage } from '@/types'

const Scene = dynamic(() => import('@/components/home/HeroWireframeScene'), { ssr: false })

type Mode = 'wire' | 'material'

/**
 * Ürün sayfasının sol kolonu: TEL KAFES | MATERYAL düğmesi.
 *  - Materyal: ürün fotoğrafları (ProductGallery, olduğu gibi).
 *  - Tel kafes: masthead'deki 3B çizimin aynısı (halkalar + meridyenler, oda).
 * Varsayılan tema ile gelir: karanlık (tel kafes teması) → tel kafes,
 * aydınlık → materyal. Parça dizilimi kayıtlı olmayan üründe düğme yoktur.
 */
export function ProductViewer({
  images,
  fallbackAlt,
  wireframe,
}: {
  images?: SanityImage[]
  fallbackAlt: string
  wireframe: HeroWireframeData | null
}) {
  const tr = useLocale() === 'tr'
  const { theme } = useTheme()
  const [mode, setMode] = useState<Mode | null>(null)
  const [ready, setReady] = useState(false)
  const [animate, setAnimate] = useState(true)
  const onReady = useCallback(() => setReady(true), [])

  useEffect(() => {
    setAnimate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  if (!wireframe) return <ProductGallery images={images} fallbackAlt={fallbackAlt} />

  const active: Mode = mode ?? (theme === 'dark' ? 'wire' : 'material')
  const btn = (m: Mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      aria-pressed={active === m}
      className={`focus-bureau min-h-[36px] px-3.5 font-mono text-[10.5px] uppercase tracking-widest transition-colors ${
        active === m ? 'bg-bureau-black text-bureau-white' : 'text-bureau-muted hover:text-bureau-black'
      }`}
    >
      {label}
    </button>
  )
  const count = (t: string) => wireframe.parts.filter((p) => p.slotType === t).length

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-bureau-subtle">
          {active === 'wire'
            ? tr
              ? `${count('base')} taban · ${count('body')} gövde · ${count('head')} başlık`
              : `${count('base')} base · ${count('body')} body · ${count('head')} head`
            : tr
              ? 'Kayıt fotoğrafları'
              : 'Record photographs'}
        </span>
        <div role="group" aria-label={tr ? 'Görünüm' : 'View'} className="flex border border-bureau-black">
          {btn('wire', tr ? 'Tel kafes' : 'Wireframe')}
          {btn('material', tr ? 'Materyal' : 'Material')}
        </div>
      </div>

      {active === 'wire' ? (
        <div className="wire-stage relative aspect-square overflow-hidden border border-bureau-black">
          <div className="absolute inset-0">
            <Scene parts={wireframe.parts} tone={theme === 'dark' ? 'night' : 'paper'} running animate={animate} onReady={onReady} />
          </div>
          {!ready && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-widest text-bureau-wire/70">
              {tr ? 'Model çiziliyor…' : 'Drafting model…'}
            </span>
          )}
          <span className="pointer-events-none absolute bottom-3 left-3 font-mono text-[9.5px] uppercase tracking-widest text-bureau-wire/80">
            {tr ? 'Tel kafes' : 'Wireframe'}
            {wireframe.dropNo ? ` · DROP-${wireframe.dropNo}` : ''}
          </span>
        </div>
      ) : (
        <ProductGallery images={images} fallbackAlt={fallbackAlt} />
      )}
    </div>
  )
}
