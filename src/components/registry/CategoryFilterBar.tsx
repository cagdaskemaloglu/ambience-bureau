'use client'

import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'

const CATEGORIES = [
  { value: undefined, key: 'allObjects' as const },
  { value: 'pendant', key: 'pendant' as const },
  { value: 'wall', key: 'wall' as const },
  { value: 'desk', key: 'desk' as const },
  { value: 'floor', key: 'floor' as const },
  { value: 'strip', key: 'strip' as const },
]

export function CategoryFilterBar({ count }: { count: number }) {
  const t = useTranslations('registry')
  const tDoc = useTranslations('docStrip')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category')

  function selectCategory(value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === undefined) {
      params.delete('category')
    } else {
      params.set('category', value)
    }
    const query = params.toString()
    router.push(`${pathname}${query ? `?${query}` : ''}`)
  }

  return (
    <div className="flex items-center justify-end gap-3 px-5 py-2 md:px-9">
      <span className="whitespace-nowrap font-mono text-[10px] text-bureau-muted">
        {tDoc('objectsOnRecord')}: <span className="text-bureau-amber">{count}</span>
      </span>

      <select
        value={activeCategory ?? ''}
        onChange={(e) => selectCategory(e.target.value === '' ? undefined : e.target.value)}
        aria-label={t('filters.category')}
        className="border border-bureau-black bg-white px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-bureau-black transition-colors hover:border-bureau-amber focus:border-bureau-amber focus:outline-none"
      >
        {CATEGORIES.map(({ value, key }) => (
          <option key={key} value={value ?? ''}>
            {t(`filters.${key}` as never)}
          </option>
        ))}
      </select>
    </div>
  )
}