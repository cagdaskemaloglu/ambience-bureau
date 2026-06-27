'use client'

import { useLocale } from 'next-intl'
import Image from 'next/image'
import { getLocalizedValue } from '@/lib/sanity'
import type { LampPart, SlotType } from '@/types'

export function MobileSlotPicker({
  slotType,
  parts,
  isPartSelected,
  getPartCount,
  onPartClick,
  disabled,
}: {
  slotType: SlotType
  parts: LampPart[]
  isPartSelected?: (partId: string) => boolean
  getPartCount?: (partId: string) => number
  onPartClick: (partId: string) => void
  disabled?: boolean
}) {
  const locale = useLocale()
  const slotsOfType = parts.filter((p) => p.slotType === slotType)

  if (slotsOfType.length === 0) {
    return (
      <span className="font-mono text-[9px] uppercase text-bureau-subtle">
        {locale === 'tr' ? 'Parça yok' : 'No parts'}
      </span>
    )
  }

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {slotsOfType.map((part) => {
        const name = getLocalizedValue(part.name, locale, '—')
        const count = getPartCount?.(part.partId) ?? 0
        const selected = isPartSelected?.(part.partId) ?? count > 0

        return (
          <button
            key={part.partId}
            onClick={() => onPartClick(part.partId)}
            disabled={disabled}
            title={name}
            className={`relative flex flex-shrink-0 flex-col items-center gap-1 border p-1 transition-colors ${
              selected
                ? 'border-bureau-amber bg-bureau-amber/5'
                : 'border-bureau-rule hover:border-bureau-black'
            } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
          >
            {count > 1 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-bureau-amber font-mono text-[8px] text-white">
                ×{count}
              </span>
            )}
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden bg-bureau-surface">
              {part.thumbnail ? (
                <Image
                  src={part.thumbnail}
                  alt={name ?? ''}
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-mono text-[7px] text-bureau-subtle">
                  {part.partId.slice(0, 3).toUpperCase()}
                </span>
              )}
            </div>
            <span className="w-9 truncate text-center text-[8px] uppercase leading-none">
              {name}
            </span>
          </button>
        )
      })}
    </div>
  )
}