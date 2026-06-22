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
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
      {collections.map((collection) => {
        const key = collection.key.current
        const name = getLocalizedValue(collection.name, locale, '—')
        const isActive = activeKey === key

        return (
          <button
            key={collection._id}
            onClick={() => onSelect(key)}
            className={`flex min-w-0 flex-col gap-2 border p-3 text-left transition-colors ${
              isActive
                ? 'border-bureau-amber bg-bureau-amber/5'
                : 'border-bureau-black hover:bg-bureau-surface'
            }`}
          >
            <div className="flex aspect-square w-full items-center justify-center overflow-hidden bg-bureau-surface">
              {collection.coverImage ? (
                <Image
                  src={urlFor(collection.coverImage).width(160).height(160).fit('max').url()}
                  alt={name ?? ''}
                  width={160}
                  height={160}
                  className="h-full w-full object-contain p-3"
                />
              ) : (
                <span className="font-mono text-[10px] uppercase text-bureau-subtle">No Image</span>
              )}
            </div>
            <span
              className={`line-clamp-2 w-full break-words text-[11px] uppercase leading-tight tracking-wide ${
                isActive ? 'font-semibold text-bureau-amber' : ''
              }`}
            >
              {name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
