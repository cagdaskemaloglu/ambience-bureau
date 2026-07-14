'use client'

import { useLocale } from 'next-intl'
import { getLocalizedValue, formatPrice } from '@/lib/sanity'
import type { LampPart } from '@/types'

export function MaterialPicker({
  part,
  selectedMaterialId,
  onSelectMaterial,
  dataTutorial,
}: {
  part: LampPart | undefined
  selectedMaterialId: string | null
  onSelectMaterial: (materialId: string) => void
  /** Tutorial overlay'inin bu bileşeni hedefleyebilmesi için opsiyonel işaret. */
  dataTutorial?: string
}) {
  const locale = useLocale()

  if (!part) return null

  const selected = part.materials.find((m) => m.materialId === selectedMaterialId)
  const selectedLabel = selected ? getLocalizedValue(selected.label, locale, selected.materialId) : ''
  const selectedPriceMod = selected
    ? locale === 'tr'
      ? selected.priceModifierTRY
      : selected.priceModifierUSD
    : 0

  return (
    <div className="mt-2" data-tutorial={dataTutorial}>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-wide text-bureau-muted">
          {locale === 'tr' ? 'Renk' : 'Color'}
        </span>
        {part.materials.map((material) => {
          const isSelected = selectedMaterialId === material.materialId
          const label = getLocalizedValue(material.label, locale, material.materialId)

          return (
            <button
              key={material.materialId}
              onClick={() => onSelectMaterial(material.materialId)}
              className={`h-6 w-6 flex-shrink-0 rounded-full border-2 transition-transform ${
                isSelected ? 'scale-110 border-bureau-amber' : 'border-bureau-rule hover:border-bureau-black'
              }`}
              style={{ backgroundColor: material.color }}
              title={label}
              aria-label={label}
            />
          )
        })}
      </div>
      {selected && (
        <p className="mt-1 font-mono text-[9.5px] uppercase text-bureau-subtle">
          {selectedLabel}
          {selectedPriceMod > 0 && (
            <> — +{formatPrice(selectedPriceMod, locale === 'tr' ? 'TRY' : 'USD', locale === 'tr' ? 'tr-TR' : 'en-US')}</>
          )}
        </p>
      )}
    </div>
  )
}