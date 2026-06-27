'use client'

import { useLocale } from 'next-intl'
import { useConfiguratorStore, MAX_BODY_LAYERS } from '@/lib/store/configurator'
import { MobileSlotPicker } from './MobileSlotPicker'
import { MaterialPicker } from './MaterialPicker'
import { ConfigSummary } from './ConfigSummary'
import { getLocalizedValue } from '@/lib/sanity'

export function MobileControlPanel({
  onClearCollection,
  onRegister,
  isSaving,
  saveError,
  saveSuccess,
  onGoCart,
}: {
  onClearCollection: () => void
  onRegister: () => void
  isSaving: boolean
  saveError: string | null
  saveSuccess: string | null
  onGoCart: () => void
}) {
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

  return (
    <div className="flex flex-col">
      {/* Koleksiyon değiştir */}
      <div className="flex items-center border-b border-bureau-rule px-3 py-2">
        <button
          onClick={onClearCollection}
          className="font-mono text-[9.5px] uppercase tracking-wide text-bureau-muted hover:text-bureau-amber"
        >
          ← {locale === 'tr' ? 'Koleksiyon' : 'Collection'}
        </button>
      </div>

      {/* Base */}
      <Section label={locale === 'tr' ? 'Taban' : 'Base'}>
        <MobileSlotPicker
          slotType="base"
          parts={availableParts}
          isPartSelected={(id) => base.partId === id}
          onPartClick={(id) => toggleSinglePart('base', id)}
        />
        <MaterialPicker
          part={getSelectedPart('base')}
          selectedMaterialId={base.materialId}
          onSelectMaterial={(m) => selectMaterial('base', m)}
        />
      </Section>

      {/* Body */}
      <Section
        label={locale === 'tr' ? 'Gövde' : 'Body'}
        hint={locale === 'tr' ? 'Eklemek için dokun' : 'Tap to add'}
      >
        <MobileSlotPicker
          slotType="body"
          parts={availableParts}
          getPartCount={getBodyPartCount}
          onPartClick={(id) => addBodyPart(id)}
          disabled={bodyAtMax}
        />
        {body.map((slot, idx) => {
          const part = availableParts.find((p) => p.partId === slot.partId)
          if (!part) return null
          return (
            <div key={idx} className="mt-2 border border-bureau-rule px-2 pb-2 pt-1.5">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase text-bureau-muted">
                  {locale === 'tr' ? 'Gövde' : 'Body'} {idx + 1} — {getLocalizedValue(part.name, locale, '—')}
                </span>
                <button
                  onClick={() => removeBodyLayer(idx)}
                  className="font-mono text-[9px] text-bureau-subtle hover:text-bureau-amber"
                >
                  ✕
                </button>
              </div>
              <MaterialPicker
                part={part}
                selectedMaterialId={slot.materialId}
                onSelectMaterial={(m) => selectMaterial('body', m, idx)}
              />
            </div>
          )
        })}
      </Section>

      {/* Head */}
      <Section label={locale === 'tr' ? 'Başlık' : 'Head'}>
        <MobileSlotPicker
          slotType="head"
          parts={availableParts}
          isPartSelected={(id) => head.partId === id}
          onPartClick={(id) => toggleSinglePart('head', id)}
        />
        <MaterialPicker
          part={getSelectedPart('head')}
          selectedMaterialId={head.materialId}
          onSelectMaterial={(m) => selectMaterial('head', m)}
        />
      </Section>

      {/* Summary + kaydet */}
      <div className="border-t border-bureau-rule px-3 py-3">
        <ConfigSummary onRegister={onRegister} />
        {isSaving && (
          <p className="mt-2 text-center font-mono text-[10px] uppercase text-bureau-muted">
            {locale === 'tr' ? 'Kaydediliyor...' : 'Saving...'}
          </p>
        )}
        {saveError && (
          <p className="mt-2 text-center text-[11px] text-red-600">{saveError}</p>
        )}
        {saveSuccess && (
          <div className="mt-2 border border-bureau-amber bg-bureau-amber/5 p-2.5 text-center">
            <p className="font-mono text-[10px] uppercase tracking-wide text-bureau-amber">
              {locale === 'tr' ? 'Kayıt Onaylandı' : 'Registration Confirmed'}
            </p>
            <p className="mt-0.5 text-[11px]">{saveSuccess}</p>
            <button onClick={onGoCart} className="btn-bureau-outline mt-2 w-full text-[10px]">
              {locale === 'tr' ? 'Sepete Git' : 'Go to Cart'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-bureau-rule px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-widest text-bureau-muted">{label}</span>
        {hint && <span className="font-mono text-[9px] text-bureau-subtle">{hint}</span>}
      </div>
      {children}
    </div>
  )
}