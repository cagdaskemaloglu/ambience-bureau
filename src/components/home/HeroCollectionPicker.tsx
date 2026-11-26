'use client'

import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { getLocalizedValue, urlFor } from '@/lib/sanity'
import type { Collection } from '@/types'

/**
 * Özel Tahsis — koleksiyon seçimi, anasayfanın ilk ekranında ("Işık,
 * tahsis edilir." bloğunun YERİNDE). 3B görüntüleyici arkada yerinde
 * kalır; seçilen koleksiyon konfigüratörü AYNI SAYFADA, ilk ekranın içinde
 * açar (HeroStudio). Yeni sekmede açılırsa /custom-registry sayfası çalışır.
 */
export function HeroCollectionPicker({
  collections,
  locale,
  onBack,
  onPick,
  onIntent,
}: {
  collections: Collection[]
  locale: string
  onBack: () => void
  /** Koleksiyon seçildi: konfigüratör aynı sayfada, ilk ekranda açılır. */
  onPick?: (key: string) => void
  /** Seçim niyeti (üzerine gelme/odak): konfigüratör kodu önceden indirilir. */
  onIntent?: () => void
}) {
  const tr = locale === 'tr'
  return (
    <div className="animate-drawer-in">
      <p className="font-mono text-[10px] uppercase tracking-widest text-bureau-muted">
        {tr ? 'Form 104-B · Özel Tahsis' : 'Form 104-B · Custom Allocation'}
      </p>
      <h1
        id="home-title"
        className="mt-1 text-[30px] font-semibold leading-[0.95] tracking-[-0.04em] text-bureau-black sm:text-[36px] lg:text-[40px]"
      >
        {tr ? (
          <>
            Bir koleksiyon <span className="text-bureau-amber">seçin.</span>
          </>
        ) : (
          <>
            Choose a <span className="text-bureau-amber">collection.</span>
          </>
        )}
      </h1>
      <p className="mt-2 max-w-[52ch] text-[13px] leading-relaxed text-bureau-muted">
        {tr
          ? 'Seçtiğiniz koleksiyonun parçalarıyla kendi lambanızı tasarlarsınız; her parçanın rengi ayrı seçilir.'
          : 'Design your own lamp from the parts of the collection you choose; every part takes its own colour.'}
      </p>

      <ul className="mt-5 flex flex-col gap-2">
        {collections.map((c) => {
          const key = c.key.current
          const name = getLocalizedValue(c.name, locale, key) ?? key
          const desc = getLocalizedValue(c.description, locale, '')
          return (
            <li key={c._id}>
              <Link
                href={`/custom-registry?collection=${encodeURIComponent(key)}`}
                onMouseEnter={onIntent}
                onFocus={onIntent}
                onClick={(e) => {
                  if (!onPick || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
                  e.preventDefault()
                  onPick(key)
                }}
                className="focus-bureau group flex items-center gap-3 border border-bureau-rule bg-bureau-white/70 p-2 no-underline backdrop-blur-[3px] transition-colors hover:border-bureau-amber"
              >
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden bg-bureau-surface">
                  {c.coverImage?.asset ? (
                    <Image
                      src={urlFor(c.coverImage).width(96).height(96).fit('max').url()}
                      alt=""
                      width={48}
                      height={48}
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <span aria-hidden="true" className="font-mono text-[8px] uppercase text-bureau-subtle">
                      —
                    </span>
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[14px] font-semibold tracking-[-0.01em] text-bureau-black group-hover:text-bureau-amber">
                    {name}
                  </span>
                  {desc && <span className="truncate text-[11.5px] text-bureau-muted">{desc}</span>}
                </span>
                <span aria-hidden="true" className="font-mono text-[13px] text-bureau-subtle group-hover:text-bureau-amber">
                  →
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        onClick={onBack}
        className="focus-bureau mt-4 py-1 font-mono text-[11px] uppercase tracking-wider text-bureau-muted hover:text-bureau-black"
      >
        ← {tr ? 'Geri' : 'Back'}
      </button>
    </div>
  )
}
