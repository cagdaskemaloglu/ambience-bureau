'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { getLocalizedValue } from '@/lib/sanity'
import { ProductCard } from './ProductCard'
import type { DropWithProducts, LocalizedString } from '@/types'

// Bir kartın sabit genişliği (px) — satırdaki tüm kartlar bu genişlikte,
// kaç tanesinin sığdığı buna göre hesaplanır. ProductCard kendi içinde
// %100 genişlik kullanıyor, bu yüzden sadece dış sarmalayıcının
// genişliğini sabitlememiz yeterli.
// Fotoğrafların gerçek oranı 3:4 (dikey) — registry ile birebir aynı,
// kanıtlanmış doğru oran (bkz. ProductCard'a geçilen `compact` prop'u).
const CARD_WIDTH = 263
const CARD_MEDIA_ASPECT = 'aspect-[3/4]'
const CARD_GAP = 12 // gap-3

export interface DropNavInfo {
  dropNo: string
  name: LocalizedString[]
}

export function dropSectionId(dropNo: string): string {
  return `drop-${dropNo}`
}

function scrollToDrop(dropNo: string) {
  document.getElementById(dropSectionId(dropNo))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/**
 * Anasayfada bir Drop'un bölümü:
 *  - Üstte, eski sistemdeki gibi ince bir başlık satırı ("DROP-XXX
 *    [isim]", kesikli alt çizgi) — tüm bölüm genişliğinde.
 *  - Altında: ürün satırı (soldan başlayarak dizilir, ortalanmaz) +
 *    siyah bir Drop etiket paneli (Drop No, isim, "Hepsini Keşfet"
 *    butonu, bir önceki/sonraki Drop'a kaydıran linkler).
 *
 * Panel, TEK numaralı Drop'larda (1., 3., 5. ...) SAĞDA, ÇİFT
 * numaralılarda (2., 4., 6. ...) SOLDA durur — asimetrik/zigzag bir
 * düzen için (bkz. `index` prop'u, page.tsx'ten 0-tabanlı geliyor).
 *
 * Bölüm YÜKSEKLİĞİ artık ekrana sabitlenmiyor (min-h-screen kaldırıldı)
 * — sadece kendi içeriği kadar yer kaplar, üst/alt fazla boşluk yok.
 * Panel yine de ürün satırıyla AYNI yükseklikte durur (flex'in doğal
 * "stretch" davranışı sayesinde).
 *
 * `prevDrop`/`nextDrop` verilmezse (null) ilgili yön linki hiç
 * gösterilmez — ilk Drop'ta "yukarı" (bir önceki) linki, son Drop'ta
 * "aşağı" (bir sonraki) linki olmaz.
 */
export function DropRow({
  drop,
  index,
  prevDrop,
  nextDrop,
}: {
  drop: DropWithProducts
  /** 0-tabanlı sıra — tek/çift Drop'larda panelin hangi tarafta duracağını belirler. */
  index: number
  prevDrop?: DropNavInfo | null
  nextDrop?: DropNavInfo | null
}) {
  const locale = useLocale()
  const t = useTranslations('home')
  const rowRef = useRef<HTMLDivElement>(null)
  // Ölçülene kadar (ilk render/SSR) tüm ürünleri göster — sonraki
  // ölçümde gerçek sığan sayıya göre kırpılır, layout shift'i minimize eder.
  const [fitCount, setFitCount] = useState(drop.products.length)

  useEffect(() => {
    function recompute() {
      const el = rowRef.current
      if (!el) return
      const width = el.clientWidth
      const fit = Math.max(1, Math.floor((width + CARD_GAP) / (CARD_WIDTH + CARD_GAP)))
      setFitCount(fit)
    }

    recompute()
    const observer = new ResizeObserver(recompute)
    if (rowRef.current) observer.observe(rowRef.current)
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

  // index 0 = 1. Drop (tek) → panel SAĞDA (varsayılan sıra).
  // index 1 = 2. Drop (çift) → panel SOLDA (ters sıra).
  const panelOnLeft = index % 2 === 1

  const createHref = drop.configuratorCollectionKey
    ? `/custom-registry?collection=${encodeURIComponent(drop.configuratorCollectionKey)}`
    : '/custom-registry'

  return (
    <section id={dropSectionId(drop.dropNo)} className="border-b border-bureau-fixed-black">
      {/* Eski sistemdeki başlık satırı */}
      <div className="border-b border-dashed border-bureau-fixed-rule px-5 py-2.5 md:px-9">
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-bureau-fixed-black">
          <span className="text-bureau-fixed-amber">DROP-{drop.dropNo}</span>
          <span className="ml-2 font-normal text-bureau-fixed-muted">{name}</span>
        </h2>
      </div>

      <div className={`flex flex-col ${panelOnLeft ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
        {/* Ürün satırı — soldan başlayarak dizilir (ortalanmaz) */}
        <div
          ref={rowRef}
          className="flex flex-wrap items-start justify-start gap-3 px-5 py-6 md:w-4/5 md:px-9"
        >
          {visibleProducts.map((product) => (
            <div key={product._id} style={{ width: CARD_WIDTH, flexShrink: 0 }}>
              <ProductCard product={product} mediaAspectClassName={CARD_MEDIA_ASPECT} compact />
            </div>
          ))}

          {hasMore && (
            <Link
              href={`/registry?drop=${drop.dropNo}`}
              style={{ width: CARD_WIDTH, flexShrink: 0 }}
              className={`flex ${CARD_MEDIA_ASPECT} flex-col items-center justify-center gap-2 border border-dashed border-bureau-fixed-black/40 p-4 text-center no-underline transition-colors hover:border-bureau-fixed-amber hover:bg-bureau-fixed-surface`}
            >
              <span className="font-mono text-[10px] uppercase tracking-wider text-bureau-fixed-amber">
                {t('viewMore')}
              </span>
              <span className="font-mono text-[18px] text-bureau-fixed-amber">→</span>
            </Link>
          )}
        </div>

        {/* Siyah Drop etiket paneli — `group` + stretch sayesinde ürün
            satırıyla AYNI yükseklikte olur, içeriği ortalanır. */}
        <div className="group relative flex w-full flex-shrink-0 flex-col items-center justify-center overflow-hidden border-t border-bureau-fixed-black bg-bureau-fixed-black p-6 text-center text-white md:w-1/5 md:border-t-0 md:border-l md:border-r-0">
          {/* Düz siyahı kıran, hover'da hafifçe canlanan iki glow katmanı —
              biri sıcak/amber (sol-üst), biri soğuk/loş (sağ-alt), panelin
              KENDİ kutusuna göre sabit yüzdelerle konumlanıyor. Panel sayfada
              SOLDA durduğunda (panelOnLeft) bu "sıcak dışa, soğuk içe" yerleşim
              zaten sayfanın koyu zeminiyle uyumlu görünüyor — dokunmuyoruz.
              Panel SAĞDA durduğunda ise aynı sabit yerleşim tam tersine
              düşüyor (sıcak içe, soğuk dışa) ve panel hover'da zeminden
              "kopmuş" görünüyor. Bunu düzeltmek için SADECE bu dekoratif
              katmanı (yazı/buton içeren içerik katmanına DOKUNMADAN) yatayda
              aynalıyoruz — böylece panel hangi tarafta olursa olsun sıcak
              glow hep dış kenarda kalıyor. */}
          <div
            className={`pointer-events-none absolute inset-0 ${panelOnLeft ? '' : '[transform:scaleX(-1)]'}`}
          >
            <div
              className="absolute inset-0 opacity-40 transition-all duration-700 ease-out group-hover:scale-110 group-hover:opacity-70"
              style={{ background: 'radial-gradient(circle at 30% 25%, rgba(245,215,142,0.45), transparent 62%)' }}
            />
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-40"
              style={{ background: 'radial-gradient(circle at 75% 80%, rgba(90,107,140,0.5), transparent 55%)' }}
            />
          </div>

          <div className="relative z-10">
            <div className="font-mono text-[20px] font-bold uppercase tracking-wider text-bureau-fixed-amber sm:text-[23px]">
              DROP-{drop.dropNo}
            </div>
            <div className="mt-2 font-mono text-[17px] font-semibold uppercase tracking-wider text-white sm:text-[19px]">
              {name}
            </div>
            <Link
              href={`/registry?drop=${drop.dropNo}`}
              className="mt-6 inline-block border border-white px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-white no-underline transition-colors hover:bg-white hover:text-bureau-fixed-black"
            >
              {t('exploreAll')}
            </Link>

            {/* "Oluştur" — Drop'un koleksiyonuyla Custom Registry'yi açar,
                müşteri kendi lambasını tasarlar. Koleksiyon bulunamazsa
                düz /custom-registry (koleksiyon seçim ekranı). */}
            <div className="mt-2.5">
              <Link
                href={createHref}
                className="inline-block border border-bureau-fixed-amber bg-bureau-fixed-amber px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-white no-underline transition-colors hover:bg-transparent hover:text-bureau-fixed-amber"
              >
                {t('create')}
              </Link>
            </div>

            {(prevDrop || nextDrop) && (
              <div className="mt-8 space-y-3 border-t border-white/20 pt-4">
                {prevDrop && (
                  <button
                    onClick={() => scrollToDrop(prevDrop.dropNo)}
                    className="block w-full font-mono text-[11px] uppercase tracking-wider text-white/70 transition-colors hover:text-bureau-fixed-amber"
                  >
                    ↑ {getLocalizedValue(prevDrop.name, locale, '—')}
                  </button>
                )}
                {nextDrop && (
                  <button
                    onClick={() => scrollToDrop(nextDrop.dropNo)}
                    className="block w-full font-mono text-[11px] uppercase tracking-wider text-white/70 transition-colors hover:text-bureau-fixed-amber"
                  >
                    ↓ {getLocalizedValue(nextDrop.name, locale, '—')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}