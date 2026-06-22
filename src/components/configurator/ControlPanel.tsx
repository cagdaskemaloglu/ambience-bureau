'use client'

import { useLocale } from 'next-intl'
import { useConfiguratorStore, MAX_BODY_LAYERS } from '@/lib/store/configurator'
import { SlotPicker } from './SlotPicker'
import { MaterialPicker } from './MaterialPicker'
import { LightControls } from './LightControls'
import { getLocalizedValue } from '@/lib/sanity'

export function ControlPanel() {
  const locale = useLocale()
  const availableParts = useConfiguratorStore((s) => s.availableParts)
  const base = useConfiguratorStore((s) => s.base)
  const body = useConfiguratorStore((s) => s.body)
  const head = useConfiguratorStore((s) => s.head)
  const toggleSinglePart = useConfiguratorStore((s) => s.toggleSinglePart)
  const addBodyPart = useConfiguratorStore((s) => s.addBodyPart)
  const removeBodyLayer = useConfiguratorStore((s) => s.removeBodyLayer)
  const selectMaterial = useConfiguratorStore((s) => s.selectMaterial)
  const getSelectedPart = useConfiguratorStore((s) => s.getSelectedPart)
  const getBodyPartCount = useConfiguratorStore((s) => s.getBodyPartCount)

  const bodyAtMax = body.length >= MAX_BODY_LAYERS

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
    <div className="space-y-5">
      {/* Base — tekil seçim, toggle */}
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

      {/* Body — çoklu seçim, her tıklama yeni katman ekler */}
      <div className="border-t border-dashed border-bureau-rule pt-4">
        <SlotPicker
          slotType="body"
          parts={availableParts}
          getPartCount={getBodyPartCount}
          onPartClick={(partId) => addBodyPart(partId)}
          disabled={bodyAtMax}
        />

        {/* Eklenen body katmanlarının malzeme seçimi — her biri ayrı ayrı */}
        {body.length > 0 && (
          <div className="mt-4 space-y-3">
            {body.map((slot, idx) => {
              const part = availableParts.find((p) => p.partId === slot.partId)
              if (!part) return null
              const partName = getLocalizedValue(part.name, locale, '—')

              return (
                <div key={idx} className="border border-bureau-rule p-2.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wide text-bureau-muted">
                      {locale === 'tr' ? 'Gövde' : 'Body'} {idx + 1} — {partName}
                    </span>
                    <button
                      onClick={() => removeBodyLayer(idx)}
                      className="font-mono text-[10px] text-bureau-subtle hover:text-bureau-amber"
                      title={locale === 'tr' ? 'Katmanı kaldır' : 'Remove layer'}
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

      {/* Head — tekil seçim, toggle */}
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

      <LightControls />
    </div>
  )
}
