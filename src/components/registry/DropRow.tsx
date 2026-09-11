'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { getLocalizedValue } from '@/lib/sanity'
import { ProductCard } from './ProductCard'
import type { DropWithProducts } from '@/types'

// Bir kartın sabit genişliği (px) — satırdaki tüm kartlar bu genişlikte,
// kaç tanesinin sığdığı buna göre hesaplanır. ProductCard kendi içinde
// %100 genişlik kullanıyor, bu yüzden sadece dış sarmalayıcının
// genişliğini sabitlememiz yeterli.
const CARD_WIDTH = 210
const CARD_GAP = 12 // gap-3

export function DropRow({ drop }: { drop: DropWithProducts }) {
  const locale = useLocale()
  const t = useTranslations('home')
  const containerRef = useRef<HTMLDivElement>(null)
  // Ölçülene kadar (ilk render/SSR) tüm ürünleri göster — sonraki
  // ölçümde gerçek sığan sayıya göre kırpılır, layout shift'i minimize eder.
  const [fitCount, setFitCount] = useState(drop.products.length)

  useEffect(() => {
    function recompute() {
      const el = containerRef.current
      if (!el) return
      const width = el.clientWidth
      const fit = Math.max(1, Math.floor((width + CARD_GAP) / (CARD_WIDTH + CARD_GAP)))
      setFitCount(fit)
    }

    recompute()
    const observer = new ResizeObserver(recompute)
    if (containerRef.current) observer.observe(containerRef.current)
    window.addEventListener('resize', recompute)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', recompute)
    }
  }, [])

  const name = getLocalizedValue(drop.name, locale, '—')
  const hasMore = drop.products.length > fitCount
  // Taşma varsa: son slotu "Devamını Görüntüle" kartına ayır, satır tam dolsun.
  const visibleProducts = hasMore ? drop.products.slice(0, Math.max(1, fitCount - 1)) : drop.products.slice(0, fitCount)

  return (
    <section className="border-b border-bureau-black">
      <div className="flex items-baseline justify-between border-b border-dashed border-bureau-rule px-5 py-2.5 md:px-9">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-bureau-black">
          DROP-{drop.dropNo}
          <span className="ml-2 font-normal text-bureau-muted">{name}</span>
        </h2>
        {hasMore && (
          <Link
            href={`/registry?drop=${drop.dropNo}`}
            className="whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-bureau-amber no-underline hover:opacity-70"
          >
            {t('viewMore')} →
          </Link>
        )}
      </div>

      <div ref={containerRef} className="flex flex-nowrap gap-3 overflow-hidden px-5 py-3 md:px-9">
        {visibleProducts.map((product) => (
          <div key={product._id} style={{ width: CARD_WIDTH, flexShrink: 0 }}>
            <ProductCard product={product} />
          </div>
        ))}

        {hasMore && (
          <Link
            href={`/registry?drop=${drop.dropNo}`}
            style={{ width: CARD_WIDTH, flexShrink: 0 }}
            className="flex aspect-[3/4] flex-col items-center justify-center gap-2 border border-dashed border-bureau-black/40 p-4 text-center no-underline transition-colors hover:border-bureau-amber hover:bg-bureau-surface"
          >
            <span className="font-mono text-[10px] uppercase tracking-wider text-bureau-amber">
              {t('viewMore')}
            </span>
            <span className="font-mono text-[18px] text-bureau-amber">→</span>
          </Link>
        )}
      </div>
    </section>
  )
}