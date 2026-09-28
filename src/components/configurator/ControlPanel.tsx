'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useConfiguratorStore, MAX_BODY_LAYERS } from '@/lib/store/configurator'
import { SlotPicker } from './SlotPicker'
import { MaterialPicker } from './MaterialPicker'
import { getLocalizedValue } from '@/lib/sanity'

type Tab = 'base' | 'body' | 'head'

/**
 * Önceden taban/gövde/başlık aynı kayan panelde üst üste duruyordu —
 * kullanıcı geri bildirimlerine göre bu kafa karıştırıcı bulunuyordu.
 * Artık üç ayrı sekme: kullanıcı Taban'da başlıyor, malzeme seçince
 * otomatik olarak Gövde'ye geçiyor; Gövde opsiyonel/çoklu-ekleme
 * olduğu için "Devam Et" butonuyla kendi kararıyla Başlık'a geçiyor.
 */
export function ControlPanel() {
  const locale = useLocale()
  const tr = locale === 'tr'
  const [activeTab, setActiveTab] = useState<Tab>('base')

  const availableParts = useConfiguratorStore((s) => s.availableParts)
  const base = useConfiguratorStore((s) => s.base)
  const body = useConfiguratorStore((s) => s.body)
  const head = useConfiguratorStore((s) => s.head)
  const iotEnabled = useConfiguratorStore((s) => s.iotEnabled)
  const hardwareFees = useConfiguratorStore((s) => s.hardwareFees)
  const toggleSinglePart = useConfiguratorStore((s) => s.toggleSinglePart)
  const addBodyPart = useConfiguratorStore((s) => s.addBodyPart)
  const removeBodyLayer = useConfiguratorStore((s) => s.removeBodyLayer)
  const selectMaterial = useConfiguratorStore((s) => s.selectMaterial)
  const getSelectedPart = useConfiguratorStore((s) => s.getSelectedPart)
  const getBodyPartCount = useConfiguratorStore((s) => s.getBodyPartCount)
  const toggleIot = useConfiguratorStore((s) => s.toggleIot)

  const bodyAtMax = body.length >= MAX_BODY_LAYERS
  const baseComplete = !!base.partId && !!base.materialId
  const headComplete = !!head.partId && !!head.materialId

  const hardwareFeeLabel =
    locale === 'tr'
      ? iotEnabled
        ? `Donanım Tahsisi: ₺${(hardwareFees.baseTRY + hardwareFees.iotTRY).toLocaleString('tr-TR')} (₺${hardwareFees.baseTRY.toLocaleString('tr-TR')} + ₺${hardwareFees.iotTRY.toLocaleString('tr-TR')} IoT)`
        : `Donanım Tahsisi: ₺${hardwareFees.baseTRY.toLocaleString('tr-TR')}`
      : iotEnabled
        ? `Hardware Allocation: $${hardwareFees.baseUSD + hardwareFees.iotUSD} ($${hardwareFees.baseUSD} + $${hardwareFees.iotUSD} IoT)`
        : `Hardware Allocation: $${hardwareFees.baseUSD}`

  if (availableParts.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <span className="font-mono text-[11px] uppercase text-bureau-muted">
          {tr ? 'Parçalar yükleniyor...' : 'Loading parts...'}
        </span>
      </div>
    )
  }

  const TABS: Array<{ key: Tab; label: string; done: boolean }> = [
    { key: 'base', label: tr ? 'Taban' : 'Base', done: baseComplete },
    {
      key: 'body',
      label: (tr ? 'Gövde' : 'Body') + (body.length > 0 ? ` (${body.length})` : ''),
      done: body.length > 0,
    },
    { key: 'head', label: tr ? 'Başlık' : 'Head', done: headComplete },
  ]

  return (
    <div className="space-y-4">
      {/* IoT Toggle */}
      <div className="flex items-center justify-between border border-bureau-rule p-3">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-wide text-bureau-black">
            {tr ? 'Akıllı Cihaz (IoT)' : 'Smart Device (IoT)'}
          </p>
          <span className="font-mono text-[9.5px] text-bureau-muted">{hardwareFeeLabel}</span>
        </div>
        <button
          onClick={toggleIot}
          role="switch"
          aria-checked={iotEnabled}
          className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
            iotEnabled ? 'bg-bureau-amber' : 'bg-bureau-rule'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              iotEnabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Sekme başlıkları */}
      <div className="flex items-center gap-6 border-b border-bureau-black">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setActiveTab(tabItem.key)}
            className={`flex items-center gap-1.5 border-b-2 pb-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
              activeTab === tabItem.key
                ? 'border-bureau-amber text-bureau-black'
                : 'border-transparent text-bureau-muted hover:text-bureau-black'
            }`}
          >
            {tabItem.done && <span className="text-bureau-amber">✓</span>}
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* Taban */}
      {activeTab === 'base' && (
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
              // Taban tamamlanınca otomatik olarak Gövde sekmesine geç.
              setActiveTab('body')
            }}
            dataTutorial="material-base"
          />
        </div>
      )}

      {/* Gövde */}
      {activeTab === 'body' && (
        <div>
          <SlotPicker
            slotType="body"
            parts={availableParts}
            getPartCount={getBodyPartCount}
            onPartClick={(partId) => addBodyPart(partId)}
            disabled={bodyAtMax}
            dataTutorial="picker-body"
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
                        {tr ? 'Gövde' : 'Body'} {idx + 1} — {partName}
                      </span>
                      {/* Kaldırma ikonu büyütüldü — önceden 10px metin, artık
                          gerçek bir tıklama/dokunma alanı (28x28px) olan bir buton. */}
                      <button
                        onClick={() => removeBodyLayer(idx)}
                        data-tutorial={idx === 0 ? 'remove-body-0' : undefined}
                        aria-label={tr ? 'Bu gövdeyi kaldır' : 'Remove this body'}
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[16px] leading-none text-bureau-muted transition-colors hover:bg-red-50 hover:text-red-600"
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

          <button
            onClick={() => setActiveTab('head')}
            data-tutorial="continue-to-head"
            className="btn-bureau mt-4 w-full"
          >
            {body.length === 0
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
      {activeTab === 'head' && (
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