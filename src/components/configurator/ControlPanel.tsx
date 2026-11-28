'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { useConfiguratorStore } from '@/lib/store/configurator'
import { SlotPicker } from './SlotPicker'
import { MaterialPicker } from './MaterialPicker'
import { ModelPanel } from './ModelPanel'
import { IotToggle } from './IotToggle'
import { getLocalizedValue } from '@/lib/sanity'

type Tab = 'base' | 'body' | 'head'

/**
 * Önceden taban/gövde/başlık aynı kayan panelde üst üste duruyordu —
 * kullanıcı geri bildirimlerine göre bu kafa karıştırıcı bulunuyordu.
 * Artık üç ayrı sekme: kullanıcı Taban'da başlıyor, malzeme seçince
 * otomatik olarak Gövde'ye geçiyor; Gövde opsiyonel/çoklu-ekleme
 * olduğu için "Devam Et" butonuyla kendi kararıyla Başlık'a geçiyor.
 */
export function ControlPanel({ hideIot = false }: { hideIot?: boolean } = {}) {
  const locale = useLocale()
  const tr = locale === 'tr'
  // Koleksiyonda seçilebilir taban/başlık parçası yoksa o sekme hiç gösterilmez
  // (ör. sarkıt: sadece başlık; sabit parçalar zaten listelenmez).
  const hasBaseSlot = useConfiguratorStore((s) => s.availableParts.some((p) => p.slotType === 'base'))
  const hasHeadSlot = useConfiguratorStore((s) => s.availableParts.some((p) => p.slotType === 'head'))
  const [activeTab, setActiveTab] = useState<Tab>('base')

  const availableParts = useConfiguratorStore((s) => s.availableParts)
  const base = useConfiguratorStore((s) => s.base)
  const body = useConfiguratorStore((s) => s.body)
  const head = useConfiguratorStore((s) => s.head)
  const bodyLimits = useConfiguratorStore((s) => s.bodyLimits)
  const toggleSinglePart = useConfiguratorStore((s) => s.toggleSinglePart)
  const addBodyPart = useConfiguratorStore((s) => s.addBodyPart)
  const removeBodyLayer = useConfiguratorStore((s) => s.removeBodyLayer)
  const moveBodyLayer = useConfiguratorStore((s) => s.moveBodyLayer)
  const selectMaterial = useConfiguratorStore((s) => s.selectMaterial)
  const getSelectedPart = useConfiguratorStore((s) => s.getSelectedPart)
  const getBodyPartCount = useConfiguratorStore((s) => s.getBodyPartCount)
  const modelMode = useConfiguratorStore((s) => s.layoutMode === 'model')

  // Gövde sayısı sınırları koleksiyona göre Sanity'den gelir (min/max).
  const hasBodySlot = bodyLimits.max > 0 && availableParts.some((p) => p.slotType === 'body') // max 0 ya da gövde parçası yok → sekme gizlenir
  const bodyAtMax = body.length >= bodyLimits.max
  const bodyBelowMin = body.length < bodyLimits.min
  const bodyRangeLabel =
    bodyLimits.min === bodyLimits.max
      ? tr
        ? `tam ${bodyLimits.max}`
        : `exactly ${bodyLimits.max}`
      : bodyLimits.min > 0
        ? tr
          ? `en az ${bodyLimits.min}, en çok ${bodyLimits.max}`
          : `min ${bodyLimits.min}, max ${bodyLimits.max}`
        : tr
          ? `en çok ${bodyLimits.max}`
          : `max ${bodyLimits.max}`
  const baseComplete = !!base.partId && !!base.materialId
  const headComplete = !!head.partId && !!head.materialId

  if (availableParts.length === 0 && !modelMode) {
    return (
      <div className="flex h-40 items-center justify-center">
        <span className="font-mono text-[11px] uppercase text-bureau-muted">
          {tr ? 'Parçalar yükleniyor...' : 'Loading parts...'}
        </span>
      </div>
    )
  }

  const iotToggle = hideIot ? null : <IotToggle />

  // Montajlı model (sarkıt/aplik/masa): sekmeler yerine model + parça renkleri.
  if (modelMode) {
    return (
      <div className="space-y-4">
        {iotToggle}
        <ModelPanel />
      </div>
    )
  }

  const TABS: Array<{ key: Tab; label: string; done: boolean }> = [
    ...(hasBaseSlot ? [{ key: 'base' as Tab, label: tr ? 'Taban' : 'Base', done: baseComplete }] : []),
    ...(hasBodySlot
      ? [
          {
            key: 'body' as Tab,
            label: tr ? 'Gövde' : 'Body',
            done: body.length >= Math.max(1, bodyLimits.min),
          },
        ]
      : []),
    ...(hasHeadSlot ? [{ key: 'head' as Tab, label: tr ? 'Başlık' : 'Head', done: headComplete }] : []),
  ]
  // Seçili sekme bu koleksiyonda yoksa (ör. sarkıtta "Taban") ilk mevcut sekmeye düş.
  const currentTab: Tab = TABS.some((t) => t.key === activeTab) ? activeTab : (TABS[0]?.key ?? 'head')

  return (
    <div className="space-y-4">
      {iotToggle}

      {/* Adımlar: numaralı, tamamlanan adımda onay işareti */}
      <ol className="grid border border-bureau-black" style={{ gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))` }}>
        {TABS.map((tabItem, i) => {
          const on = currentTab === tabItem.key
          return (
            <li key={tabItem.key} className="border-r border-bureau-black last:border-r-0">
              <button
                type="button"
                onClick={() => setActiveTab(tabItem.key)}
                aria-current={on ? 'step' : undefined}
                className={`focus-bureau flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors ${
                  on ? 'bg-bureau-black text-bureau-white' : 'text-bureau-black hover:bg-bureau-surface'
                }`}
              >
                <span
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center font-mono text-[9.5px] ${
                    tabItem.done ? 'bg-bureau-amber text-white' : on ? 'border border-bureau-white/60' : 'border border-bureau-rule text-bureau-muted'
                  }`}
                >
                  {tabItem.done ? '✓' : String(i + 1).padStart(2, '0')}
                </span>
                <span className="truncate font-mono text-[10.5px] uppercase tracking-wider">{tabItem.label}</span>
              </button>
            </li>
          )
        })}
      </ol>

      {/* Taban */}
      {currentTab === 'base' && (
        <div>
          <SlotPicker
            slotType="base"
            parts={availableParts}
            isPartSelected={(partId) => base.partId === partId}
            onPartClick={(partId) => toggleSinglePart('base', partId)}
            dataTutorial="picker-base"
          />
          <MaterialPicker
            part={getSelectedPart('base')}
            selectedMaterialId={base.materialId}
            onSelectMaterial={(materialId) => {
              selectMaterial('base', materialId)
              // Taban tamamlanınca otomatik olarak Gövde sekmesine geç
              // (bu koleksiyonda gövde yoksa doğrudan Başlık'a).
              setActiveTab(hasBodySlot ? 'body' : 'head')
            }}
            dataTutorial="material-base"
          />
        </div>
      )}

      {/* Gövde */}
      {currentTab === 'body' && hasBodySlot && (
        <div>
          <SlotPicker
            slotType="body"
            parts={availableParts}
            getPartCount={getBodyPartCount}
            onPartClick={(partId) => addBodyPart(partId)}
            disabled={bodyAtMax}
            dataTutorial="picker-body"
          />
          <p
            className={`mt-2 font-mono text-[9.5px] uppercase tracking-wide ${
              bodyBelowMin ? 'text-bureau-amber' : 'text-bureau-muted'
            }`}
          >
            {tr ? 'Gövde' : 'Body'}: {body.length} / {bodyLimits.max} ({bodyRangeLabel})
          </p>
          {body.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {body.map((slot, idx) => {
                const part = availableParts.find((p) => p.partId === slot.partId)
                if (!part) return null
                const partName = getLocalizedValue(part.name, locale, '—') ?? '—'
                return (
                  // Tek satır: küçük thumbnail + (adı yazılmayan) renk
                  // çemberleri thumbnail'in yanında + sağda Yukarı/Aşağı/
                  // Kaldır — parça adı artık metin olarak değil, sadece
                  // thumbnail + hover tooltip (title) ile belirtiliyor
                  // (SlotPicker'daki thumbnail-öncelikli dille tutarlı).
                  <div key={idx} className="flex items-center gap-2 border border-bureau-rule p-1.5">
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden bg-bureau-surface"
                      title={partName}
                    >
                      {part.thumbnail ? (
                        <Image
                          src={part.thumbnail}
                          alt={partName}
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-mono text-[6.5px] text-bureau-subtle">
                          {part.partId.slice(0, 3).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 overflow-x-auto">
                      <MaterialPicker
                        part={part}
                        selectedMaterialId={slot.materialId}
                        onSelectMaterial={(materialId) => selectMaterial('body', materialId, idx)}
                        compact
                        hideLabel
                        ringClassName="border-blue-500"
                      />
                    </div>

                    {/* Sağ tarafta üç buton: sırayla Yukarı Taşı / Aşağı
                        Taşı / Kaldır — dizideki sıra 3D viewer'daki dikey
                        istifleme sırasıyla birebir aynı (bkz. LampModel.tsx). */}
                    <div className="flex flex-shrink-0 items-center gap-0.5">
                      <button
                        onClick={() => moveBodyLayer(idx, 'up')}
                        disabled={idx === 0}
                        aria-label={tr ? 'Yukarı taşı' : 'Move up'}
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[12px] leading-none text-bureau-muted transition-colors hover:bg-bureau-subtle hover:text-bureau-black disabled:pointer-events-none disabled:opacity-20"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveBodyLayer(idx, 'down')}
                        disabled={idx === body.length - 1}
                        aria-label={tr ? 'Aşağı taşı' : 'Move down'}
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[12px] leading-none text-bureau-muted transition-colors hover:bg-bureau-subtle hover:text-bureau-black disabled:pointer-events-none disabled:opacity-20"
                      >
                        ▼
                      </button>
                      {/* Kaldırma ikonu — gerçek bir tıklama alanı (24x24px) olan buton. */}
                      <button
                        onClick={() => removeBodyLayer(idx)}
                        data-tutorial={idx === 0 ? 'remove-body-0' : undefined}
                        aria-label={tr ? 'Bu gövdeyi kaldır' : 'Remove this body'}
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[14px] leading-none text-bureau-muted transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <button
            onClick={() => setActiveTab('head')}
            disabled={bodyBelowMin}
            data-tutorial="continue-to-head"
            className={`btn-bureau mt-4 w-full ${bodyBelowMin ? 'cursor-not-allowed opacity-40' : ''}`}
          >
            {bodyBelowMin
              ? tr
                ? `En az ${bodyLimits.min} gövde ekleyin`
                : `Add at least ${bodyLimits.min} bod${bodyLimits.min === 1 ? 'y' : 'ies'}`
              : body.length === 0
                ? tr
                  ? 'Gövde Eklemeden Devam Et →'
                  : 'Continue Without Body →'
                : tr
                  ? 'Devam Et: Başlık →'
                  : 'Continue: Head →'}
          </button>
        </div>
      )}

      {/* Başlık */}
      {currentTab === 'head' && (
        <div>
          <SlotPicker
            slotType="head"
            parts={availableParts}
            isPartSelected={(partId) => head.partId === partId}
            onPartClick={(partId) => toggleSinglePart('head', partId)}
            dataTutorial="picker-head"
          />
          <MaterialPicker
            part={getSelectedPart('head')}
            selectedMaterialId={head.materialId}
            onSelectMaterial={(materialId) => selectMaterial('head', materialId)}
          />
        </div>
      )}
    </div>
  )
}