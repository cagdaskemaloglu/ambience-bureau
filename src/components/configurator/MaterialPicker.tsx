'use client'

import { useLocale } from 'next-intl'
import { getLocalizedValue, formatPrice } from '@/lib/sanity'
import type { LampPart } from '@/types'

export function MaterialPicker({
  part,
  selectedMaterialId,
  onSelectMaterial,
}: {
  part: LampPart | undefined
  selectedMaterialId: string | null
  onSelectMaterial: (materialId: string) => void
}) {
  const locale = useLocale()

  if (!part) return null

  return (
    <div className="mt-3">
      <span className="font-mono text-[10.5px] uppercase tracking-wide text-bureau-muted">
        {locale === 'tr' ? 'Malzeme' : 'Material'}
      </span>
      <div className="mt-2 flex flex-wrap gap-2">
        {part.materials.map((material) => {
          const isSelected = selectedMaterialId === material.materialId
          const label = getLocalizedValue(material.label, locale, material.materialId)

          return (
            <button
              key={material.materialId}
              onClick={() => onSelectMaterial(material.materialId)}
              className={`flex items-center gap-2 border px-2.5 py-1.5 transition-colors ${
                isSelected
                  ? 'border-bureau-amber bg-bureau-amber/5'
                  : 'border-bureau-rule hover:border-bureau-black'
              }`}
              title={label}
            >
              <span
                className="h-3.5 w-3.5 flex-shrink-0 border border-bureau-rule"
                style={{ backgroundColor: material.color }}
              />
              <span className="text-[10.5px] uppercase leading-none">{label}</span>
              {(locale === 'tr' ? material.priceModifierTRY : material.priceModifierUSD) > 0 && (
                <span className="font-mono text-[9.5px] text-bureau-subtle">
                  +{formatPrice(
                    locale === 'tr' ? material.priceModifierTRY : material.priceModifierUSD,
                    locale === 'tr' ? 'TRY' : 'USD',
                    locale === 'tr' ? 'tr-TR' : 'en-US'
                  )}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
