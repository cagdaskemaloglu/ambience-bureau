'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { useConfiguratorStore } from '@/lib/store/configurator'
import { MobileSlotPicker } from './MobileSlotPicker'
import { MaterialPicker } from './MaterialPicker'
import { ConfigSummary } from './ConfigSummary'
import { getLocalizedValue } from '@/lib/sanity'

type Tab = 'base' | 'body' | 'head'

/**
 * Masaüstündeki ControlPanel.tsx ile BİREBİR AYNI sekme/otomatik-geçiş
 * mantığı — Taban'da başlanır, malzeme seçilince Gövde'ye (veya gövde
 * yoksa Başlık'a) otomatik geçilir; Gövde'den "Devam Et" butonuyla
 * Başlık'a geçilir. data-tutorial selector'ları da masaüstüyle birebir
 * aynı isimde (picker-base, material-base, picker-body, remove-body-0,
 * continue-to-head, picker-head) — CustomRegistryTutorial.tsx bu ikisini
 * (SCOPE_ID_DESKTOP / SCOPE_ID_MOBILE) ekran genişliğine göre ayırıp aynı
 * STEPS listesini kullanıyor; selector isimleri burada değişirse tutorial
 * mobilde hedefi bulamaz.
 */
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
  const tr = locale === 'tr'
  const [activeTab, setActiveTab] = useState<Tab>('base')

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
  const hasBodySlot = bodyLimits.max > 0 // max 0 → bu koleksiyonda gövde yok, sekme gizlenir
  const bodyAtMax = body.length >= bodyLimits.max
  const bodyBelowMin = body.length < bodyLimits.min
  const baseComplete = !!base.partId && !!base.materialId
  const headComplete = !!head.partId && !!head.materialId

  const TABS: Array<{ key: Tab; label: string; done: boolean }> = [
    { key: 'base', label: tr ? 'Taban' : 'Base', done: baseComplete },
    ...(hasBodySlot
      ? [
          {
            key: 'body' as Tab,
            label: (tr ? 'Gövde' : 'Body') + (body.length > 0 ? ` (${body.length})` : ''),
            done: body.length >= Math.max(1, bodyLimits.min),
          },
        ]
      : []),
    { key: 'head', label: tr ? 'Başlık' : 'Head', done: headComplete },
  ]

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


      {/* Sekme başlıkları — masaüstüyle aynı mantık, mobil boyutlarda */}
      <div className="flex items-center gap-4 overflow-x-auto border-b border-bureau-black px-3">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setActiveTab(tabItem.key)}
            className={`flex flex-shrink-0 items-center gap-1 border-b-2 py-2 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              activeTab === tabItem.key
                ? 'border-bureau-amber text-bureau-black'
                : 'border-transparent text-bureau-muted'
            }`}
          >
            {tabItem.done && <span className="text-bureau-amber">✓</span>}
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* Taban */}
      {activeTab === 'base' && (
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
            onSelectMaterial={(m) => {
              selectMaterial('base', m)
              // Taban tamamlanınca otomatik olarak Gövde sekmesine geç
              // (bu koleksiyonda gövde yoksa doğrudan Başlık'a) — masaüstüyle aynı.
              setActiveTab(hasBodySlot ? 'body' : 'head')
            }}
            dataTutorial="material-base"
          />
        </Section>
      )}

      {/* Gövde */}
      {activeTab === 'body' && hasBodySlot && (
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
            const partName = getLocalizedValue(part.name, locale, '—') ?? '—'
            return (
              // Tek satır: küçük thumbnail + (adı yazılmayan) renk
              // çemberleri thumbnail'in yanında + sağda Yukarı/Aşağı/
              // Kaldır — parça adı artık metin olarak değil, sadece
              // thumbnail + hover/dokunma tooltip (title) ile belirtiliyor.
              <div key={idx} className="mt-1.5 flex items-center gap-1.5 border border-bureau-rule px-1.5 py-1">
                <div
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden bg-bureau-surface"
                  title={partName}
                >
                  {part.thumbnail ? (
                    <Image
                      src={part.thumbnail}
                      alt={partName}
                      width={28}
                      height={28}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-mono text-[6px] text-bureau-subtle">
                      {part.partId.slice(0, 3).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1 overflow-x-auto">
                  <MaterialPicker
                    part={part}
                    selectedMaterialId={slot.materialId}
                    onSelectMaterial={(m) => selectMaterial('body', m, idx)}
                    compact
                    hideLabel
                    ringClassName="border-blue-500"
                  />
                </div>

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
            )
          })}
          {bodyBelowMin && (
            <p className="mt-2 font-mono text-[9px] uppercase text-bureau-amber">
              {locale === 'tr'
                ? `En az ${bodyLimits.min} gövde ekleyin.`
                : `Add at least ${bodyLimits.min} bod${bodyLimits.min === 1 ? 'y' : 'ies'}.`}
            </p>
          )}

          {/* "Devam Et: Başlık" — masaüstündekiyle aynı data-tutorial
              ("continue-to-head"), tutorial bu adımı bekliyor. */}
          <button
            onClick={() => setActiveTab('head')}
            disabled={bodyBelowMin}
            data-tutorial="continue-to-head"
            className={`btn-bureau mt-3 w-full text-[10px] ${bodyBelowMin ? 'cursor-not-allowed opacity-40' : ''}`}
          >
            {bodyBelowMin
              ? locale === 'tr'
                ? `En az ${bodyLimits.min} gövde ekleyin`
                : `Add at least ${bodyLimits.min} bod${bodyLimits.min === 1 ? 'y' : 'ies'}`
              : body.length === 0
                ? locale === 'tr'
                  ? 'Gövde Eklemeden Devam Et →'
                  : 'Continue Without Body →'
                : locale === 'tr'
                  ? 'Devam Et: Başlık →'
                  : 'Continue: Head →'}
          </button>
        </Section>
      )}

      {/* Başlık */}
      {activeTab === 'head' && (
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
      )}

      {/* Summary + kaydet — sekmelerden BAĞIMSIZ, her zaman görünür
          (masaüstünde de ConfigSummary sekme alanının dışında, ayrı bir
          sabit alanda — bkz. CustomRegistryClient.tsx). */}
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
