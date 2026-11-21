'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { LIGHT_CLASSES, type LightClass } from '@/lib/lightClasses'
import { formatPrice, getLocalizedValue, getPricingForLocale, urlFor } from '@/lib/sanity'
import { requestRegisterFilter } from '@/lib/registerFilter'
import type { ProductCard as ProductCardType } from '@/types'

type ClassFile = {
  cls: LightClass
  products: ProductCardType[]
  fromPrice: { amount: number; currency: string } | null
}

/**
 * Daimi Envanter "dosya dolabı" — sitenin imza anı (bkz. claude/DESIGN.md).
 * Solda sınıf indeksi (F, C, W, D, P); bir satırın üstüne gelinince ya da
 * klavyeyle odaklanınca sağdaki dosya kartı o sınıfa geçer ve çekmeceden
 * kayarak gelir. Ürünü olmayan sınıf boş değil, "KAYIT AÇILIYOR" damgalı
 * bekleyen bir dosya olarak görünür. Mobilde sadece indeks listesi var.
 */
export function StandingInventory({ products, locale }: { products: ProductCardType[]; locale: string }) {
  const tr = locale === 'tr'

  const files: ClassFile[] = useMemo(() => {
    return LIGHT_CLASSES.map((cls) => {
      const list = products.filter((p) => p.category === cls.value)
      let fromPrice: ClassFile['fromPrice'] = null
      for (const p of list) {
        const pr = getPricingForLocale(p, locale)
        const amount = pr.discounted ?? pr.original
        if (fromPrice === null || amount < fromPrice.amount) fromPrice = { amount, currency: pr.currency }
      }
      return { cls, products: list, fromPrice }
    }).filter((f) => f.cls.value !== 'strip' || f.products.length > 0) // Şerit sadece ürünü varsa
  }, [products, locale])

  const [active, setActive] = useState(files[0]?.cls.value)
  const activeFile = files.find((f) => f.cls.value === active) ?? files[0]
  const intl = tr ? 'tr-TR' : 'en-US'
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div>
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]">
        {/* Sınıf indeksi */}
        <ul className="border-b border-bureau-rule md:border-b-0 md:border-r">
          {files.map((f) => {
            const isActive = f.cls.value === activeFile?.cls.value
            const count = f.products.length
            return (
              <li key={f.cls.value} className="border-b border-bureau-rule last:border-b-0">
                <Link
                  href={`/registry?mode=standing&category=${f.cls.value}`}
                  onClick={(e) => {
                    // Tek sayfa: sayfadan ayrılmadan §3 Tüm Kayıtlar'ı bu sınıfa süz.
                    // (href, yeni sekmede açma/JS'siz durum için Registry'ye gider.)
                    if (e.metaKey || e.ctrlKey || e.shiftKey) return
                    e.preventDefault()
                    requestRegisterFilter({ mode: 'standing', category: f.cls.value })
                  }}
                  onMouseEnter={() => setActive(f.cls.value)}
                  onFocus={() => setActive(f.cls.value)}
                  aria-current={isActive ? 'true' : undefined}
                  className="focus-bureau group relative isolate flex items-center gap-4 overflow-hidden px-5 py-4 no-underline md:gap-6 md:px-9 md:py-5"
                >
                  {/* Çekmece dolgusu — aktif satırda soldan taşar */}
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
                    <span
                      aria-hidden="true"
                      className={`w-8 font-mono text-[22px] font-semibold tabular-nums md:text-[28px] ${
                        isActive ? 'text-bureau-amber' : 'text-bureau-subtle max-md:group-hover:text-bureau-amber'
                      }`}
                    >
                      {f.cls.code}
                    </span>
                    <span
                      className={`flex-1 text-[22px] font-semibold tracking-[-0.02em] md:text-[34px] ${
                        isActive ? 'md:text-bureau-white' : 'text-bureau-black'
                      } max-md:group-hover:text-bureau-white`}
                    >
                      {tr ? f.cls.tr : f.cls.en}
                    </span>
                    <span
                      className={`hidden font-mono text-[11px] uppercase tabular-nums tracking-wider sm:block ${
                        isActive ? 'md:text-bureau-white/70' : 'text-bureau-muted'
                      }`}
                    >
                      {count > 0
                        ? `${pad(count)} ${tr ? 'kayıt' : count === 1 ? 'record' : 'records'}`
                        : tr
                          ? 'Kayıt açılıyor'
                          : 'Opening'}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`font-mono text-[16px] ${isActive ? 'md:text-bureau-amber' : 'text-bureau-subtle'} max-md:group-hover:text-bureau-amber`}
                    >
                      →
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Dosya kartı (sadece md+) */}
        {activeFile && (
          <div className="hidden p-9 md:block" aria-live="polite">
            <article key={activeFile.cls.value} className="animate-drawer-in border border-bureau-black bg-bureau-white">
              <div className="flex items-center justify-between border-b border-bureau-black px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-widest">
                <span className="text-bureau-black">
                  {tr ? 'Sınıf' : 'Class'} {activeFile.cls.code} · ENV-{activeFile.cls.code}
                </span>
                <span className="tabular-nums text-bureau-muted">
                  {pad(activeFile.products.length)} {tr ? 'kayıt' : 'rec.'}
                </span>
              </div>

              <ClassPreview file={activeFile} locale={locale} />

              <div className="space-y-3 border-t border-bureau-black px-4 py-4">
                <p className="text-[14px] leading-relaxed text-bureau-muted">
                  {tr ? activeFile.cls.descTr : activeFile.cls.descEn}
                </p>
                <div className="flex items-end justify-between gap-4">
                  <p className="font-mono text-[12px] tabular-nums text-bureau-black">
                    {activeFile.fromPrice
                      ? `${tr ? 'Başlangıç' : 'From'} ${formatPrice(activeFile.fromPrice.amount, activeFile.fromPrice.currency, intl)}`
                      : tr
                        ? 'Fiyatlandırma tahsis sonrası'
                        : 'Pricing on registration'}
                  </p>
                  {activeFile.products.length > 0 && (
                    <Link
                      href={`/registry?mode=standing&category=${activeFile.cls.value}`}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey) return
                        e.preventDefault()
                        requestRegisterFilter({ mode: 'standing', category: activeFile.cls.value })
                      }}
                      className="btn-file focus-bureau !px-3 !py-2"
                    >
                      <span>{tr ? 'Sınıfı incele' : 'View class'}</span>
                    </Link>
                  )}
                </div>
              </div>
            </article>
          </div>
        )}
      </div>

    </div>
  )
}

function ClassPreview({ file, locale }: { file: ClassFile; locale: string }) {
  const tr = locale === 'tr'
  const first = file.products.find((p) => p.image?.asset?.url)
  if (!first?.image?.asset?.url) {
    // Bekleyen dosya — boş değil, damgalı.
    return (
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-bureau-surface">
        <span aria-hidden="true" className="absolute select-none font-mono text-[160px] font-semibold leading-none text-bureau-rule">
          {file.cls.code}
        </span>
        <span className="relative -rotate-6 border-2 border-bureau-amber px-4 py-2 font-mono text-[13px] font-semibold uppercase tracking-widest text-bureau-amber">
          {tr ? 'Kayıt açılıyor' : 'Registration opening'}
        </span>
      </div>
    )
  }
  const name = getLocalizedValue(first.name, locale, '') ?? ''
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-bureau-surface">
      <Image
        src={urlFor(first.image).width(880).height(660).fit('crop').url()}
        alt={first.image.alt ?? name}
        fill
        sizes="440px"
        className="object-cover"
      />
      <span className="absolute bottom-2 left-2 bg-bureau-black/80 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-bureau-white">
        {first.registryNo} · {name}
      </span>
    </div>
  )
}
