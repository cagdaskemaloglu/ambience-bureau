'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { LIGHT_CLASSES } from '@/lib/lightClasses'

/**
 * Registry filtre çubuğu: solda satış rejimi sekmeleri (Tümü / Sınırlı
 * Tahsis / Daimi Envanter — ?mode=), sağda sınıf seçici (?category=,
 * liste src/lib/lightClasses.ts'ten) ve kayıt sayısı.
 */
const MODES = [
  { value: undefined, tr: 'Tümü', en: 'All' },
  { value: 'limited', tr: 'Sınırlı Tahsis', en: 'Limited Allocation' },
  { value: 'standing', tr: 'Daimi Envanter', en: 'Standing Inventory' },
] as const

export function CategoryFilterBar({ count }: { count: number }) {
  const t = useTranslations('registry')
  const tDoc = useTranslations('docStrip')
  const locale = useLocale()
  const tr = locale === 'tr'
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category')
  const activeMode = searchParams.get('mode')

  function setParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === undefined) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    const query = params.toString()
    router.push(`${pathname}${query ? `?${query}` : ''}`)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bureau-rule px-5 py-2 md:px-9">
      <div role="group" aria-label={tr ? 'Satış rejimi' : 'Sale mode'} className="flex flex-wrap gap-1.5">
        {MODES.map((m) => {
          const isActive = (activeMode ?? undefined) === m.value
          return (
            <button
              key={m.tr}
              type="button"
              aria-pressed={isActive}
              onClick={() => setParam('mode', m.value)}
              className={`focus-bureau border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                isActive
                  ? 'border-bureau-black bg-bureau-black text-bureau-white'
                  : 'border-bureau-rule text-bureau-muted hover:border-bureau-black hover:text-bureau-black'
              }`}
            >
              {tr ? m.tr : m.en}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <span className="whitespace-nowrap font-mono text-[10px] text-bureau-muted">
          {tDoc('objectsOnRecord')}: <span className="text-bureau-amber">{count}</span>
        </span>

        <select
          value={activeCategory ?? ''}
          onChange={(e) => setParam('category', e.target.value === '' ? undefined : e.target.value)}
          aria-label={t('filters.category')}
          className="surface-space-blue border border-bureau-black px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-bureau-black transition-colors dark:border-bureau-dark-line-blue dark:bg-bureau-dark-line-blue dark:text-white hover:border-bureau-amber focus:border-bureau-amber focus:outline-none"
        >
          <option value="" className="bg-bureau-fixed-paper text-black dark:bg-bureau-dark-line-blue dark:text-white">
            {t('filters.allObjects')}
          </option>
          {LIGHT_CLASSES.map((c) => (
            <option
              key={c.value}
              value={c.value}
              className="bg-bureau-fixed-paper text-black dark:bg-bureau-dark-line-blue dark:text-white"
            >
              {c.code} · {tr ? c.tr : c.en}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
