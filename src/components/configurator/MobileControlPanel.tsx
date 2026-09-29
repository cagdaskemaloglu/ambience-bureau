'use client'

import { useLocale } from 'next-intl'
import { useConfiguratorStore } from '@/lib/store/configurator'
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
  const moveBodyLayer = useConfiguratorStore((s) => s.moveBodyLayer)
  const selectMaterial = useConfiguratorStore((s) => s.selectMaterial)
  const getSelectedPart = useConfiguratorStore((s) => s.getSelectedPart)
  const getBodyPartCount = useConfiguratorStore((s) => s.getBodyPartCount)
  // Gövde sayısı sınırları koleksiyona göre Sanity'den gelir (min/max).
  const bodyLimits = useConfiguratorStore((s) => s.bodyLimits)
  const hasBodySlot = bodyLimits.max > 0 // max 0 → bu koleksiyonda gövde yok, bölüm gizlenir
  const bodyAtMax = body.length >= bodyLimits.max
  const bodyBelowMin = body.length < bodyLimits.min
  const iotEnabled = useConfiguratorStore((s) => s.iotEnabled)
  const hardwareFees = useConfiguratorStore((s) => s.hardwareFees)
  const toggleIot = useConfiguratorStore((s) => s.toggleIot)
  const iotPrice =
    locale === 'tr'
      ? iotEnabled
        ? `Donanım Tahsisi: ₺${(hardwareFees.baseTRY + hardwareFees.iotTRY).toLocaleString('tr-TR')} (₺${hardwareFees.baseTRY.toLocaleString('tr-TR')} + ₺${hardwareFees.iotTRY.toLocaleString('tr-TR')} IoT)`
        : `Donanım Tahsisi: ₺${hardwareFees.baseTRY.toLocaleString('tr-TR')}`
      : iotEnabled
        ? `Hardware Allocation: $${hardwareFees.baseUSD + hardwareFees.iotUSD} ($${hardwareFees.baseUSD} + $${hardwareFees.iotUSD} IoT)`
        : `Hardware Allocation: $${hardwareFees.baseUSD}`

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

      {/* IoT Toggle — en üstte */}
      <div className="border-b border-bureau-rule px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="block font-mono text-[9.5px] uppercase tracking-wide text-bureau-black">
              {locale === 'tr' ? 'Akıllı Cihaz (IoT)' : 'Smart Device (IoT)'}
            </span>
            <span className="font-mono text-[9px] text-bureau-muted">{iotPrice}</span>
          </div>
          <button
            onClick={toggleIot}
            className={`relative h-5 w-9 flex-shrink-0 border transition-colors ${
              iotEnabled ? 'border-bureau-amber bg-bureau-amber' : 'border-bureau-rule bg-white'
            }`}
            aria-pressed={iotEnabled}
          >
            <span
              className={`absolute top-0.5 h-3.5 w-3.5 border transition-transform ${
                iotEnabled
                  ? 'translate-x-4 border-white bg-white'
                  : 'translate-x-0.5 border-bureau-rule bg-bureau-subtle'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Base */}
      <Section label={locale === 'tr' ? 'Taban' : 'Base'}>
        <MobileSlotPicker
          slotType="base"
          parts={availableParts}
          isPartSelected={(id) => base.partId === id}
          onPartClick={(id) => toggleSinglePart('base', id)}
          dataTutorial="picker-base"
        />
        <MaterialPicker
          part={getSelectedPart('base')}
          selectedMaterialId={base.materialId}
          onSelectMaterial={(m) => selectMaterial('base', m)}
          dataTutorial="material-base"
        />
      </Section>

      {/* Body */}
      {hasBodySlot && (
      <Section
        label={locale === 'tr' ? 'Gövde' : 'Body'}
        hint={
          (locale === 'tr' ? 'Eklemek için dokun' : 'Tap to add') +
          ` · ${body.length}/${bodyLimits.max}` +
          (bodyLimits.min > 0 ? ` (${locale === 'tr' ? 'en az' : 'min'} ${bodyLimits.min})` : '')
        }
      >
        <MobileSlotPicker
          slotType="body"
          parts={availableParts}
          getPartCount={getBodyPartCount}
          onPartClick={(id) => addBodyPart(id)}
          disabled={bodyAtMax}
          dataTutorial="picker-body"
        />
        {body.map((slot, idx) => {
          const part = availableParts.find((p) => p.partId === slot.partId)
          if (!part) return null
          return (
            <div key={idx} className="mt-1.5 border border-bureau-rule px-1.5 pb-1.5 pt-1">
              <div className="mb-0.5 flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 truncate font-mono text-[9px] uppercase text-bureau-muted">
                  {locale === 'tr' ? 'Gövde' : 'Body'} {idx + 1} — {getLocalizedValue(part.name, locale, '—')}
                </span>
                {/* Sağda üç dokunma alanı: Yukarı / Aşağı / Kaldır — dizideki
                    sıra 3D viewer'daki dikey istifleme sırasıyla aynı. */}
                <div className="flex flex-shrink-0 items-center gap-0.5">
                  <button
                    onClick={() => moveBodyLayer(idx, 'up')}
                    disabled={idx === 0}
                    aria-label={locale === 'tr' ? 'Yukarı taşı' : 'Move up'}
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center text-[11px] leading-none text-bureau-subtle disabled:pointer-events-none disabled:opacity-20"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveBodyLayer(idx, 'down')}
                    disabled={idx === body.length - 1}
                    aria-label={locale === 'tr' ? 'Aşağı taşı' : 'Move down'}
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center text-[11px] leading-none text-bureau-subtle disabled:pointer-events-none disabled:opacity-20"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => removeBodyLayer(idx)}
                    data-tutorial={idx === 0 ? 'remove-body-0' : undefined}
                    aria-label={locale === 'tr' ? 'Bu gövdeyi kaldır' : 'Remove this body'}
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center text-[12px] leading-none text-bureau-subtle hover:text-bureau-amber"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <MaterialPicker
                part={part}
                selectedMaterialId={slot.materialId}
                onSelectMaterial={(m) => selectMaterial('body', m, idx)}
                compact
              />
            </div>
          )
        })}
        {bodyBelowMin && (
          <p className="mt-2 font-mono text-[9px] uppercase text-bureau-amber">
            {locale === 'tr'
              ? `En az ${bodyLimits.min} gövde ekleyin.`
              : `Add at least ${bodyLimits.min} bod${bodyLimits.min === 1 ? 'y' : 'ies'}.`}
          </p>
        )}
      </Section>
      )}

      {/* Head */}
      <Section label={locale === 'tr' ? 'Başlık' : 'Head'}>
        <MobileSlotPicker
          slotType="head"
          parts={availableParts}
          isPartSelected={(id) => head.partId === id}
          onPartClick={(id) => toggleSinglePart('head', id)}
          dataTutorial="picker-head"
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