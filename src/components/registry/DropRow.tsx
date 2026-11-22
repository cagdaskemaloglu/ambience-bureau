'use client'

import { useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { getLocalizedValue } from '@/lib/sanity'
import { useAnimatedNumber } from '@/lib/useAnimatedNumber'
import { ProductCard } from './ProductCard'
import type { DropWithProducts, LocalizedString } from '@/types'

// Bir kartın sabit genişliği (px) — kaydırılabilir satırdaki tüm kartlar bu
// genişlikte. ProductCard kendi içinde %100 genişlik kullanıyor, bu yüzden
// sadece dış sarmalayıcının genişliğini sabitlememiz yeterli.
// Fotoğrafların gerçek oranı 3:4 (dikey) — registry ile birebir aynı,
// kanıtlanmış doğru oran (bkz. ProductCard'a geçilen `compact` prop'u).
const CARD_WIDTH = 196
const CARD_GAP = 12 // gap-3
const CARD_MEDIA_ASPECT = 'aspect-[4/5]'

/** Drop başlığındaki "N Farklı Kombinasyon" — görününce 0'dan N'e sayar. */
export function AnimatedCombinations({ total, locale }: { total: number; locale: string }) {
  const { value, ref } = useAnimatedNumber<HTMLSpanElement>(total, { from: 0, duration: 2000 })
  return (
    <span
      ref={ref}
      className="font-normal normal-case tracking-normal text-bureau-fixed-muted"
    >
      <span className="tabular-nums">
        {value.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')}
      </span>{' '}
      {locale === 'tr' ? 'Farklı Kombinasyon' : 'Different Combinations'}
    </span>
  )
}

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
  const scrollRef = useRef<HTMLDivElement>(null)

  // Masaüstü ok butonları — bir tıklamada ~2 kart genişliği kadar kaydırır.
  function scrollByCards(direction: 1 | -1) {
    scrollRef.current?.scrollBy({ left: direction * (CARD_WIDTH + CARD_GAP) * 2, behavior: 'smooth' })
  }

  const name = getLocalizedValue(drop.name, locale, '—')

  // index 0 = 1. Drop (tek) → panel SAĞDA (varsayılan sıra).
  // index 1 = 2. Drop (çift) → panel SOLDA (ters sıra).
  const panelOnLeft = index % 2 === 1

  const createHref = drop.configuratorCollectionKey
    ? `/custom-registry?collection=${encodeURIComponent(drop.configuratorCollectionKey)}`
    : '/custom-registry'

  // Tüm adetler tahsis edildi mi? (plannedQuantity yoksa sınırsız kabul edilir)
  const soldOut = typeof drop.plannedQuantity === 'number' && drop.plannedQuantity - drop.soldCount <= 0

  return (
    <section id={dropSectionId(drop.dropNo)} className="border-b border-bureau-panel-edge dark:border-black">
      {/* Eski sistemdeki başlık satırı */}
      <div className="px-5 py-2 md:px-9">
        <h2 className="flex flex-wrap items-baseline gap-x-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-bureau-fixed-black">
          <span>
            <span className="text-bureau-fixed-amber">DROP-{drop.dropNo}</span>
            <span className="ml-2 font-normal text-bureau-fixed-muted">{name}</span>
          </span>
          {/* Taban × gövde × başlık varyant sayısının çarpımı — bkz.
              queries.ts'teki getCombinationCount() hesaplama notu
              (gövdenin çok katmanlı istiflenmesi matematiksel olarak göz
              ardı edilir, aksi halde rakam anlamsız büyüklükte olur). */}
          {drop.totalCombinations > 0 && (
            <AnimatedCombinations total={drop.totalCombinations} locale={locale} />
          )}
        </h2>
      </div>

      <div
        className={`group/row relative flex flex-col overflow-hidden md:bg-bureau-white dark:md:bg-bureau-panel-edge ${panelOnLeft ? 'md:flex-row-reverse' : 'md:flex-row'}`}
      >
        {/* Masaüstü: Drop etiket panelinin zemini/glow'u TÜM satıra yayılır —
            ürün kartlarının ARKASINDAN, kartların üst ve alt şeritlerinde
            görünür (kartlar kendi opak zeminiyle üstte durur). Glow'un
            merkezleri panelin durduğu (sağ/sol) kenara göre konumlanır. */}
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          {/* AYDINLIK mod: tüm satır (panel dahil) sitenin arka plan rengiyle
              (kırık beyaz) aynı. Karanlık modda gizli (orada zemin koyu). */}
          <div className="absolute inset-0 bg-bureau-white dark:hidden" />
          <div
            className="absolute inset-0 opacity-40 transition-all duration-700 ease-out group-hover/row:opacity-70"
            style={{
              background: `radial-gradient(circle 480px at ${panelOnLeft ? '6%' : '94%'} 25%, rgba(245,215,142,0.45), transparent 75%)`,
            }}
          />
          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-700 ease-out group-hover/row:opacity-40"
            style={{
              background: `radial-gradient(circle 480px at ${panelOnLeft ? '15%' : '85%'} 80%, rgba(90,107,140,0.5), transparent 70%)`,
            }}
          />
        </div>

        {/* Ürün satırı — SAĞA doğru kaydırılabilir bir slider. Sabit
            genişlikli kartlar (CARD_WIDTH) yan yana dizilir, satır
            dolduğunda `overflow-x-auto` ile kaydırma devreye girer.
            Mobilde parmakla kaydırma (dokunmatik, native); masaüstünde
            trackpad/shift+tekerlek İLE BİRLİKTE aşağıdaki görünür ok
            butonları da çalışır. snap-x sayesinde kartlar hizalı
            "yakalanır". Kaydırma çubuğu görsel gürültü yaratmasın diye
            gizlendi. */}
        <div className="relative z-10 md:w-4/5">
          <div
            ref={scrollRef}
            className="flex items-start gap-3 overflow-x-auto px-5 py-3 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-proximity [&::-webkit-scrollbar]:hidden md:px-9"
          >
            {drop.products.map((product) => (
              <div key={product._id} style={{ width: CARD_WIDTH, flexShrink: 0 }} className="snap-start bg-bureau-white">
                <ProductCard product={product} mediaAspectClassName={CARD_MEDIA_ASPECT} compact dropSoldOut={soldOut} />
              </div>
            ))}
          </div>

          {/* Masaüstü ok butonları — SADECE md ve üstünde görünür (mobilde
              zaten dokunmatik kaydırma yeterli). Satırın üzerine bindirilir,
              her tıklamada ~2 kart kadar kaydırır. */}
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            aria-label={locale === 'tr' ? 'Sola kaydır' : 'Scroll left'}
            className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center border border-bureau-fixed-black bg-bureau-fixed-black/80 font-mono text-[15px] text-white backdrop-blur-sm transition-colors hover:border-bureau-fixed-amber hover:bg-bureau-fixed-amber md:flex"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            aria-label={locale === 'tr' ? 'Sağa kaydır' : 'Scroll right'}
            className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center border border-bureau-fixed-black bg-bureau-fixed-black/80 font-mono text-[15px] text-white backdrop-blur-sm transition-colors hover:border-bureau-fixed-amber hover:bg-bureau-fixed-amber md:flex"
          >
            ›
          </button>
        </div>

        {/* Siyah Drop etiket paneli — `group` + stretch sayesinde ürün
            satırıyla AYNI yükseklikte olur, içeriği ortalanır. */}
        <div className="group relative flex w-full flex-shrink-0 flex-col items-center justify-center z-10 overflow-hidden border-t border-bureau-fixed-black/10 bg-bureau-white p-6 text-center text-bureau-fixed-black dark:border-bureau-panel-edge dark:bg-bureau-panel-edge dark:text-white md:w-1/5 md:border-t-0 md:bg-transparent">
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
            className={`pointer-events-none absolute inset-0 md:hidden ${panelOnLeft ? '' : '[transform:scaleX(-1)]'}`}
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

          {/* Drop "tahsis dosyası" — bülten ve dosya kartıyla aynı dil:
              başlık şeridinde durum, etiket → değer satırları, adet adet
              tahsis çizelgesi ve iki net eylem. */}
          <div className="relative z-10 w-full max-w-[320px] text-left">
            <DropFile
              drop={drop}
              name={name ?? ''}
              locale={locale}
              soldOut={soldOut}
              createHref={createHref}
              exploreLabel={t('exploreAll')}
            />

            {(prevDrop || nextDrop) && (
              <div className="mt-4 flex flex-col gap-1">
                {prevDrop && (
                  <button
                    onClick={() => scrollToDrop(prevDrop.dropNo)}
                    className="nav-underline focus-bureau w-fit py-1 font-mono text-[10.5px] uppercase tracking-wider text-bureau-fixed-black/70 transition-colors hover:text-bureau-fixed-amber dark:text-white/70"
                  >
                    ↑ DROP-{prevDrop.dropNo} · {getLocalizedValue(prevDrop.name, locale, '—')}
                  </button>
                )}
                {nextDrop && (
                  <button
                    onClick={() => scrollToDrop(nextDrop.dropNo)}
                    className="nav-underline focus-bureau w-fit py-1 font-mono text-[10.5px] uppercase tracking-wider text-bureau-fixed-black/70 transition-colors hover:text-bureau-fixed-amber dark:text-white/70"
                  >
                    ↓ DROP-{nextDrop.dropNo} · {getLocalizedValue(nextDrop.name, locale, '—')}
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

/** Tahsis çizelgesi hücre sayısı bundan büyükse hücre yerine düz çubuk çizilir. */
const LEDGER_MAX_CELLS = 60

/**
 * Drop paneli = tahsis dosyası. "10/10 adet kaldı" gibi belirsiz bir ifade
 * yerine seri, tahsis edilen ve kalan adet ayrı satırlarda; altında her
 * adedin bir hücre olduğu çizelge (dolu = tahsis edilmiş).
 */
function DropFile({
  drop,
  name,
  locale,
  soldOut,
  createHref,
  exploreLabel,
}: {
  drop: DropWithProducts
  name: string
  locale: string
  soldOut: boolean
  createHref: string
  exploreLabel: string
}) {
  const tr = locale === 'tr'
  const intl = tr ? 'tr-TR' : 'en-US'
  const planned = typeof drop.plannedQuantity === 'number' ? drop.plannedQuantity : null
  const sold = Math.min(drop.soldCount ?? 0, planned ?? Infinity)
  const remaining = planned !== null ? Math.max(0, planned - sold) : null
  const fmt = (n: number) => n.toLocaleString(intl)
  const rem = useAnimatedNumber<HTMLSpanElement>(remaining ?? 0, { from: planned ?? 0, duration: 1600 })

  const rows: Array<{ k: string; v: React.ReactNode }> = []
  if (planned !== null) {
    rows.push({ k: tr ? 'Seri' : 'Series', v: `${fmt(planned)} ${tr ? 'adet' : 'units'}` })
    rows.push({ k: tr ? 'Tahsis edilen' : 'Allocated', v: fmt(sold) })
    rows.push({
      k: tr ? 'Kalan' : 'Remaining',
      v: (
        <span ref={rem.ref} className={soldOut ? 'text-[#b03224]' : 'text-bureau-fixed-amber'}>
          {fmt(rem.value)} / {fmt(planned)}
        </span>
      ),
    })
  }

  const line = 'border-bureau-fixed-black/25 dark:border-white/20'
  const muted = 'text-bureau-fixed-black/60 dark:text-white/55'

  return (
    <article
      className={`relative border bg-bureau-white/70 text-bureau-fixed-black backdrop-blur-[2px] dark:bg-black/20 dark:text-white ${line}`}
    >
      {/* Başlık şeridi: dosya türü + durum */}
      <div className={`flex items-center justify-between border-b px-3 py-2 font-mono text-[9.5px] uppercase tracking-widest ${line}`}>
        <span className={muted}>{tr ? 'Tahsis dosyası' : 'Allocation file'}</span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`h-[6px] w-[6px] rounded-full ${soldOut ? 'bg-[#b03224]' : 'bureau-lamp bg-bureau-fixed-amber'}`}
          />
          <span className={soldOut ? 'text-[#b03224]' : 'text-bureau-fixed-amber'}>
            {soldOut ? (tr ? 'Tamamlandı' : 'Closed') : tr ? 'Tahsiste' : 'Allocating'}
          </span>
        </span>
      </div>

      {/* Kimlik */}
      <div className="px-3 pb-3 pt-3">
        <p className="font-mono text-[22px] font-bold leading-none tracking-wider text-bureau-fixed-amber">
          DROP-{drop.dropNo}
        </p>
        <p className="mt-1.5 font-mono text-[15px] font-semibold uppercase leading-tight tracking-wider">{name}</p>
      </div>

      {/* Satırlar */}
      {rows.length > 0 && (
        <dl className={`border-t ${line}`}>
          {rows.map((r) => (
            <div key={r.k} className={`grid grid-cols-[110px_minmax(0,1fr)] gap-2 border-b border-dashed px-3 py-1.5 last:border-b-0 ${line}`}>
              <dt className={`font-mono text-[9.5px] uppercase tracking-wider ${muted}`}>{r.k}</dt>
              <dd className="font-mono text-[11.5px] tabular-nums">{r.v}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* Tahsis çizelgesi: her adet bir hücre, dolu = tahsis edilmiş */}
      {planned !== null && planned > 0 && (
        <div className={`border-t px-3 py-2.5 ${line}`}>
          <p className={`mb-1.5 font-mono text-[9px] uppercase tracking-widest ${muted}`}>
            {tr ? 'Tahsis çizelgesi' : 'Allocation ledger'}
          </p>
          {planned <= LEDGER_MAX_CELLS ? (
            <div
              role="img"
              aria-label={tr ? `${planned} adetten ${sold} tanesi tahsis edildi` : `${sold} of ${planned} units allocated`}
              className="grid gap-[3px]"
              style={{ gridTemplateColumns: `repeat(${Math.min(planned, 10)}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: planned }).map((_, i) => (
                <span
                  key={i}
                  className={`h-[7px] ${
                    i < sold
                      ? soldOut
                        ? 'bg-[#b03224]'
                        : 'bg-bureau-fixed-amber'
                      : 'border border-bureau-fixed-black/30 dark:border-white/30'
                  }`}
                />
              ))}
            </div>
          ) : (
            <div
              role="img"
              aria-label={tr ? `${planned} adetten ${sold} tanesi tahsis edildi` : `${sold} of ${planned} units allocated`}
              className="h-[7px] border border-bureau-fixed-black/30 dark:border-white/30"
            >
              <div className="h-full bg-bureau-fixed-amber" style={{ width: `${(sold / planned) * 100}%` }} />
            </div>
          )}
        </div>
      )}

      {/* Eylemler */}
      <div className={`flex flex-col gap-2 border-t p-3 ${line}`}>
        {soldOut ? (
          <span
            aria-disabled="true"
            className="block cursor-not-allowed border border-bureau-fixed-black/25 px-3 py-2 text-center font-mono text-[10.5px] uppercase tracking-wider text-bureau-fixed-black/40 dark:border-white/25 dark:text-white/40"
          >
            {tr ? 'Yeni tasarım kabul edilmiyor' : 'No new designs accepted'}
          </span>
        ) : (
          <Link
            href={createHref}
            className="btn-file btn-file-amber focus-bureau w-full !px-3 !py-2.5 !text-[10.5px]"
          >
            <span>{tr ? 'Kendi tasarımını oluştur' : 'Design your own'}</span>
          </Link>
        )}
        <Link
          href={`/registry?drop=${drop.dropNo}`}
          className="focus-bureau block border border-bureau-fixed-black/50 px-3 py-2 text-center font-mono text-[10.5px] uppercase tracking-wider text-bureau-fixed-black no-underline transition-colors hover:bg-bureau-fixed-black hover:text-white dark:border-white/50 dark:text-white dark:hover:bg-white dark:hover:text-bureau-fixed-black"
        >
          {exploreLabel}
        </Link>
      </div>

      {soldOut && (
        <span className="bureau-stamp pointer-events-none absolute right-3 top-12 border-2 border-[#b03224] bg-bureau-white/80 px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-[#b03224] dark:bg-black/60">
          {tr ? 'Tahsis tamamlandı' : 'Fully allocated'}
        </span>
      )}
    </article>
  )
}
