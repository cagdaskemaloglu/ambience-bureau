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
    <div className="flex items-center justify-between gap-4 border-b border-bureau-black px-5 py-4 md:px-9">
      <div className="scrollbar-none flex flex-1 items-center gap-6 overflow-x-auto md:justify-center md:gap-9">
        {CATEGORIES.map(({ value, key }) => {
          const isActive = value === undefined ? !activeCategory : activeCategory === value
          return (
            <button
              key={key}
              onClick={() => selectCategory(value)}
              className={`flex-shrink-0 whitespace-nowrap border-b-2 pb-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                isActive
                  ? 'border-bureau-amber text-bureau-black'
                  : 'border-transparent text-bureau-muted hover:text-bureau-black'
              }`}
            >
              {t(`filters.${key}` as never)}
            </button>
          )
        })}
      </div>

      <div className="hidden flex-shrink-0 whitespace-nowrap font-mono text-[10.5px] text-bureau-muted sm:block">
        {tDoc('objectsOnRecord')}: <span className="text-bureau-amber">{count}</span>
      </div>
    </div>
  )
}