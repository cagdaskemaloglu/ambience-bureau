'use client'

import { useLocale } from 'next-intl'
import Image from 'next/image'
import { getLocalizedValue } from '@/lib/sanity'
import type { LampPart, SlotType } from '@/types'

const SLOT_LABEL: Record<SlotType, { tr: string; en: string }> = {
  base: { tr: 'Taban', en: 'Base' },
  body: { tr: 'Gövde', en: 'Body' },
  head: { tr: 'Başlık', en: 'Head' },
}

/**
 * Bir slot tipi için TÜM parçaları tek bir grid'de gösterir.
 *
 * - base/head: en fazla 1 seçim, aynı parçaya tekrar tıklayınca seçim kalkar (toggle)
 * - body: her tıklama YENİ bir katman ekler, aynı parça birden fazla kez
 *   seçilebilir (sayaç ile gösterilir, örn. "×2")
 */
export function SlotPicker({
  slotType,
  parts,
  isPartSelected,
  getPartCount,
  onPartClick,
  disabled,
}: {
  slotType: SlotType
  parts: LampPart[]
  /** base/head için: bu parça şu an seçili mi? (body'de kullanılmaz) */
  isPartSelected?: (partId: string) => boolean
  /** body için: bu parça kaç katmanda kullanılıyor? */
  getPartCount?: (partId: string) => number
  onPartClick: (partId: string) => void
  disabled?: boolean
}) {
  const locale = useLocale()
  const slotsOfType = parts.filter((p) => p.slotType === slotType)
  const label = SLOT_LABEL[slotType][locale as 'tr' | 'en']

  if (slotsOfType.length === 0) {
    return (
      <div className="border border-dashed border-bureau-rule p-3 text-center">
        <span className="font-mono text-[10.5px] uppercase text-bureau-subtle">
          {locale === 'tr' ? 'Bu koleksiyon için parça yok' : 'No parts available'}
        </span>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10.5px] uppercase tracking-wide text-bureau-muted">
          {label}
        </span>
        {slotType === 'body' && (
          <span className="font-mono text-[9.5px] text-bureau-subtle">
            {locale === 'tr' ? 'Eklemek için tıkla' : 'Click to add'}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {slotsOfType.map((part) => {
          const name = getLocalizedValue(part.name, locale, '—')
          const count = getPartCount?.(part.partId) ?? 0
          const selected = isPartSelected?.(part.partId) ?? count > 0

          return (
            <button
              key={part.partId}
              onClick={() => onPartClick(part.partId)}
              disabled={disabled}
              className={`relative flex flex-col items-center gap-1.5 border p-2 transition-colors ${
                selected
                  ? 'border-bureau-amber bg-bureau-amber/5'
                  : 'border-bureau-rule hover:border-bureau-black'
              } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
              title={name}
            >
              {count > 1 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-bureau-amber font-mono text-[9px] text-white">
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
                  <span className="font-mono text-[8px] text-bureau-subtle">
                    {part.partId.slice(0, 3).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="line-clamp-1 text-center text-[8.5px] uppercase leading-tight">
                {name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}