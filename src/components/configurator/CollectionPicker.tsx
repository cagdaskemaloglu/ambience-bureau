'use client'

import { useLocale } from 'next-intl'
import Image from 'next/image'
import { urlFor, getLocalizedValue } from '@/lib/sanity'
import type { Collection } from '@/types'

export function CollectionPicker({
  collections,
  activeKey,
  onSelect,
}: {
  collections: Collection[]
  activeKey: string | null
  onSelect: (key: string) => void
}) {
  const locale = useLocale()

  if (collections.length === 0) return null

  return (
    <div className="flex flex-col gap-2.5">
      {collections.map((collection) => {
        const key = collection.key.current
        const name = getLocalizedValue(collection.name, locale, '—')
        const description = getLocalizedValue(collection.description, locale, '')
        const isActive = activeKey === key

        return (
          <button
            key={collection._id}
            onClick={() => onSelect(key)}
            className={`flex w-full items-stretch gap-3 border p-2.5 text-left transition-colors ${
              isActive
                ? 'border-bureau-amber bg-bureau-amber/5'
                : 'border-bureau-black hover:bg-bureau-surface'
            }`}
          >
            {/* Sol: önizleme görseli */}
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden bg-bureau-surface">
              {collection.coverImage ? (
                <Image
                  src={urlFor(collection.coverImage).width(128).height(128).fit('max').url()}
                  alt={name ?? ''}
                  width={64}
                  height={64}
                  className="h-full w-full object-contain p-1.5"
                />
              ) : (
                <span className="font-mono text-[8px] uppercase text-bureau-subtle">No Image</span>
              )}
            </div>

            {/* Sağ: başlık üstte, açıklama altta */}
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
              <span
                className={`line-clamp-1 text-[12px] uppercase leading-tight tracking-wide ${
                  isActive ? 'font-semibold text-bureau-amber' : 'text-bureau-black'
                }`}
              >
                {name}
              </span>
              {description && (
                <span className="line-clamp-2 text-[11px] leading-snug text-bureau-muted">
                  {description}
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}