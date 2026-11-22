'use client'

import Image from 'next/image'
import { useLocale } from 'next-intl'
import { useConfiguratorStore } from '@/lib/store/configurator'
import { getLocalizedValue, formatPrice } from '@/lib/sanity'
import { MaterialPicker } from './MaterialPicker'

/**
 * "Montajlı model" koleksiyonlarının seçim paneli (sarkıt, aplik, masa
 * lambası). Taban/Gövde/Başlık sekmeleri yerine:
 *   1) Model seçimi: koleksiyonda birden fazla model varsa.
 *   2) Seçili modelin renk seçilebilen HER parçası için ayrı satır:
 *      parça adı ve renkleri. Parça sayısı modelden modele değişebilir.
 * Sabit parçalar (kablo vb.) listelenmez; 3D'de otomatik görünür.
 */
export function ModelPanel({ mobile = false }: { mobile?: boolean }) {
  const locale = useLocale()
  const tr = locale === 'tr'
  const models = useConfiguratorStore((s) => s.models)
  const modelId = useConfiguratorStore((s) => s.modelId)
  const body = useConfiguratorStore((s) => s.body)
  const availableParts = useConfiguratorStore((s) => s.availableParts)
  const selectModel = useConfiguratorStore((s) => s.selectModel)
  const selectMaterial = useConfiguratorStore((s) => s.selectMaterial)

  const currency = tr ? 'TRY' : 'USD'
  const intlLocale = tr ? 'tr-TR' : 'en-US'
  const label = mobile
    ? 'font-mono text-[9.5px] uppercase tracking-widest text-bureau-muted'
    : 'font-mono text-[10.5px] uppercase tracking-wide text-bureau-muted'

  if (models.length === 0) {
    return (
      <div className="border border-dashed border-bureau-rule p-3 text-center">
        <span className="font-mono text-[10.5px] uppercase text-bureau-subtle">
          {tr ? 'Bu koleksiyonda henüz model yok.' : 'No models in this collection yet.'}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {models.length > 1 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className={label}>{tr ? 'Model' : 'Model'}</span>
            <span className="font-mono text-[9.5px] text-bureau-subtle">
              {models.length} {tr ? 'model' : 'models'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={tr ? 'Model seçimi' : 'Model selection'}>
            {models.map((m) => {
              const name = getLocalizedValue(m.name, locale, m.modelId) ?? m.modelId
              const active = m.modelId === modelId
              return (
                <button
                  key={m.modelId}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => selectModel(m.modelId)}
                  title={name}
                  className={`focus-bureau flex w-[100px] flex-col items-stretch border p-1 text-left transition-colors ${
                    active ? 'border-bureau-amber' : 'border-bureau-rule hover:border-bureau-black'
                  }`}
                >
                  <div className="flex h-14 w-full items-center justify-center overflow-hidden bg-bureau-surface">
                    {m.thumbnail ? (
                      <Image src={m.thumbnail} alt={name} width={96} height={56} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-mono text-[8px] uppercase text-bureau-subtle">
                        {m.parts.filter((p) => !p.isFixed).length} {tr ? 'renkli parça' : 'color parts'}
                      </span>
                    )}
                  </div>
                  <span className="mt-1 line-clamp-2 font-mono text-[9px] uppercase leading-tight tracking-wide text-bureau-black">
                    {name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {!modelId ? (
        <p className="border border-dashed border-bureau-rule p-3 text-center font-mono text-[10.5px] uppercase text-bureau-subtle">
          {tr ? 'Renkleri seçmek için bir model seçin.' : 'Select a model to choose its colors.'}
        </p>
      ) : (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className={label}>{tr ? 'Parça renkleri' : 'Part colors'}</span>
            <span className="font-mono text-[9.5px] text-bureau-subtle">
              {body.length} {tr ? 'parça' : body.length === 1 ? 'part' : 'parts'}
            </span>
          </div>
          <div className="space-y-1.5">
            {body.map((slot, idx) => {
              const part = availableParts.find((p) => p.partId === slot.partId)
              if (!part) return null
              const partName = getLocalizedValue(part.name, locale, part.partId) ?? part.partId
              const price = (tr ? part.basePriceTRY : part.basePriceUSD) ?? 0
              return (
                <div key={`${modelId}-${idx}`} className="border border-bureau-rule p-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-mono text-[10.5px] uppercase tracking-wide text-bureau-black">
                      <span className="text-bureau-subtle">{String(idx + 1).padStart(2, '0')} · </span>
                      {partName}
                    </span>
                    {price > 0 && (
                      <span className="flex-shrink-0 font-mono text-[9.5px] text-bureau-subtle">
                        {formatPrice(price, currency, intlLocale)}
                      </span>
                    )}
                  </div>
                  <MaterialPicker
                    part={part}
                    selectedMaterialId={slot.materialId}
                    onSelectMaterial={(materialId) => selectMaterial('body', materialId, idx)}
                    compact
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
