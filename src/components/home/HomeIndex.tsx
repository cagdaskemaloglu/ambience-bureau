'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { LIGHT_CLASSES } from '@/lib/lightClasses'
import { formatPrice, getLocalizedValue, getPricingForLocale, urlFor } from '@/lib/sanity'
import { ProductCard } from '@/components/registry/ProductCard'
import { Link } from '@/i18n/navigation'
import type { ProductCard as ProductCardType, SanityImage } from '@/types'

/** Klavye kısayolları: A = Drops; sınıflar kendi harfleriyle (lightClasses.ts → code: S D F G …). */
const DROPS_KEY = 'A'
const DROPS_ID = 'drops'

export const HOME_INDEX_ID = 'tahsis-dizini'

export type DropsPreview = {
  /** Kayıtlı (görünen) drop sayısı */
  count: number
  /** Kartta gösterilecek drop (canlı olan, yoksa ilk) */
  feature: {
    dropNo: string
    name: string
    image: SanityImage | null
    remaining: number | null
    planned: number | null
    live: boolean
  } | null
}

type Row = {
  id: string
  key: string
  title: string
  desc: string
  products: ProductCardType[]
  fromPrice: { amount: number; currency: string } | null
}

/**
 * Anasayfa tahsis dizini — Drops ve Daimi Envanter sınıfları TEK listede:
 * A Drops · S Lambader · D Aplik · F Masa Lambası · G Sarkıt.
 *  - Tüm satırlar KAPALI başlar; satıra tıklamak ya da baştaki harfe
 *    klavyeden basmak o satırı açar/kapatır (birden fazla açık olabilir).
 *  - Sağdaki dosya kartı (md+) üzerine gelinen/odaklanılan satırın
 *    ürünlerini önizler; kart satır açılınca da görünür kalır (sticky).
 *  - "#drop-NNN" / "#daimi-envanter" bağlantıları (bülten paneli) Drops
 *    satırını açıp ilgili drop'a kaydırır.
 */
export function HomeIndex({
  products,
  locale,
  dropsContent,
  drops,
  dropProducts,
}: {
  products: ProductCardType[]
  locale: string
  /** Drops satırının vitrininde dönecek drop ürünleri (canlı drop önce). */
  dropProducts: ProductCardType[]
  /** Sunucuda çizilen drop satırları (DropRow / UpcomingDropRow). */
  dropsContent: ReactNode
  drops: DropsPreview
}) {
  const tr = locale === 'tr'
  const intl = tr ? 'tr-TR' : 'en-US'
  const pad = (n: number) => String(n).padStart(2, '0')

  const rows: Row[] = useMemo(() => {
    const classRows = LIGHT_CLASSES.map((cls) => {
      const list = products.filter((p) => p.category === cls.value)
      let fromPrice: Row['fromPrice'] = null
      for (const p of list) {
        const pr = getPricingForLocale(p, locale)
        const amount = pr.discounted ?? pr.original
        if (fromPrice === null || amount < fromPrice.amount) fromPrice = { amount, currency: pr.currency }
      }
      return {
        id: cls.value,
        key: cls.code,
        title: tr ? cls.tr : cls.en,
        desc: tr ? cls.descTr : cls.descEn,
        products: list,
        fromPrice,
      }
    }).filter((r) => r.id !== 'strip' || r.products.length > 0) // Şerit sadece ürünü varsa
    return [
      {
        id: DROPS_ID,
        key: DROPS_KEY,
        title: 'Drops',
        desc: tr
          ? 'Numaralı ve sonlu drop’lar. Her adet bir seri numarası taşır; drop kapandığında aynı nesne bir daha üretilmez.'
          : 'Numbered, finite drops. Every unit carries a serial number; once a drop closes, the same object is never made again.',
        products: dropProducts,
        fromPrice: null,
      },
      ...classRows,
    ]
  }, [products, dropProducts, locale, tr])

  const [open, setOpen] = useState<Set<string>>(() => new Set())
  const [active, setActive] = useState<string>(DROPS_ID)
  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({})
  // Klavyeyle açınca sayfa kayar; imlecin altına gelen satır kartı
  // değiştirmesin diye fare üzerine gelmeyi kısa süre yok say.
  const ignoreHoverUntil = useRef(0)
  const activeRow = rows.find((r) => r.id === active) ?? rows[0]
  // Klavyeyle en son gidilen (odaktaki) satır: aynı harfe tekrar basmak
  // önce o satıra GERİ DÖNER, zaten oradaysan kapatır.
  const focusedRow = useRef<string | null>(null)
  const openRef = useRef(open)
  openRef.current = open

  const scrollToRow = useCallback((id: string) => {
    ignoreHoverUntil.current = performance.now() + 900
    requestAnimationFrame(() => {
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      rowRefs.current[id]?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    })
  }, [])

  /**
   * Harf tuşu:
   *  1) satır kapalıysa → aç ve oraya kaydır
   *  2) açık ama odak başka satırdaysa → o satıra geri dön (kapatma)
   *  3) açık ve odak zaten bu satırdaysa → kapat
   */
  const navigateKey = useCallback(
    (id: string) => {
      setActive(id)
      const isOpen = openRef.current.has(id)
      if (!isOpen) {
        setOpen((prev) => new Set(prev).add(id))
        focusedRow.current = id
        scrollToRow(id)
      } else if (focusedRow.current !== id) {
        focusedRow.current = id
        scrollToRow(id)
      } else {
        setOpen((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        focusedRow.current = null
        scrollToRow(id)
      }
    },
    [scrollToRow]
  )

  const toggle = useCallback(
    (id: string, opts?: { scroll?: boolean; forceOpen?: boolean }) => {
      setActive(id)
      const willOpen = !openRef.current.has(id) || !!opts?.forceOpen
      setOpen((prev) => {
        const next = new Set(prev)
        if (willOpen) next.add(id)
        else next.delete(id)
        return next
      })
      focusedRow.current = willOpen ? id : null
      if (opts?.scroll) scrollToRow(id)
    },
    [scrollToRow]
  )

  // Klavye: A/S/D/F/G… — yazı alanlarında ve kısayol tuşlarıyla birlikte çalışmaz.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return
      const k = e.key.toLocaleUpperCase('en-US')
      const row = rows.find((r) => r.key === k)
      if (!row) return
      e.preventDefault()
      navigateKey(row.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rows, navigateKey])

  // Masaüstünde dizin ilk ekranın altına kadar uzar (masthead + dizin tam
  // bir ekran): tam ekranda aşağıdaki "Tüm Kayıtlar" başlığı görünmez.
  const gridRef = useRef<HTMLDivElement>(null)
  const [minH, setMinH] = useState<number | null>(null)
  useEffect(() => {
    const measure = () => {
      const el = gridRef.current
      const main = document.getElementById('main-content')
      if (!el || !main || window.innerWidth < 768) return setMinH(null)
      const top = el.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop
      const h = main.clientHeight - top
      setMinH(h > 320 ? Math.floor(h) : null)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Bülten bağlantıları: #drop-NNN → Drops'u aç ve o drop'a kaydır.
  useEffect(() => {
    const handle = () => {
      const h = decodeURIComponent(window.location.hash.slice(1))
      if (h.startsWith('drop-')) {
        toggle(DROPS_ID, { forceOpen: true })
        // Drop satırları açıldıktan sonra kaydır.
        setTimeout(() => document.getElementById(h)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
      } else if (h === 'daimi-envanter' || h === HOME_INDEX_ID) {
        document.getElementById(HOME_INDEX_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    handle()
    window.addEventListener('hashchange', handle)
    return () => window.removeEventListener('hashchange', handle)
  }, [toggle])

  return (
    <div
      ref={gridRef}
      style={minH ? { minHeight: minH } : undefined}
      className="grid border-b border-bureau-rule md:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]"
    >
      {/* Dizin — satırlar boş yüksekliği eşit paylaşır */}
      <ul className="flex min-w-0 flex-col md:border-r md:border-bureau-rule">
        {rows.map((r) => {
          const isOpen = open.has(r.id)
          const isActive = r.id === activeRow?.id
          const count = r.id === DROPS_ID ? drops.count : r.products.length
          const panelId = `index-panel-${r.id}`
          return (
            <li
              key={r.id}
              ref={(el) => {
                rowRefs.current[r.id] = el
              }}
              className="flex flex-1 scroll-mt-2 flex-col border-b border-bureau-rule last:border-b-0"
            >
              <button
                type="button"
                onClick={() => toggle(r.id)}
                onMouseEnter={() => {
                  if (performance.now() > ignoreHoverUntil.current) setActive(r.id)
                }}
                onFocus={() => setActive(r.id)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                aria-keyshortcuts={r.key}
                className={`focus-bureau group relative isolate flex w-full items-center gap-4 overflow-hidden px-5 py-4 text-left md:gap-6 md:px-9 md:py-5 ${isOpen ? '' : 'flex-1'}`}
              >
                {/* Çekmece dolgusu — aktif (önizlenen) satırda soldan taşar */}
                <span
                  aria-hidden="true"
                  className={`absolute inset-0 -z-10 origin-left scale-x-0 bg-bureau-black transition-transform duration-300 ease-[cubic-bezier(0.2,0.7,0.1,1)] motion-reduce:transition-none max-md:group-hover:scale-x-100 ${
                    isActive ? 'md:scale-x-100' : ''
                  }`}
                />
                <span
                  className={`flex w-full items-center gap-4 transition-transform duration-300 ease-[cubic-bezier(0.2,0.7,0.1,1)] motion-reduce:transition-none md:gap-6 ${
                    isActive ? 'md:translate-x-2' : ''
                  }`}
                >
                  {/* Harf = klavye kısayolu */}
                  <kbd
                    className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center border font-mono text-[15px] font-semibold md:h-9 md:w-9 md:text-[17px] ${
                      isActive || isOpen
                        ? 'border-bureau-amber text-bureau-amber'
                        : 'border-bureau-rule text-bureau-subtle max-md:group-hover:text-bureau-amber'
                    }`}
                  >
                    {r.key}
                  </kbd>
                  <span
                    className={`flex-1 text-[18px] font-semibold tracking-[-0.02em] md:text-[24px] ${
                      isActive ? 'md:text-bureau-white' : 'text-bureau-black'
                    } max-md:group-hover:text-bureau-white`}
                  >
                    {r.title}
                  </span>
                  <span
                    className={`hidden font-mono text-[11px] uppercase tabular-nums tracking-wider sm:block ${
                      isActive ? 'md:text-bureau-white/70' : 'text-bureau-muted'
                    }`}
                  >
                    {count > 0
                      ? r.id === DROPS_ID
                        ? `${pad(count)} drop`
                        : `${pad(count)} ${tr ? 'kayıt' : count === 1 ? 'record' : 'records'}`
                      : tr
                        ? 'Kayıt açılıyor'
                        : 'Opening'}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`font-mono text-[16px] transition-transform duration-200 ${isOpen ? 'rotate-90' : ''} ${
                      isActive || isOpen ? 'md:text-bureau-amber' : 'text-bureau-subtle'
                    } max-md:group-hover:text-bureau-amber`}
                  >
                    →
                  </span>
                </span>
              </button>

              {isOpen && (
                <div id={panelId} className="animate-drawer-in border-t border-bureau-rule">
                  {r.id === DROPS_ID ? (
                    dropsContent
                  ) : r.products.length > 0 ? (
                    <div className="product-file-grid p-4 md:p-6">
                      {r.products.map((p) => (
                        <ProductCard key={p._id} product={p} />
                      ))}
                    </div>
                  ) : (
                    <p className="px-5 py-8 text-center font-mono text-[11px] uppercase tracking-wide text-bureau-muted md:px-9">
                      {tr ? 'Bu sınıfta kayıt açılıyor.' : 'Registration for this class is opening.'}
                    </p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {/* Dosya kartı — önizlenen satır (sadece md+) */}
      {activeRow && (
        <div className="hidden md:block">
          <div className="sticky top-0 p-6 lg:p-9" aria-live="polite">
            <article key={activeRow.id} className="animate-drawer-in border border-bureau-black bg-bureau-white">
              <div className="flex items-center justify-between border-b border-bureau-black px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-widest">
                <span className="text-bureau-black">
                  [{activeRow.key}] {activeRow.title}
                </span>
                <span className="tabular-nums text-bureau-muted">
                  {activeRow.id === DROPS_ID
                    ? `${pad(drops.count)} drop`
                    : `${pad(activeRow.products.length)} ${tr ? 'kayıt' : 'rec.'}`}
                </span>
              </div>

              <Coverflow row={activeRow} locale={locale} />

              <div className="space-y-3 border-t border-bureau-black px-4 py-4">
                <p className="line-clamp-2 text-[13px] leading-relaxed text-bureau-muted">{activeRow.desc}</p>
                <div className="flex items-end justify-between gap-4">
                  <p className="font-mono text-[12px] tabular-nums text-bureau-black">
                    {activeRow.id === DROPS_ID
                      ? drops.feature
                        ? drops.feature.live && drops.feature.planned !== null
                          ? `${tr ? 'Kalan' : 'Remaining'} ${drops.feature.remaining ?? 0}/${drops.feature.planned}`
                          : `DROP-${drops.feature.dropNo}`
                        : ''
                      : activeRow.fromPrice
                        ? `${tr ? 'Başlangıç' : 'From'} ${formatPrice(activeRow.fromPrice.amount, activeRow.fromPrice.currency, intl)}`
                        : tr
                          ? 'Fiyatlandırma tahsis sonrası'
                          : 'Pricing on registration'}
                  </p>
                  <button
                    type="button"
                    onClick={() => toggle(activeRow.id, { scroll: true, forceOpen: true })}
                    className="btn-file focus-bureau !px-3 !py-2"
                  >
                    <span>
                      {tr ? 'Aç' : 'Open'} <kbd className="ml-1 font-mono opacity-70">{activeRow.key}</kbd>
                    </span>
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      )}
    </div>
  )
}

/** Kart vitrininde gösterilecek ürünün bağlantısı (model kartı → konfigüratör). */
function productHref(p: ProductCardType): string {
  if (p.modelLink) {
    return `/custom-registry?collection=${encodeURIComponent(p.modelLink.collectionKey)}&model=${encodeURIComponent(p.modelLink.modelId)}`
  }
  return `/registry/${p.slug.current}`
}

const AUTO_ADVANCE_MS = 3200

/**
 * 3B vitrin (coverflow): satırın ürünleri sırayla tanıtılır. Ortadaki kart
 * odakta; yanlardakiler perspektifle geride ve eğik. Oklar / yandaki karta
 * tıklama / ← → tuşları (kart odaktayken) ile gezilir; kendiliğinden ilerler,
 * üzerine gelince ya da odaklanınca durur. Hareketi azalt ayarında
 * otomatik ilerleme kapalıdır.
 */
function Coverflow({ row, locale }: { row: Row; locale: string }) {
  const tr = locale === 'tr'
  const intl = tr ? 'tr-TR' : 'en-US'
  const items = row.products
  const n = items.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (n < 2 || paused) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setIndex((i) => (i + 1) % n), AUTO_ADVANCE_MS)
    return () => clearInterval(t)
  }, [n, paused])

  const go = (d: number) => setIndex((i) => (((i + d) % n) + n) % n)

  if (n === 0) {
    return (
      <div className="relative flex h-[320px] items-center justify-center overflow-hidden bg-bureau-surface">
        <span aria-hidden="true" className="absolute select-none font-mono text-[160px] font-semibold leading-none text-bureau-rule">
          {row.key}
        </span>
        <span className="relative -rotate-6 border-2 border-bureau-amber px-4 py-2 font-mono text-[13px] font-semibold uppercase tracking-widest text-bureau-amber">
          {tr ? 'Kayıt açılıyor' : 'Registration opening'}
        </span>
      </div>
    )
  }

  const current = items[Math.min(index, n - 1)]
  const curName = getLocalizedValue(current.name, locale, '') ?? ''
  const pr = getPricingForLocale(current, locale)

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          go(1)
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          go(-1)
        }
      }}
      role="region"
      aria-roledescription={tr ? 'vitrin' : 'carousel'}
      aria-label={row.title}
    >
      <div className="relative h-[320px] overflow-hidden bg-bureau-surface [perspective:1100px]">
        {items.map((p, k) => {
          let d = k - index
          if (d > n / 2) d -= n
          if (d < -n / 2) d += n
          const ad = Math.abs(d)
          const visible = ad <= 2
          const name = getLocalizedValue(p.name, locale, '') ?? ''
          const card = (
            <div className="relative h-full w-full overflow-hidden border border-bureau-black bg-bureau-white shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
              {p.image?.asset?.url ? (
                <Image
                  src={urlFor(p.image).width(420).height(560).fit('crop').url()}
                  alt={d === 0 ? (p.image.alt ?? name) : ''}
                  fill
                  sizes="220px"
                  className="object-cover"
                />
              ) : (
                <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-mono text-[64px] font-semibold text-bureau-rule">
                  {row.key}
                </span>
              )}
            </div>
          )
          return (
            <div
              key={p._id}
              aria-hidden={d !== 0}
              className="absolute left-1/2 top-1/2 h-[82%] aspect-[3/4] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.2,0.7,0.1,1)] motion-reduce:transition-none"
              style={{
                transform: `translate(-50%, -50%) translateX(${d * 62}%) translateZ(${-ad * 140}px) rotateY(${-d * 38}deg)`,
                opacity: !visible ? 0 : ad === 2 ? 0.35 : ad === 1 ? 0.8 : 1,
                zIndex: 10 - ad,
                pointerEvents: visible ? 'auto' : 'none',
              }}
            >
              {d === 0 ? (
                <Link href={productHref(p)} className="focus-bureau block h-full w-full" aria-label={name}>
                  {card}
                </Link>
              ) : (
                <button type="button" tabIndex={-1} onClick={() => go(d)} className="block h-full w-full" aria-label={name}>
                  {card}
                </button>
              )}
            </div>
          )
        })}

        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={tr ? 'Önceki' : 'Previous'}
              className="focus-bureau absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center border border-bureau-black bg-bureau-white/90 font-mono text-[18px] text-bureau-black transition-colors hover:bg-bureau-black hover:text-bureau-white"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={tr ? 'Sonraki' : 'Next'}
              className="focus-bureau absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center border border-bureau-black bg-bureau-white/90 font-mono text-[18px] text-bureau-black transition-colors hover:bg-bureau-black hover:text-bureau-white"
            >
              ›
            </button>
          </>
        )}
        {/* İlerleme çizgisi — otomatik ilerleme sayacı */}
        {n > 1 && !paused && (
          <span
            key={index}
            aria-hidden="true"
            className="absolute bottom-0 left-0 z-20 h-[2px] w-full origin-left bg-bureau-amber motion-reduce:hidden"
            style={{ animation: `coverflow-progress ${AUTO_ADVANCE_MS}ms linear forwards` }}
          />
        )}
      </div>

      {/* Odaktaki ürün */}
      <div className="flex items-baseline justify-between gap-3 border-t border-bureau-black px-4 py-2.5" aria-live="polite">
        <Link href={productHref(current)} className="focus-bureau min-w-0 truncate text-[14px] font-semibold text-bureau-black no-underline hover:text-bureau-amber">
          {curName}
        </Link>
        <span className="flex flex-shrink-0 items-baseline gap-2 font-mono text-[11px] tabular-nums">
          <span className="text-bureau-black">
            {current.modelLink ? (tr ? '' : 'from ') : ''}
            {formatPrice(pr.discounted ?? pr.original, pr.currency, intl)}
            {current.modelLink && tr ? "'den" : ''}
          </span>
          <span className="text-bureau-muted">
            {String(index + 1).padStart(2, '0')}/{String(n).padStart(2, '0')}
          </span>
        </span>
      </div>
    </div>
  )
}
