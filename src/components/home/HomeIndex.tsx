'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { LIGHT_CLASSES } from '@/lib/lightClasses'
import { formatPrice, getLocalizedValue, getPricingForLocale, urlFor } from '@/lib/sanity'
import { ProductCard } from '@/components/registry/ProductCard'
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
}: {
  products: ProductCardType[]
  locale: string
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
        products: [],
        fromPrice: null,
      },
      ...classRows,
    ]
  }, [products, locale, tr])

  const [open, setOpen] = useState<Set<string>>(() => new Set())
  const [active, setActive] = useState<string>(DROPS_ID)
  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({})
  // Klavyeyle açınca sayfa kayar; imlecin altına gelen satır kartı
  // değiştirmesin diye fare üzerine gelmeyi kısa süre yok say.
  const ignoreHoverUntil = useRef(0)
  const activeRow = rows.find((r) => r.id === active) ?? rows[0]

  const toggle = useCallback((id: string, opts?: { scroll?: boolean; forceOpen?: boolean }) => {
    setActive(id)
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id) && !opts?.forceOpen) next.delete(id)
      else next.add(id)
      return next
    })
    if (opts?.scroll) {
      ignoreHoverUntil.current = performance.now() + 900
      requestAnimationFrame(() => {
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        rowRefs.current[id]?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
      })
    }
  }, [])

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
      toggle(row.id, { scroll: true })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rows, toggle])

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
    <div className="grid border-b border-bureau-rule md:grid-cols-[minmax(0,1fr)_minmax(300px,400px)]">
      {/* Dizin */}
      <ul className="min-w-0 md:border-r md:border-bureau-rule">
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
              className="scroll-mt-2 border-b border-bureau-rule last:border-b-0"
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
                className="focus-bureau group relative isolate flex w-full items-center gap-4 overflow-hidden px-5 py-4 text-left md:gap-6 md:px-9 md:py-5"
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
                    className={`inline-flex h-9 w-9 flex-shrink-0 items-center justify-center border font-mono text-[18px] font-semibold md:h-11 md:w-11 md:text-[22px] ${
                      isActive || isOpen
                        ? 'border-bureau-amber text-bureau-amber'
                        : 'border-bureau-rule text-bureau-subtle max-md:group-hover:text-bureau-amber'
                    }`}
                  >
                    {r.key}
                  </kbd>
                  <span
                    className={`flex-1 text-[22px] font-semibold tracking-[-0.02em] md:text-[34px] ${
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

              {activeRow.id === DROPS_ID ? (
                <DropsPreviewMedia drops={drops} tr={tr} />
              ) : (
                <ClassPreviewGrid row={activeRow} locale={locale} />
              )}

              <div className="space-y-3 border-t border-bureau-black px-4 py-4">
                <p className="text-[13px] leading-relaxed text-bureau-muted">{activeRow.desc}</p>
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

/** Sınıf önizlemesi: o sınıftaki ilk 4 ürünün görselleri (yoksa damgalı bekleyen dosya). */
function ClassPreviewGrid({ row, locale }: { row: Row; locale: string }) {
  const tr = locale === 'tr'
  const withImg = row.products.filter((p) => p.image?.asset?.url).slice(0, 4)
  if (withImg.length === 0) {
    return (
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-bureau-surface">
        <span aria-hidden="true" className="absolute select-none font-mono text-[160px] font-semibold leading-none text-bureau-rule">
          {row.key}
        </span>
        <span className="relative -rotate-6 border-2 border-bureau-amber px-4 py-2 font-mono text-[13px] font-semibold uppercase tracking-widest text-bureau-amber">
          {tr ? 'Kayıt açılıyor' : 'Registration opening'}
        </span>
      </div>
    )
  }
  return (
    <div className={`grid aspect-[4/3] gap-px bg-bureau-rule ${withImg.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {withImg.map((p, i) => {
        const name = getLocalizedValue(p.name, locale, '') ?? ''
        const span = withImg.length === 3 && i === 0 ? 'row-span-2' : ''
        return (
          <div key={p._id} className={`relative overflow-hidden bg-bureau-surface ${span}`}>
            <Image
              src={urlFor(p.image!).width(440).height(440).fit('crop').url()}
              alt={p.image?.alt ?? name}
              fill
              sizes="200px"
              className="object-cover"
            />
            <span className="absolute bottom-1.5 left-1.5 max-w-[90%] truncate bg-bureau-black/80 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-bureau-white">
              {name}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function DropsPreviewMedia({ drops, tr }: { drops: DropsPreview; tr: boolean }) {
  const f = drops.feature
  if (!f) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-bureau-surface font-mono text-[11px] uppercase tracking-wide text-bureau-muted">
        {tr ? 'Kayıtlı drop yok' : 'No drops on record'}
      </div>
    )
  }
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-bureau-surface">
      {f.image?.asset?.url ? (
        <Image src={urlFor(f.image).width(880).height(660).fit('crop').url()} alt={f.name} fill sizes="400px" className="object-cover" />
      ) : (
        <span aria-hidden="true" className="absolute inset-0 flex select-none items-center justify-center font-mono text-[120px] font-semibold leading-none text-bureau-rule">
          A
        </span>
      )}
      <span className="absolute bottom-2 left-2 bg-bureau-black/80 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-bureau-white">
        DROP-{f.dropNo} · {f.name}
        {f.live ? (tr ? ' · Canlı' : ' · Live') : tr ? ' · Yakında' : ' · Soon'}
      </span>
    </div>
  )
}
