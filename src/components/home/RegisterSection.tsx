'use client'

import { useEffect, useMemo, useState } from 'react'
import { LIGHT_CLASSES, resolveSaleMode } from '@/lib/lightClasses'
import { getPricingForLocale } from '@/lib/sanity'
import { REGISTER_FILTER_EVENT, type RegisterFilterDetail } from '@/lib/registerFilter'
import { ProductCard } from '@/components/registry/ProductCard'
import type { ProductCard as ProductCardType } from '@/types'

type Mode = 'all' | 'limited' | 'standing'
type Sort = 'registry' | 'price-asc' | 'price-desc'

const PAGE_SIZE = 12

/**
 * Anasayfadaki "Tüm Kayıtlar" — ziyaretçi sayfadan ayrılmadan TÜM ürünleri
 * (drop'lar + daimi envanter) keşfeder. Süzme tamamen istemcide: satış
 * rejimi, sınıf ve sıralama. 12'şer kart gösterilir ("Daha fazla").
 * Dosya dolabı ve diğer bölümler `requestRegisterFilter()` ile buraya
 * filtre gönderebilir (bkz. lib/registerFilter.ts).
 */
export function RegisterSection({ products, locale }: { products: ProductCardType[]; locale: string }) {
  const tr = locale === 'tr'
  const [mode, setMode] = useState<Mode>('all')
  const [category, setCategory] = useState<string | null>(null)
  const [sort, setSort] = useState<Sort>('registry')
  const [shown, setShown] = useState(PAGE_SIZE)

  // Dışarıdan gelen filtre istekleri (dosya dolabı vb.)
  useEffect(() => {
    const onFilter = (e: Event) => {
      const d = (e as CustomEvent<RegisterFilterDetail>).detail ?? {}
      if (d.mode) setMode(d.mode)
      if (d.category !== undefined) setCategory(d.category)
      setShown(PAGE_SIZE)
    }
    window.addEventListener(REGISTER_FILTER_EVENT, onFilter)
    return () => window.removeEventListener(REGISTER_FILTER_EVENT, onFilter)
  }, [])

  const inMode = useMemo(
    () => (mode === 'all' ? products : products.filter((p) => resolveSaleMode(p.saleMode) === mode)),
    [products, mode]
  )

  // Sınıf çipleri: sadece bu rejimde kaydı olan sınıflar (+ sayıları)
  const classCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of inMode) m.set(p.category, (m.get(p.category) ?? 0) + 1)
    return LIGHT_CLASSES.filter((c) => (m.get(c.value) ?? 0) > 0).map((c) => ({ cls: c, count: m.get(c.value) ?? 0 }))
  }, [inMode])

  const list = useMemo(() => {
    const filtered = category ? inMode.filter((p) => p.category === category) : inMode
    const price = (p: ProductCardType) => {
      const pr = getPricingForLocale(p, locale)
      return pr.discounted ?? pr.original
    }
    const sorted = [...filtered]
    if (sort === 'price-asc') sorted.sort((a, b) => price(a) - price(b))
    else if (sort === 'price-desc') sorted.sort((a, b) => price(b) - price(a))
    return sorted
  }, [inMode, category, sort, locale])

  const modes: Array<{ value: Mode; tr: string; en: string }> = [
    { value: 'all', tr: 'Tümü', en: 'All' },
    { value: 'limited', tr: 'Sınırlı Tahsis', en: 'Limited Allocation' },
    { value: 'standing', tr: 'Daimi Envanter', en: 'Standing Inventory' },
  ]

  const chip = (active: boolean) =>
    `focus-bureau border px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-wider transition-colors ${
      active
        ? 'border-bureau-black bg-bureau-black text-bureau-white'
        : 'border-bureau-rule text-bureau-muted hover:border-bureau-black hover:text-bureau-black'
    }`

  return (
    <div>
      {/* Süzgeçler */}
      <div className="flex flex-col gap-3 border-b border-bureau-rule px-5 py-4 md:px-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label={tr ? 'Satış rejimi' : 'Sale mode'} className="flex flex-wrap gap-1.5">
            {modes.map((m) => (
              <button
                key={m.value}
                type="button"
                aria-pressed={mode === m.value}
                onClick={() => {
                  setMode(m.value)
                  setCategory(null)
                  setShown(PAGE_SIZE)
                }}
                className={chip(mode === m.value)}
              >
                {tr ? m.tr : m.en}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10.5px] tabular-nums text-bureau-muted" aria-live="polite">
              {list.length} {tr ? 'kayıt' : list.length === 1 ? 'record' : 'records'}
            </span>
            <label className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-wider text-bureau-muted">
              {tr ? 'Sırala' : 'Sort'}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="focus-bureau border border-bureau-rule bg-bureau-white px-2 py-1 font-mono text-[10.5px] uppercase tracking-wider text-bureau-black"
              >
                <option value="registry">{tr ? 'Sicil no' : 'Register no.'}</option>
                <option value="price-asc">{tr ? 'Fiyat: artan' : 'Price: low to high'}</option>
                <option value="price-desc">{tr ? 'Fiyat: azalan' : 'Price: high to low'}</option>
              </select>
            </label>
          </div>
        </div>
        {classCounts.length > 0 && (
          <div role="group" aria-label={tr ? 'Sınıf' : 'Class'} className="flex flex-wrap gap-1.5">
            <button
              type="button"
              aria-pressed={category === null}
              onClick={() => {
                setCategory(null)
                setShown(PAGE_SIZE)
              }}
              className={chip(category === null)}
            >
              {tr ? 'Tüm sınıflar' : 'All classes'}
            </button>
            {classCounts.map(({ cls, count }) => (
              <button
                key={cls.value}
                type="button"
                aria-pressed={category === cls.value}
                onClick={() => {
                  setCategory(cls.value)
                  setShown(PAGE_SIZE)
                }}
                className={chip(category === cls.value)}
              >
                <span className="text-bureau-amber">{cls.code}</span> {tr ? cls.tr : cls.en}{' '}
                <span className="tabular-nums opacity-60">{String(count).padStart(2, '0')}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Kartlar */}
      <div className="px-5 py-6 md:px-9 md:py-8">
        {list.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <span className="-rotate-3 border-2 border-bureau-amber px-4 py-2 font-mono text-[12px] font-semibold uppercase tracking-widest text-bureau-amber">
              {tr ? 'Bu dosyada kayıt yok' : 'No records in this file'}
            </span>
          </div>
        ) : (
          <>
            <div className="product-file-grid">
              {list.slice(0, shown).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
            {list.length > shown && (
              <div className="mt-8 flex justify-center">
                <button type="button" onClick={() => setShown((n) => n + PAGE_SIZE)} className="btn-file focus-bureau">
                  <span>
                    {tr ? 'Daha fazla göster' : 'Show more'} ({Math.min(PAGE_SIZE, list.length - shown)} / {list.length - shown})
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
