'use client'

import { useLocale } from 'next-intl'
import { useConfiguratorStore, MAX_BODY_LAYERS } from '@/lib/store/configurator'
import { SlotPicker } from './SlotPicker'
import { MaterialPicker } from './MaterialPicker'
import { getLocalizedValue } from '@/lib/sanity'

const IOT_PRICE_TRY = 1200
const IOT_PRICE_USD = 33

export function ControlPanel() {
  const locale = useLocale()
  const availableParts = useConfiguratorStore((s) => s.availableParts)
  const base = useConfiguratorStore((s) => s.base)
  const body = useConfiguratorStore((s) => s.body)
  const head = useConfiguratorStore((s) => s.head)
  const iotEnabled = useConfiguratorStore((s) => s.iotEnabled)
  const toggleSinglePart = useConfiguratorStore((s) => s.toggleSinglePart)
  const addBodyPart = useConfiguratorStore((s) => s.addBodyPart)
  const removeBodyLayer = useConfiguratorStore((s) => s.removeBodyLayer)
  const selectMaterial = useConfiguratorStore((s) => s.selectMaterial)
  const getSelectedPart = useConfiguratorStore((s) => s.getSelectedPart)
  const getBodyPartCount = useConfiguratorStore((s) => s.getBodyPartCount)
  const toggleIot = useConfiguratorStore((s) => s.toggleIot)

  const bodyAtMax = body.length >= MAX_BODY_LAYERS
  const iotPrice = locale === 'tr' ? `₺${IOT_PRICE_TRY.toLocaleString('tr-TR')}` : `$${IOT_PRICE_USD}`

  if (availableParts.length === 0) {
    return (
      <div className="border border-dashed border-bureau-rule p-6 text-center">
        <span className="font-mono text-[11px] uppercase text-bureau-subtle">
          Select a collection to begin
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* IoT Toggle — en üstte */}
      <div className="border-b border-bureau-black pb-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="block font-mono text-[10.5px] uppercase tracking-wide text-bureau-black">
              {locale === 'tr' ? 'Akıllı Cihaz (IoT)' : 'Smart Device (IoT)'}
            </span>
            <span className="font-mono text-[9.5px] text-bureau-muted">{iotPrice}</span>
          </div>
          <button
            onClick={toggleIot}
            className={`relative h-6 w-11 flex-shrink-0 border transition-colors ${
              iotEnabled ? 'border-bureau-amber bg-bureau-amber' : 'border-bureau-rule bg-white'
            }`}
            aria-pressed={iotEnabled}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 border transition-transform ${
                iotEnabled
                  ? 'translate-x-5 border-white bg-white'
                  : 'translate-x-0 border-bureau-rule bg-bureau-subtle'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Base */}
      <div>
        <SlotPicker
          slotType="base"
          parts={availableParts}
          isPartSelected={(partId) => base.partId === partId}
          onPartClick={(partId) => toggleSinglePart('base', partId)}
        />
        <MaterialPicker
          part={getSelectedPart('base')}
          selectedMaterialId={base.materialId}
          onSelectMaterial={(materialId) => selectMaterial('base', materialId)}
        />
      </div>

      {/* Body */}
      <div className="border-t border-dashed border-bureau-rule pt-4">
        <SlotPicker
          slotType="body"
          parts={availableParts}
          getPartCount={getBodyPartCount}
          onPartClick={(partId) => addBodyPart(partId)}
          disabled={bodyAtMax}
        />
        {body.length > 0 && (
          <div className="mt-3 space-y-2">
            {body.map((slot, idx) => {
              const part = availableParts.find((p) => p.partId === slot.partId)
              if (!part) return null
              const partName = getLocalizedValue(part.name, locale, '—')
              return (
                <div key={idx} className="border border-bureau-rule p-2">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-mono text-[9.5px] uppercase tracking-wide text-bureau-muted">
                      {locale === 'tr' ? 'Gövde' : 'Body'} {idx + 1} — {partName}
                    </span>
                    <button
                      onClick={() => removeBodyLayer(idx)}
                      className="font-mono text-[10px] text-bureau-subtle hover:text-bureau-amber"
                    >
                      ✕
                    </button>
                  </div>
                  <MaterialPicker
                    part={part}
                    selectedMaterialId={slot.materialId}
                    onSelectMaterial={(materialId) => selectMaterial('body', materialId, idx)}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Head */}
      <div className="border-t border-dashed border-bureau-rule pt-4">
        <SlotPicker
          slotType="head"
          parts={availableParts}
          isPartSelected={(partId) => head.partId === partId}
          onPartClick={(partId) => toggleSinglePart('head', partId)}
        />
        <MaterialPicker
          part={getSelectedPart('head')}
          selectedMaterialId={head.materialId}
          onSelectMaterial={(materialId) => selectMaterial('head', materialId)}
        />
      </div>

    </div>
  )
}