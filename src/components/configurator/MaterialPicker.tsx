'use client'

import { useLocale } from 'next-intl'
import { getLocalizedValue, formatPrice } from '@/lib/sanity'
import type { LampPart } from '@/types'

export function MaterialPicker({
  part,
  selectedMaterialId,
  onSelectMaterial,
  dataTutorial,
  compact,
  hideLabel,
  ringClassName,
}: {
  part: LampPart | undefined
  selectedMaterialId: string | null
  onSelectMaterial: (materialId: string) => void
  /** Tutorial overlay'inin bu bileşeni hedefleyebilmesi için opsiyonel işaret. */
  dataTutorial?: string
  /** Daha küçük daireler ve boşluk — birden fazla gövde kartı alt alta
   *  dizilirken (ControlPanel/MobileControlPanel) 5-6 kartın kaydırma
   *  olmadan sığması için kullanılır. */
  compact?: boolean
  /** "Renk" kategori yazısını ve seçili rengin adını (alt satır) TAMAMEN
   *  gizler — gövde kartlarında thumbnail + renk çemberlerini TEK SATIRA
   *  sığdırmak için kullanılır. Daireler de bu modda daha da küçülür. */
  hideLabel?: boolean
  /** Seçili daireyi saran halkanın rengi — varsayılan amber, gövde
   *  kartlarında daha belirgin olsun diye mavi (`border-blue-500`) geçilir. */
  ringClassName?: string
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
  const ring = ringClassName ?? 'border-bureau-amber'

  return (
    <div className={hideLabel ? '' : compact ? 'mt-1' : 'mt-2'} data-tutorial={dataTutorial}>
      <div className={`flex items-center ${hideLabel ? 'gap-1' : compact ? 'gap-1.5' : 'gap-2'}`}>
        {!hideLabel && (
          <span className="font-mono text-[9px] uppercase tracking-wide text-bureau-muted">
            {locale === 'tr' ? 'Renk' : 'Color'}
          </span>
        )}
        {part.materials.map((material) => {
          const isSelected = selectedMaterialId === material.materialId
          const label = getLocalizedValue(material.label, locale, material.materialId)

          return (
            <button
              key={material.materialId}
              onClick={() => onSelectMaterial(material.materialId)}
              className={`flex-shrink-0 rounded-full border-2 transition-transform ${
                hideLabel ? 'h-4 w-4' : compact ? 'h-5 w-5' : 'h-6 w-6'
              } ${isSelected ? `scale-110 ${ring}` : 'border-bureau-rule hover:border-bureau-black'}`}
              style={{ backgroundColor: material.color }}
              title={label}
              aria-label={label}
            />
          )
        })}
      </div>
      {!hideLabel && selected && (
        <p className={`${compact ? 'mt-0.5' : 'mt-1'} font-mono text-[9.5px] uppercase text-bureau-subtle`}>
          {selectedLabel}
          {selectedPriceMod > 0 && (
            <> — +{formatPrice(selectedPriceMod, locale === 'tr' ? 'TRY' : 'USD', locale === 'tr' ? 'tr-TR' : 'en-US')}</>
          )}
        </p>
      )}
    </div>
  )
}